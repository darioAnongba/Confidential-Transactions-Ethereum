import Contract from "web3/eth/contract";
import Web3 from "web3";
import BN from "bn.js";

import * as types from "./types";
import Wallet from "../model/Wallet";
import { store } from "../store";
import { refreshWallet } from "./wallet";
import Transaction from "../model/Transaction";
import CryptoUtils from "../libs/prover/utils";
import ECCurve from "../libs/prover/curve/ECCurve";
import PedersenCommitment from "../libs/prover/commitments/PedersenCommitment";
import Bulletproof from "../libs/prover/rangeProof/Bulletproof";

export const mint = async (
  dispatch: Function,
  recipient: string,
  amount: number
) => {
  const { web3, token, cryptoParameters } = store.getState().session;

  // 1. Generate PC
  const { witnesses, commitments } = PedersenCommitment.generateMultiple(
    cryptoParameters,
    [amount],
    CryptoUtils.randomNumber()
  );

  // 2. Compute Bulletproof
  const proof = Bulletproof.generate(cryptoParameters, witnesses, commitments);

  // 3. Verify on-chain
  const { lsCoords, rsCoords } = proof.serializedLRs;
  await token.methods
    .verifyPCRangeProof(
      proof.serializedCommitments,
      proof.serializedCoords,
      proof.serializedScalars,
      lsCoords,
      rsCoords
    )
    .send();

  // 4. Retrieve pubKey of recipient and encrypt data
  const recipientPubKey = await token.methods.getPublicKey(recipient).call();
  const privKey = CryptoUtils.getPrivKey(web3.currentProvider);

  const pcOutput = witnesses[0];
  const sharedSecret = CryptoUtils.computeSharedSecret(
    new ECCurve("secp256k1").curveRef,
    privKey,
    recipientPubKey
  );

  let { iv, encryptedHex } = pcOutput.encrypt(sharedSecret);
  const encryptedValue = encryptedHex.slice(0, 64);
  const encryptedBF = encryptedHex.slice(64);

  // 5. Check if encrypted data has been created and mint tokens to the recipient
  await token.methods
    .mint(recipient, "0x" + pcOutput.commitment.compressedAlt.toString(16), [
      "0x" + encryptedValue,
      "0x" + encryptedBF,
      "0x" + iv
    ])
    .send();

  // 6. Refresh wallet
  refreshWallet(dispatch);
};

export const transfer = async (dispatch, recipient, amount) => {
  const { web3, token, cryptoParameters } = store.getState().session;
  const wallet = store.getState().wallet as Wallet;
  const { utxos } = wallet;

  // Verify bulletproof on-chain
  const { witnesses, ids } = await verifyBulletproof(
    token,
    cryptoParameters,
    utxos,
    amount
  );

  // Encrypt data
  const encryptedData = await encryptData(token, recipient, web3, witnesses);

  // 5. Transfer
  await token.methods
    .transfer(
      recipient,
      "0x" + witnesses[0].commitment.compressedAlt.toString(16),
      "0x" + witnesses[1].commitment.compressedAlt.toString(16),
      ids,
      encryptedData
    )
    .send();

  // 6. Refresh wallet
  await refreshWallet(dispatch);
};

export const withdraw = async (dispatch, amount) => {
  const {
    web3,
    token,
    cryptoParameters,
    centralBankAddress
  } = store.getState().session;
  const wallet = store.getState().wallet as Wallet;
  const { utxos } = wallet;

  // Verify bulletproof on-chain
  const { witnesses, ids } = await verifyBulletproof(
    token,
    cryptoParameters,
    utxos,
    amount
  );

  // Encrypt data
  const encryptedData = await encryptData(
    token,
    centralBankAddress,
    web3,
    witnesses
  );

  // Withdraw
  await token.methods
    .withdraw(
      "0x" + witnesses[0].commitment.compressedAlt.toString(16),
      "0x" + witnesses[1].commitment.compressedAlt.toString(16),
      ids,
      encryptedData
    )
    .send();

  // 6. Refresh wallet
  await refreshWallet(dispatch);
};

export const burn = async dispatch => {
  const { token } = store.getState().session;
  const wallet = store.getState().wallet as Wallet;
  const { utxos } = wallet;

  // Get ids and from arrays
  const ids = [];
  const from = [];
  let amount = 0;
  utxos.forEach(tx => {
    ids.push(tx.id);
    from.push(tx.from);
    amount += tx.value;
  });

  // Burn
  await token.methods.burn(ids).send();

  // Filter out used utxos and compute balance
  wallet.balance -= amount;
  wallet.utxos = wallet.utxos.filter(tx => ids.indexOf(tx.id) === -1);

  dispatch({
    type: types.WALLET_UPDATE,
    wallet: wallet
  });
};

const verifyBulletproof = async (token, cryptoParameters, utxos, amount) => {
  // Choose UTXOs to spend and compute totalBf
  let sumBalance = 0;
  let totalBf = new BN(0);
  const ids = [];
  for (let i = 0; i < utxos.length; i++) {
    const tx = utxos[i] as Transaction;
    sumBalance += tx.value;
    totalBf = totalBf.add(tx.bf).umod(cryptoParameters.group.order);
    ids.push(tx.id);
    if (sumBalance >= amount) break;
  }

  // Generate PCs for value and change given totalBf and tokenBalance
  const { witnesses, commitments } = PedersenCommitment.generateMultiple(
    cryptoParameters,
    [amount, sumBalance - amount],
    totalBf
  );

  // Compute Bulletproof
  const proof = Bulletproof.generate(cryptoParameters, witnesses, commitments);

  // Verify on-chain
  const { lsCoords, rsCoords } = proof.serializedLRs;
  const result = await token.methods
    .verifyPCRangeProof(
      proof.serializedCommitments,
      proof.serializedCoords,
      proof.serializedScalars,
      lsCoords,
      rsCoords
    )
    .send();

  return { witnesses, ids, result };
};

const encryptData = async (
  token: Contract,
  toAddress: string,
  web3: Web3,
  witnesses: PedersenCommitment[]
) => {
  const pubKey = await token.methods.getPublicKey(toAddress).call();
  const privKey = CryptoUtils.getPrivKey(web3.currentProvider);

  const toSharedSecret = CryptoUtils.computeSharedSecret(
    new ECCurve("secp256k1").curveRef,
    privKey,
    pubKey
  );
  const pcTo = witnesses[0];
  const encryptedDataTo = CryptoUtils.encryptOutput(pcTo, toSharedSecret);

  const pcRemaining = witnesses[1];
  const encryptedDataRemaining = CryptoUtils.encryptOutput(
    pcRemaining,
    privKey
  );

  const encryptedData = [
    "0x" + encryptedDataTo.encryptedValue,
    "0x" + encryptedDataTo.encryptedBF,
    "0x" + encryptedDataTo.iv,
    "0x" + encryptedDataRemaining.encryptedValue,
    "0x" + encryptedDataRemaining.encryptedBF,
    "0x" + encryptedDataRemaining.iv
  ];

  return encryptedData;
};
