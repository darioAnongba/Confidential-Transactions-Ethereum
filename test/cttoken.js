const CTToken = artifacts.require("./CTToken.sol");
import HDWalletProvider from "truffle-hdwallet-provider";
import ECCurve from "../app/libs/crypto/ECCurve";
import ParamsGenerator from "../app/libs/crypto/ParamsGenerator";
import {
  getPubKeyAsArray,
  computeSharedSecret,
  getPrivKey,
  getRandom,
  encryptOutput
} from "../app/libs/crypto/cryptoUtils";
import Bulletproof from "../app/libs/crypto/Bulletproof";
import PedersenCommitment from "../app/libs/crypto/commitments/PedersenCommitment";
import BN from "bn.js";

global.data = {
  mnemonic:
    "alone above wave peasant swap price future hand action fine lawn south",
  host: "http://127.0.0.1:7545",
  M: 16,
  N: 4,
  pubKeys: [],
  privKeys: []
};

contract("CTToken", function(accounts) {
  before(async () => {
    global.data.group = new ECCurve("bn256");
    global.data.parameters = ParamsGenerator.generate(
      global.data.M,
      global.data.group
    );

    global.data.cttoken = await CTToken.deployed();
  });

  it("...should register new users public keys", async () => {
    const cttoken = global.data.cttoken;

    const registerPubKey = index => {
      const provider = new HDWalletProvider(
        global.data.mnemonic,
        global.data.host,
        index
      );

      const pubKey = getPubKeyAsArray(provider);
      global.data.pubKeys[index] = pubKey;
      global.data.privKeys[index] = getPrivKey(provider);
      cttoken.register(pubKey, { from: accounts[index] });
    };

    // Register public keys of first X accounts
    for (let i = 0; i < 3; i++) {
      registerPubKey(i);
    }

    const pubKeyRetrieved = await cttoken.getPublicKey.call(accounts[0]);
    assert(
      pubKeyRetrieved[0].cmp(global.data.pubKeys[0][0]) === 0,
      "Value X is not registered correctly"
    );
    assert(
      pubKeyRetrieved[1].cmp(global.data.pubKeys[0][1]) === 0,
      "Value Y is not registered correctly"
    );
  });

  it("...should prove that the PC for 100 and 50 tokens are positive", async () => {
    const parameters = global.data.parameters;
    const cttoken = global.data.cttoken;

    // Create PCs
    const totalBf = getRandom();
    const { witnesses, commitments } = PedersenCommitment.generateMultiple(
      parameters,
      [100, 50],
      totalBf
    );
    global.data.witnesses = witnesses;

    // Create proof and verify off-chain
    const proof = Bulletproof.generate(parameters, witnesses, commitments);
    global.data.proof = proof;
    assert(
      Bulletproof.verify(parameters, proof),
      "Proof not generated correctly"
    );

    // Verify it on-chain via the token contract
    const { lsCoords, rsCoords } = proof.serializedLRs;
    await cttoken.verifyPCRangeProof(
      proof.serializedCommitments,
      proof.serializedCoords,
      proof.serializedScalars,
      lsCoords,
      rsCoords
    );

    // Check that PCs have been added to positiveBalances in their compressed form
    for (let i = 0; i < proof.commitments.size; i++) {
      const isProven = await cttoken.positiveBalances.call(
        "0x" + proof.commitments.get(i).compressedAlt.toString(16)
      );
      assert(isProven, "PC" + i + " not proven correctly");
    }
  });

  it("...should mint 100 and 50 tokens to account 1", async () => {
    const curve = new ECCurve("secp256k1").curveRef;
    global.data.curveSecp256k1 = curve;
    const cttoken = global.data.cttoken;

    // 1. Retrieve account 1 public key from blockchain
    let pubKey = await cttoken.getPublicKey(accounts[1]);

    // 2. Generate a shared secret and encrypt data using AES
    const sharedSecret = computeSharedSecret(curve, global.data.privKeys[0], [
      new BN(pubKey[0].toString(16)).toString(),
      new BN(pubKey[1].toString(16)).toString()
    ]);

    const checkEvents = (
      result,
      encryptedValue,
      encryptedBF,
      iv,
      pcBalance,
      pcOutput
    ) => {
      // Check for events
      assert(
        new BN(encryptedValue, 16).cmp(
          new BN(result.logs[0].args.encryptedData[0].toString(16), 16)
        ) === 0,
        "Mint Event encrypted value error"
      );
      assert(
        new BN(encryptedBF, 16).cmp(
          new BN(result.logs[0].args.encryptedData[1].toString(16), 16)
        ) === 0,
        "Mint Event encrypted bf error"
      );
      assert(
        new BN(iv, 16).cmp(
          new BN(result.logs[0].args.encryptedData[2].toString(16), 16)
        ) === 0,
        "Mint Event iv error"
      );

      // Check balances
      assert.equal(
        pcBalance.toString(16),
        pcOutput.commitment.compressedAlt.toString(16),
        "PC stored and PC sent not equal"
      );
    };

    // 3. For each PC output, encrypt data and mint tokens
    for (let i = 0; i < global.data.witnesses.length; i++) {
      const pcOutput = global.data.witnesses[i];
      const { iv, encryptedValue, encryptedBF } = encryptOutput(
        pcOutput,
        sharedSecret
      );

      const result = await cttoken.mint(
        accounts[1],
        "0x" + pcOutput.commitment.compressedAlt.toString(16),
        ["0x" + encryptedValue, "0x" + encryptedBF, "0x" + iv]
      );
      const pcBalance = await cttoken.balanceOf(accounts[1], i);
      checkEvents(result, encryptedValue, encryptedBF, iv, pcBalance, pcOutput);
    }
  });

  it("...should transfer 120 tokens to account 2 and 30 tokens back to account 1 using id 0 and 1 as inputs", done => {
    const parameters = global.data.parameters;
    const cttoken = global.data.cttoken;

    setTimeout(async () => {
      const totalBf = global.data.totalBf;
      const balance = global.data.balance;
      const ids = global.data.utxoIDs;

      // 1. Create PCs for 120 and 30
      const valueToTransfer = 120;
      const change = balance - valueToTransfer;
      const { witnesses, commitments } = PedersenCommitment.generateMultiple(
        parameters,
        [valueToTransfer, change],
        totalBf
      );

      // 2. Create proof and verify off-chain
      const proof = Bulletproof.generate(parameters, witnesses, commitments);
      assert(
        Bulletproof.verify(parameters, proof),
        "Proof not generated correctly"
      );

      // 3. Verify proof on-chain
      const { lsCoords, rsCoords } = proof.serializedLRs;
      await cttoken.verifyPCRangeProof(
        proof.serializedCommitments,
        proof.serializedCoords,
        proof.serializedScalars,
        lsCoords,
        rsCoords,
        { from: accounts[1] }
      );

      // 4. Encrypt data
      const toPubKey = await cttoken.getPublicKey(accounts[2]);
      const privKey = global.data.privKeys[1];
      const curve = global.data.curveSecp256k1;

      const toSharedSecret = computeSharedSecret(curve, privKey, [
        new BN(toPubKey[0].toString(16)).toString(),
        new BN(toPubKey[1].toString(16)).toString()
      ]);
      const pcToWitness = witnesses[0];
      const toEncryptedData = encryptOutput(pcToWitness, toSharedSecret);

      const pcRemainingWitness = witnesses[1];
      const remainingEncryptedData = encryptOutput(pcRemainingWitness, privKey);

      // 5. Transfer
      await cttoken.transfer(
        accounts[2],
        "0x" + pcToWitness.commitment.compressedAlt.toString(16),
        "0x" + pcRemainingWitness.commitment.compressedAlt.toString(16),
        ids,
        [
          "0x" + toEncryptedData.encryptedValue,
          "0x" + toEncryptedData.encryptedBF,
          "0x" + toEncryptedData.iv,
          "0x" + remainingEncryptedData.encryptedValue,
          "0x" + remainingEncryptedData.encryptedBF,
          "0x" + remainingEncryptedData.iv
        ],
        { from: accounts[1] }
      );

      const pcTransferred = await cttoken.balanceOf(accounts[2], 0);
      assert(
        pcToWitness.commitment.compressedAlt.cmp(
          new BN(pcTransferred.toString(16), 16)
        ) === 0,
        "Transfer to beneficiary failed"
      );

      const pcChange = await cttoken.balanceOf(accounts[1], 2);
      assert(
        pcRemainingWitness.commitment.compressedAlt.cmp(
          new BN(pcChange.toString(16), 16)
        ) === 0,
        "Transfer of change (to myself) failed"
      );

      done();
    }, 2000);
  });

  it("...Get balance of account 1", done => {
    const base = global.data.parameters.base;
    const curve = global.data.curveSecp256k1;
    const cttoken = global.data.cttoken;

    // 1. Get all incoming transfer events
    const transferEvent = cttoken.Transfer(
      { to: accounts[1] },
      { fromBlock: 0, toBlock: "latest" }
    );

    transferEvent.get(async (err, result) => {
      if (err) console.log("Error while fetching incoming events");

      const incomingTxs = [];

      for (let i = 0; i < result.length; i++) {
        const transfer = result[i];
        const pcRetrieved = new BN(transfer.args.pc.toString(16), 16);
        const encryptedData = transfer.args.encryptedData;
        const from = transfer.args.from;

        let sharedSecret;
        if (from === accounts[1]) {
          sharedSecret = global.data.privKeys[1];
        } else {
          const pubKey = await cttoken.getPublicKey(transfer.args.from);
          sharedSecret = computeSharedSecret(
            curve,
            global.data.privKeys[1],
            pubKey
          );
        }

        const pCComputed = PedersenCommitment.decrypt(
          base,
          sharedSecret,
          encryptedData
        );

        if (pcRetrieved.cmp(pCComputed.commitment.compressedAlt) === 0) {
          incomingTxs.push({
            pc: pCComputed,
            id: transfer.args.id.toNumber()
          });
        } else {
          console.log(pcRetrieved);
          console.log(pCComputed.commitment.compressedAlt);
        }
      }

      // Get all spent outputs ids
      const outputSpentEvent = cttoken.OutputsSpent(
        { to: accounts[1] },
        { fromBlock: 0, toBlock: "latest" }
      );

      outputSpentEvent.get((err, result) => {
        if (err) console.log("Error while fetching spent output ids");

        let spentIDs = [];
        result.forEach(event => {
          spentIDs = spentIDs.concat(
            event.args.ids.map(id => {
              return id.toNumber();
            })
          );
        });

        // Filter Spent PCs
        const utxos = incomingTxs.filter(tx => {
          return spentIDs.indexOf(tx.id) === -1;
        });

        // Compute balance
        let balance = 0;
        utxos.forEach(tx => {
          balance += tx.pc.value.toNumber();
        });

        assert.equal(balance, 30, "Balance not retrieved successfully");
      });

      done();
    });
  });
});
