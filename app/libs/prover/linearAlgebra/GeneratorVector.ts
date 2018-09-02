import BN from "bn.js";
import ECPoint from "../curve/ECPoint";
import ECCurve from "../curve/ECCurve";
import { assert } from "../elliptic/lib/elliptic/utils";

export default class GeneratorVector {
  vector: ECPoint[];
  curve: ECCurve;

  constructor(vector: ECPoint[], curve: ECCurve) {
    this.vector = vector;
    this.curve = curve;
  }

  get size(): number {
    return this.vector.length;
  }

  get sum(): ECPoint {
    const accumulator = this.curve.zero;
    return this.vector.reduce((prev, current) => {
      return prev.add(current);
    }, accumulator);
  }

  get serialized(): Object[] {
    return this.vector.map(point => point.serialized);
  }

  add(other: ECPoint[]): GeneratorVector {
    const vector = this.vector.map((current, index) => {
      return current.add(other[index]);
    });
    return new GeneratorVector(vector, this.curve);
  }

  addVector(other: GeneratorVector): GeneratorVector {
    return this.add(other.vector);
  }

  commit(exponents: BN[]): ECPoint {
    assert(
      exponents.length === this.size,
      "Commitment base and vector should have the same length"
    );

    let accumulator = this.curve.zero;
    const res = this.vector.reduce(
      (prev: ECPoint, current: ECPoint, index: number): ECPoint => {
        const newPoint = current.mul(exponents[index]);
        return prev.add(newPoint);
      },
      accumulator
    );
    assert(!res.isInfinity(), "Commitment resulted in infinity point");

    return res;
  }

  from(vector: ECPoint[]): GeneratorVector {
    return new GeneratorVector(vector, this.curve);
  }

  subVector(start: number, end: number): GeneratorVector {
    return this.from(this.vector.slice(start, end) as ECPoint[]);
  }

  hadamard(exponents: BN[]): GeneratorVector {
    let newVector = this.vector.map(
      (current: ECPoint, index: number): ECPoint => {
        return current.mul(exponents[index]);
      }
    ) as ECPoint[];
    return new GeneratorVector(newVector, this.curve);
  }

  get(i: number): ECPoint {
    return this.vector[i];
  }
}
