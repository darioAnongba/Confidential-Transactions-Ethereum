import BN from "bn.js";

export default class Transaction {
  hash: string = undefined;
  from: string = undefined;
  to: string = undefined;
  blockNumber: number = undefined;
  blockHash: string = undefined;
  id: number = undefined;
  pc: BN = undefined;
  value: number = undefined;
  bf: BN = undefined;

  constructor(
    hash: string,
    from: string,
    to: string,
    blockNumber: number,
    blockHash: string,
    id: number,
    pc: BN,
    value: number,
    bf: BN
  ) {
    this.hash = hash;
    this.from = from;
    this.to = to;
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.id = id;
    this.pc = pc;
    this.value = value;
    this.bf = bf;
  }
}
