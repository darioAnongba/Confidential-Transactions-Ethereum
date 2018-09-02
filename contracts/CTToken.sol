pragma solidity ^0.4.24;

import "./alt_bn128.sol";
import "./BulletproofVerifier.sol";
import "./UTXO.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract CTToken is Ownable {
    using SafeMath for uint256;
    using alt_bn128 for uint256;
    using alt_bn128 for alt_bn128.G1Point;

    /* --- Constants --- */
    uint256 public constant m = 16;
    uint256 public constant n = 4;

    string public constant name = "Swiss Franc Token";
    string public constant symbol = "CHFT";

    /* --- Structures and variables --- */
    uint256 public totalSupply;

    // Map of addresses to public keys. To use the system, you must register your PubKey
    mapping (address => uint256[2]) private publicKeys;
    
    // Map of commitments which have been proven to be positive
    mapping (uint256 => bool) public positiveBalances;

    // Balances in the form of compressed Pedersen commitments
    mapping (address => mapping(uint256 => uint256)) private committedBalances;
    mapping (address => uint256) private counters;

    // Used contracts for Proof verification
    BulletproofVerifier private bulletproofVerifier;

    /* --- Events --- */
    event Registration(address indexed from);
    event PCRangeProven (address indexed from, uint256 pc);
    event Transfer(address indexed from, address indexed to, uint256 pc, uint256 id, uint256[3] encryptedData);
    event OutputsSpent(address indexed from, uint256[] ids);

    /* --- Modifiers --- */
    
    /**
    * @dev checks that the PCs has been proven positive
    * @param _pcs Array of PCs to check
    */
    modifier commitmentsAreProven(uint256[2] _pcs) {
        uint256 i;
        for (i = 0; i < _pcs.length; i++) {
            require(positiveBalances[_pcs[i]]);
        }
        _;
    }

    /* --- Public functions --- */
    constructor(address _bulletproofVerifier) public {
        require(_bulletproofVerifier != address(0));
        bulletproofVerifier = BulletproofVerifier(_bulletproofVerifier);
        require(m == bulletproofVerifier.m());
        require(n == bulletproofVerifier.n());
    }

    /**
    * @dev retrieves a public key
    * @param _addr The address
    * @return The public key at the specified address
    */
    function getPublicKey(address _addr) public view returns (uint256[2]) {
        return publicKeys[_addr];
    }

    /**
    * @dev Checks if the user is registered
    * @param _addr The address
    * @return a bool specifying if the user is registered
    */
    function isRegistered(address _addr) public view returns (bool) {
        return (publicKeys[_addr][0] != 0 && publicKeys[_addr][1] != 0);
    }
  
    /**
    * @dev retrieves the PC balance of a user at a specified index
    * @param _addr The address
    * @param _id The id
    * @return The PC for the specified user and id
    */
    function balanceOf(address _addr, uint256 _id) public view returns (uint256) {
        return committedBalances[_addr][_id];
    }

    /**
    * @dev mint tokens to the specified address account.
    * @param _to The address that will receive the minted tokens.
    * @param _pcTo The amount of tokens to mint in compressed PC form
    * @param _encryptedData Encrypted data that should contain "encrypted(value, blinding factor), iv" for each output
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _pcTo, uint256[3] _encryptedData) public onlyOwner returns (bool) {
        // The token issuer cannot mint to itself
        require(_to != owner && _to != address(0));

        // We check that the PC has been proven positive
        require(positiveBalances[_pcTo]);

        // Get next id and send PC to beneficiary
        uint256 id = counters[_to]++;
        committedBalances[_to][id] = _pcTo;
        emit Transfer(owner, _to, _pcTo, id, _encryptedData);

        // Increase total supply
        totalSupply = totalSupply.decompress().add(_pcTo.decompress()).compress();

        return true;
    }

    /**
    * @dev register a new user by storing his public key. This is necessary to decrypt encrypted data
    * @param _pubKey The public key
    * @return A boolean that indicates if the operation was successful.
    */
    function register(uint256[2] _pubKey) public returns (bool) {
        require(_pubKey[0] != 0 && _pubKey[1] != 0);

        publicKeys[msg.sender] = _pubKey;
        emit Registration(msg.sender);
        return true;
    }

    /**
    * @dev transfer token to a specified address. All PCs must have been proved to be positive.
    * @param _to The address to transfer to.
    * @param _pcTo Pedersen commitment for amount to transfer.
    * @param _pcRemaining Pedersen commitment for amount remaining.
    * @param _utxoIds List of UTxOs IDs
    * @param _encryptedData Encrypted data that should contain (value, blinding factor, iv) for each output
    */
    function transfer(
        address _to,
        uint256 _pcTo,
        uint256 _pcRemaining,
        uint256[] _utxoIds,
        uint256[6] _encryptedData) public commitmentsAreProven([_pcTo, _pcRemaining]) returns (bool success) {
    
        // token issuer cannot transfer or receive tokens, only mint them for others
        require(msg.sender != owner && _to != owner && _to != address(0));
        success = internalTransfer(_to, _pcTo, _pcRemaining, _utxoIds, _encryptedData);
    }

    /**
    * @dev withdraw tokens. All PCs must have been proved to be positive. A withdraw is basically a transfer to the token issuer
    * @param _pcWithdraw Pedersen commitment for amount to withdraw.
    * @param _pcRemaining Pedersen commitment for amount remaining.
    * @param _utxoIds List of UTxOs IDs
    * @param _encryptedData Encrypted data that should contain (value, blinding factor, iv) for each output
    */
    function withdraw(
        uint256 _pcWithdraw,
        uint256 _pcRemaining,
        uint256[] _utxoIds,
        uint256[6] _encryptedData) public commitmentsAreProven([_pcWithdraw, _pcRemaining]) returns (bool success) {

        // Token issuer cannot withdraw tokens because it should never have tokens in the first place.
        require(msg.sender != owner);
        success = internalTransfer(owner, _pcWithdraw, _pcRemaining, _utxoIds, _encryptedData);
    }

    /**
    * @dev burn tokens.
    * @param _utxoIds List of UTxOs IDs to burn
    */
    function burn(uint256[] _utxoIds) onlyOwner public returns (bool) {
        if (_utxoIds.length == 0) return true;

        uint256 id;
        uint256 i = 0;
        for (i = 0; i < _utxoIds.length; i++) {
            id = _utxoIds[i];
            committedBalances[owner][id] = 0;
        }

        emit OutputsSpent(owner, _utxoIds);
        return true;
    }

    /**
    * @dev verifies a specific multi range proof (bulletproof)
    */
    function verifyPCRangeProof(
        uint256[] _commitments,
        uint256[8] _coords,
        uint256[5] _scalars,
        uint256[2*n] _lsCoords,
        uint256[2*n] _rsCoords) public returns (bool) {

        require(bulletproofVerifier.verify(_commitments, _coords, _scalars, _lsCoords, _rsCoords));

        uint256 numOfCommitments = _commitments.length / 2;
        alt_bn128.G1Point[] memory input = new alt_bn128.G1Point[](numOfCommitments);
    
        uint256 i = 0;
        for (i = 0; i < numOfCommitments; i++) {
            input[i] = alt_bn128.G1Point(_commitments[2*i], _commitments[2*i + 1]);
            positiveBalances[input[i].compress()] = true;
            emit PCRangeProven(msg.sender, input[i].compress());
        }

        return true;
    }

    /* --- Internal functions --- */

    /**
    * @dev Effectively processes the transfer
    */
    function internalTransfer(
        address _to,
        uint256 _pcTo,
        uint256 _pcRemaining,
        uint256[] _utxoIds,
        uint256[6] _encryptedData) internal returns (bool) {

        require(validateTx(_pcTo, _pcRemaining, _utxoIds));

        // Everything is okay, process transactions
        UTXO.Output[] memory outputs = UTXO.createOutputs(_to, _pcTo, _pcRemaining, _encryptedData);
        require(processTx(outputs));
        emit OutputsSpent(msg.sender, _utxoIds);

        return true;
    }

    /**
    * @dev fetches Pedersen Commitments to use as inputs and create a compiled array
    * @param _idx List of indexes to use as inputs
    */
    function fetchInputCommitments(uint256[] _idx) internal returns (alt_bn128.G1Point sumInputs) {
        require(_idx.length > 0);
        
        uint256 currPC;    
        uint256 i;
        for (i = 0; i < _idx.length; i++) {
            currPC = committedBalances[msg.sender][_idx[i]];
            require(currPC != 0);
      
            sumInputs = sumInputs.add(currPC.decompress());
      
            // Mark Input as spent by changing its value to 0
            committedBalances[msg.sender][_idx[i]] = 0;
        }
    }

    /**
    * @dev Creates new outputs for specific users
    * @param _outputs List of outputs to process
    */
    function processTx(UTXO.Output[] _outputs) internal returns (bool) {
        uint256 i;
        for (i = 0; i < _outputs.length; i++) {
            address to = _outputs[i].to;
            uint256 id = counters[to]++;
            uint256 pc = _outputs[i].pc.compress();
            committedBalances[to][id] = pc;

            emit Transfer(msg.sender, to, pc, id, _outputs[i].encryptedData);
        }

        return true;
    }

    /**
    * @dev Validates a transaction
    * @param _pcTo Pedersen commitment of the transferred amount 
    * @param _pcRemaining Pedersen commitment of the remaining amount
    * @param _utxoIds List of UTXOs IDS
    */
    function validateTx(uint256 _pcTo, uint256 _pcRemaining, uint256[] _utxoIds) internal returns (bool success) {
        // Sum inputs and outputs and invalidate spent inputs
        alt_bn128.G1Point memory sumInputs = fetchInputCommitments(_utxoIds);
        alt_bn128.G1Point memory sumOutputs = _pcTo.decompress().add(_pcRemaining.decompress());

        // Check transaction validity
        success = (sumInputs.X == sumOutputs.X && sumInputs.Y == sumOutputs.Y);
    }
}
