pragma solidity ^0.4.24;

import "./alt_bn128.sol";

library UTXO {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;
  
  // Represents an unspent transaction output
  struct Output {
      address to;
      alt_bn128.G1Point pc;
      uint256[3] encryptedData;
  }
	
  /**
  * @dev create Output Structures from inputs
  * @param _to The address to transfer to.
  * @param _pcTo Pedersen commitment for amount to transfer.
  * @param _pcRemaining Pedersen commitment for amount remaining.
  * @param _encryptedData Encrypted data that should contain (value, blinding factor, iv) for each output
  */
	function createOutputs(address _to, uint256 _pcTo, uint256 _pcRemaining, uint256[6] _encryptedData) internal view returns (Output[] outputTx) {    
    outputTx = new Output[](2);
    
    // Output for recipient
    outputTx[0].to = _to;
    outputTx[0].pc = _pcTo.decompress();
    outputTx[0].encryptedData[0] = _encryptedData[0];
    outputTx[0].encryptedData[1] = _encryptedData[1];
    outputTx[0].encryptedData[2] = _encryptedData[2];

    // Output to myself with remaining
    outputTx[1].to = msg.sender;
    outputTx[1].pc = _pcRemaining.decompress();
    outputTx[1].encryptedData[0] = _encryptedData[3];
    outputTx[1].encryptedData[1] = _encryptedData[4];
    outputTx[1].encryptedData[2] = _encryptedData[5];
	}
}