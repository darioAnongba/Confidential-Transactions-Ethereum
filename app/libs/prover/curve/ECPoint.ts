import BN from "bn.js";
import ECCurve from "./ECCurve";
import { assert } from "../elliptic/lib/elliptic/utils";

export default class ECPoint {
  curve: ECCurve;
  pointRef: any;

  constructor(p: any, curve: ECCurve) {
    this.pointRef = p;
    this.curve = curve;
    assert(curve.curveRef.curve.validate(p));
  }

  get x(): BN {
    return this.pointRef.getX();
  }

  get y(): BN {
    return this.pointRef.getY();
  }

  get compressed(): Buffer {
    return this.pointRef.encode("be", true);
  }

  get compressedHex(): string {
    return this.pointRef.encode("hex", true);
  }

  get compressedAlt(): BN {
    let pOut = this.x;
    const ONE = new BN(1);
    const ecSignMask = new BN(
      "8000000000000000000000000000000000000000000000000000000000000000",
      16
    );

    if (this.y.and(ONE).cmp(ONE) === 0) {
      pOut = pOut.or(ecSignMask);
    }

    return pOut;
  }

  get serialized(): { x; y } {
    return {
      x: this.x,
      y: this.y
    };
  }

  serializeBuffer(pad: Boolean): Buffer {
    if (pad) {
      return Buffer.concat([
        this.x.toArrayLike(Buffer, "be", 32),
        this.y.toArrayLike(Buffer, "be", 32)
      ]);
    } else {
      return Buffer.concat([
        this.x.toArrayLike(Buffer, "be"),
        this.y.toArrayLike(Buffer, "be")
      ]);
    }
  }

  add(another: ECPoint): ECPoint {
    return new ECPoint(this.pointRef.add(another.pointRef), this.curve);
  }

  mul(scalar: BN): ECPoint {
    return new ECPoint(this.pointRef.mul(scalar), this.curve);
  }

  sub(another: ECPoint): ECPoint {
    return new ECPoint(this.pointRef.add(another.pointRef.neg()), this.curve);
  }

  negate(): ECPoint {
    return new ECPoint(this.pointRef.neg(), this.curve);
  }

  inverse(): ECPoint {
    return new ECPoint(this.pointRef.inverse(), this.curve);
  }

  isInfinity(): boolean {
    return this.pointRef.inf;
  }

  equals(other: ECPoint): Boolean {
    return this.x.cmp(other.x) === 0 && this.y.cmp(other.y) === 0;
  }
}
