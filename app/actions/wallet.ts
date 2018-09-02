import * as types from "./types";
import Wallet from "../model/Wallet";
import { store } from "../store";
import Session from "../model/Session";
import BN from "bn.js";
import Transaction from "../model/Transaction";
import { maxTransferValue } from "../utils";
import { showLongToastAndroid } from "../utils/errorHandler";
import { AsyncStorage } from "react-native";
import { keys } from "../store/api/config";
import ECCurve from "../libs/prover/curve/ECCurve";
import PedersenCommitment from "../libs/prover/commitments/PedersenCommitment";
import CryptoUtils from "../libs/prover/utils";

export async function createWallet(dispatch) {
  const wallet = new Wallet();
  await getIncomingTxs(dispatch, 0, wallet);
  await getOutgoingTxs(dispatch, 0, wallet);

  await AsyncStorage.setItem(keys.WALLET, "true");
}

export const refreshWallet = async dispatch => {
  const wallet = store.getState().wallet as Wallet;

  await getIncomingTxs(dispatch, wallet.maxInBlock + 1, wallet);
  await getOutgoingTxs(dispatch, wallet.maxOutBlock + 1, wallet);
};

const getIncomingTxs = async (dispatch, fromBlock: number, wallet: Wallet) => {
  const session = store.getState().session as Session;
  const tokenInstance = session.token;

  const privKey = CryptoUtils.getPrivKey(session.web3.currentProvider);
  const owner = await tokenInstance.methods.owner().call();
  const secp256k1Curve = new ECCurve("secp256k1").curveRef;

  // 1. Retrieve all transfer events and compute balance
  const incomingTransfers = await tokenInstance.getPastEvents("Transfer", {
    filter: { to: session.account },
    fromBlock,
    toBlock: "latest"
  });

  // 2. For each transfer, verify that the PC corresponds to the computed PC with the value and bf decrypted
  for (let i = 0; i < incomingTransfers.length; i++) {
    const transfer = incomingTransfers[i];
    const pcRetrieved = new BN(transfer.returnValues.pc);
    const encryptedData = transfer.returnValues.encryptedData;
    const from = transfer.returnValues.from;
    const id = parseInt(transfer.returnValues.id, 10);

    // If this is a tx to myself, the shared secret is my private key, otherwise compute it
    let sharedSecret;
    if (from === session.account) {
      sharedSecret = privKey;
    } else {
      const pubKey = await tokenInstance.methods.getPublicKey(from).call();
      sharedSecret = CryptoUtils.computeSharedSecret(
        secp256k1Curve,
        privKey,
        pubKey
      );
    }

    const pCComputed = PedersenCommitment.decrypt(
      session.cryptoParameters.base,
      sharedSecret,
      encryptedData
    );

    const fromName = from === owner ? "Top up" : from;
    const pcCompressed = pCComputed.commitment.compressedAlt;
    const pcValue = pCComputed.value.toNumber();
    if (pcRetrieved.cmp(pcCompressed) === 0 && pcValue < maxTransferValue()) {
      const tx = new Transaction(
        transfer.transactionHash,
        fromName,
        session.account,
        transfer.blockNumber,
        transfer.blockHash,
        id,
        pcCompressed,
        pcValue,
        pCComputed.bf
      );
      wallet.utxos.push(tx);
      wallet.maxInBlock = tx.blockNumber;
      if (tx.from !== session.account) wallet.incomingTxs.push(tx);
    }
  }

  // 3. Get all spent outputs ids
  const spentOutputs = await tokenInstance.getPastEvents("OutputsSpent", {
    filter: { from: session.account },
    fromBlock: fromBlock,
    toBlock: "latest"
  });

  let spentIDs = [];
  spentOutputs.forEach(event => {
    spentIDs = spentIDs.concat(
      event.returnValues.ids.map(idString => {
        return parseInt(idString, 10);
      })
    );
  });

  // Filter Spent PCs
  wallet.utxos = wallet.utxos.filter(tx => spentIDs.indexOf(tx.id) === -1);

  // Compute balance
  let balance = 0;
  wallet.utxos.forEach(tx => {
    balance += tx.value;
  });
  wallet.balance = balance;

  dispatch({
    type: types.WALLET_UPDATE,
    wallet: wallet
  });
};

const getOutgoingTxs = async (dispatch, fromBlock: number, wallet: Wallet) => {
  const { web3, token, account, cryptoParameters } = store.getState().session;

  const privKey = CryptoUtils.getPrivKey(web3.currentProvider);
  const owner = await token.methods.owner().call();
  const secp256k1Curve = new ECCurve("secp256k1").curveRef;

  const outgoingTransfers = await token.getPastEvents("Transfer", {
    filter: { from: account },
    fromBlock
  });

  // 2. For each transfer, verify that the PC corresponds to the computed PC with the value and bf decrypted
  for (let i = 0; i < outgoingTransfers.length; i++) {
    const transfer = outgoingTransfers[i];
    const pcRetrieved = new BN(transfer.returnValues.pc);
    const encryptedData = transfer.returnValues.encryptedData;

    // Go to next if I'm sending to myself
    const to = transfer.returnValues.to;
    if (to === account) continue;

    const id = parseInt(transfer.returnValues.id, 10);

    const pubKey = await token.methods.getPublicKey(to).call();
    const sharedSecret = CryptoUtils.computeSharedSecret(
      secp256k1Curve,
      privKey,
      pubKey
    );

    const pCComputed = PedersenCommitment.decrypt(
      cryptoParameters.base,
      sharedSecret,
      encryptedData
    );

    const toName = to === owner ? "Withdrawal" : to;
    const pcCompressed = pCComputed.commitment.compressedAlt;
    if (pcRetrieved.cmp(pcCompressed) === 0) {
      const tx = new Transaction(
        transfer.transactionHash,
        account,
        toName,
        transfer.blockNumber,
        transfer.blockHash,
        id,
        pcCompressed,
        pCComputed.value.toNumber(),
        pCComputed.bf
      );
      wallet.outgoingTxs.push(tx);
      wallet.maxOutBlock = tx.blockNumber;
    } else {
      showLongToastAndroid("Transaction " + id + " could not be decrypted");
    }
  }

  dispatch({
    type: types.WALLET_UPDATE,
    wallet: wallet
  });
};
