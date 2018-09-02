import Transaction from "./Transaction";
import BN from "bn.js";

export default class Wallet {
  balance: number = 0;
  incomingTxs: Array<Transaction> = [];
  outgoingTxs: Array<Transaction> = [];
  utxos: Array<Transaction> = [];
  maxInBlock: number = 0;
  maxOutBlock: number = 0;

  constructor(wallet?: Wallet) {
    if (wallet) {
      Object.assign(this, wallet);

      // We transform the blinding factor and PC into big numbers instead of strings
      this.utxos.map(tx => {
        tx.bf = new BN(tx.bf, 16);
        tx.pc = new BN(tx.pc, 16);
        return tx;
      });
    }
  }
}
