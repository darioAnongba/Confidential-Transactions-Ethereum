import BN from "bn.js";
import ECPoint from "../curve/ECPoint";

export default class PedersenBase {
  g: ECPoint;
  h: ECPoint;

  constructor(g: ECPoint, h: ECPoint) {
    this.g = g;
    this.h = h;
  }

  get serialized(): Object {
    return {
      g: this.g.serialized,
      h: this.h.serialized
    };
  }

  commit(value: BN, blindingFactor: BN): ECPoint {
    return this.g.mul(value).add(this.h.mul(blindingFactor));
  }
}
