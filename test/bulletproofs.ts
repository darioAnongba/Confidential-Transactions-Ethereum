const BulletproofVerifier = artifacts.require("BulletproofVerifier.sol");
import ECCurve from "../app/libs/prover/curve/ECCurve";
import GeneratorParams from "../app/libs/prover/rangeProof/GeneratorParams";
import Bulletproof from "../app/libs/prover/rangeProof/Bulletproof";
import PedersenCommitment from "../app/libs/prover/commitments/PedersenCommitment";
import CryptoUtils from "../app/libs/prover/utils";

global.data = {
  M: 16
};

contract("BulletproofVerifier", function(accounts) {
  before(async () => {
    global.data.group = new ECCurve("bn256");
    global.data.parameters = GeneratorParams.generate(
      global.data.M,
      global.data.group
    );

    global.data.bulletproofVerifier = await BulletproofVerifier.deployed();
  });

  it("...should create a proof, verify it off-chain, serialize it and verify it on-chain", async () => {
    const bulletproofVerifier = global.data.bulletproofVerifier;
    const parameters = global.data.parameters;
    const M = global.data.M;

    // Create proof and verify off-chain
    const total = 255;
    const value = 210;
    const change = total - value;

    const { witnesses, commitments } = PedersenCommitment.generateMultiple(
      parameters,
      [value, change],
      CryptoUtils.randomNumber()
    );

    const proof = Bulletproof.generate(parameters, witnesses, commitments);
    assert(
      Bulletproof.verify(parameters, proof),
      "Proof not generated correctly"
    );

    // Verify it on-chain
    const { lsCoords, rsCoords } = proof.serializedLRs;
    const result = await bulletproofVerifier.verify.call(
      proof.serializedCommitments,
      proof.serializedCoords,
      proof.serializedScalars,
      lsCoords,
      rsCoords
    );

    assert(result, "Proof is not verified correctly on-chain");

    const gasEstimate = await bulletproofVerifier.verify.estimateGas(
      proof.serializedCommitments,
      proof.serializedCoords,
      proof.serializedScalars,
      lsCoords,
      rsCoords
    );

    console.log(
      "Aggregated proof of " + M + " total bits gas estimate = " + gasEstimate
    );
  });
});
