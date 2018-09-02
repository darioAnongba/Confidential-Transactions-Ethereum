import BN from "bn.js";
import PedersenCommitment from "./PedersenCommitment";
import PedersenBase from "./PedersenBase";
import ECPoint from "../curve/ECPoint";
import CryptoUtils from "../utils";

export default class PolyCommitment {
  coefficientCommitments: PedersenCommitment[];

  constructor(coefficientCommitments: PedersenCommitment[]) {
    this.coefficientCommitments = coefficientCommitments;
  }

  get size(): number {
    return this.coefficientCommitments.length;
  }

  evaluate(x: BN): PedersenCommitment {
    const ONE = new BN(1, 10);
    let multiplier = ONE;

    const res = [
      this.coefficientCommitments[0].times(ONE)
    ] as PedersenCommitment[];

    for (let i = 1; i < this.size; i++) {
      multiplier = multiplier.mul(x);
      const comm = this.coefficientCommitments[i].times(multiplier);
      res.push(comm);
    }

    let acc = res[0] as PedersenCommitment;
    for (let i = 1; i < this.coefficientCommitments.length; i++) {
      acc = acc.add(res[i]);
    }
    return acc;
  }

  getNonZeroCommitments(): ECPoint[] {
    const ZERO = new BN(0, 10);
    const filtered = this.coefficientCommitments.filter(pc => {
      return pc.bf.cmp(ZERO) !== 0;
    });
    const res = filtered.map(pc => {
      return pc.commitment;
    });

    return res;
  }

  static from(base: PedersenBase, x0: BN, xs: BN[]): PolyCommitment {
    const res = xs.map(el => {
      return new PedersenCommitment(base, el, CryptoUtils.randomNumber());
    });
    const ZERO = new BN(0, 10);
    const toZero = new PedersenCommitment(base, x0, ZERO);
    const peddersenCommitments = [toZero].concat(res);
    return new PolyCommitment(peddersenCommitments);
  }
}
