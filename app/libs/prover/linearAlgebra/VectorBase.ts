import BN from "bn.js";
import ECPoint from "../curve/ECPoint";
import GeneratorVector from "./GeneratorVector";

export default class VectorBase {
  gs: GeneratorVector;
  hs: GeneratorVector;
  h: ECPoint;

  constructor(gs: GeneratorVector, hs: GeneratorVector, h: ECPoint) {
    this.gs = gs;
    this.hs = hs;
    this.h = h;
  }

  get serialized(): { gs; hs } {
    return {
      gs: this.gs.serialized,
      hs: this.hs.serialized
    };
  }

  commit(gExp: BN[], blindingFactor: BN): ECPoint {
    return this.gs.commit(gExp).add(this.h.mul(blindingFactor));
  }

  commitToTwoVectors(gExp: BN[], hExp: BN[], blindingFactor: BN): ECPoint {
    const blinding = this.h.mul(blindingFactor);
    const commitGs = this.gs.commit(gExp);
    const commitHs = this.hs.commit(hExp);

    return commitGs.add(commitHs).add(blinding);
  }
}
