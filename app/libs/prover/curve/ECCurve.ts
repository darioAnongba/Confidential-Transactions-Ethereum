import BN from "bn.js";
import ECPoint from "./ECPoint";
import { ec as EC } from "../elliptic";
import CryptoUtils from "../utils";

export default class ECCurve {
  order: BN;
  primeFieldSize: BN;
  halfOrder: BN;
  generator: ECPoint;
  zero: ECPoint;
  curveRef: any;

  constructor(name: string) {
    this.curveRef = new EC(name);
    this.order = this.curveRef.n as BN;
    this.halfOrder = this.curveRef.nh as BN;
    this.primeFieldSize = this.curveRef.curve.p as BN;
    this.generator = new ECPoint(this.curveRef.g, this);
    this.zero = this.generator.sub(this.generator);
  }

  pointFromCoordinates(x: BN, y: BN): ECPoint {
    return new ECPoint(this.curveRef.curve.point(x, y), this);
  }

  validate(point: ECPoint): Boolean {
    return this.curveRef.curve.validate(point.pointRef);
  }

  hashToPoint(input: Buffer): ECPoint {
    return this.toPoint(ECCurve.hash(input));
  }

  toPoint(input: Buffer): ECPoint {
    let seed = new BN(input, 16, "be").umod(this.primeFieldSize);
    const ONE = new BN(1, 10);
    const ZERO = new BN(0, 10);
    let y;
    seed = seed.sub(ONE);

    let onCurve = false;
    do {
      seed = seed.add(ONE);
      const x = seed.toRed(this.curveRef.curve.red);
      let ySquared = undefined;
      if (this.curveRef.curve.a.cmp(ZERO) === 0) {
        ySquared = x
          .redSqr()
          .redIMul(x)
          .redIAdd(this.curveRef.curve.b);
      } else {
        ySquared = x
          .redSqr()
          .redIMul(x)
          .redIAdd(x.redMul(this.curveRef.curve.a))
          .redIAdd(this.curveRef.curve.b);
      }

      y = ySquared.redSqrt();
      if (y.redSqr().cmp(ySquared) === 0) {
        onCurve = true;
      }
    } while (!onCurve);

    return new ECPoint(this.curveRef.curve.point(seed, y), this);
  }

  static hash(input: Buffer): Buffer {
    return CryptoUtils.keccak256(input);
  }
}
