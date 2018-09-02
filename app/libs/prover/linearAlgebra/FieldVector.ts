import BN from "bn.js";
import { assert } from "../elliptic/lib/elliptic/utils";
import CryptoUtils from "../utils";

export default class FieldVector {
  vector: BN[];
  private q: BN;

  constructor(vector: BN[], q: BN) {
    this.vector = vector;
    this.q = q;
  }

  get firstValue(): BN {
    return this.vector[0];
  }

  get size(): number {
    return this.vector.length;
  }

  innerProduct(other: FieldVector): BN {
    assert(other.size === this.size);
    assert(this.q.cmp(other.q) === 0);

    let accumulator = new BN(0, 10);
    const res = this.vector.reduce((prev: BN, next: BN, index: number): BN => {
      return prev.add(next.mul(other.vector[index]));
    }, accumulator);

    return res.mod(this.q);
  }

  hadamard(other: FieldVector) {
    assert(other.size === this.size);
    assert(this.q.cmp(other.q) === 0);

    let res = [] as BN[];
    for (let i = 0; i < this.size; i++) {
      res.push(other.vector[i].mul(this.vector[i]).mod(this.q));
    }

    return new FieldVector(res, this.q);
  }

  times(scalar: BN): FieldVector {
    let res = [] as BN[];
    for (let i = 0; i < this.size; i++) {
      res.push(scalar.mul(this.vector[i]).mod(this.q));
    }

    return new FieldVector(res, this.q);
  }

  addVector(other: FieldVector): FieldVector {
    assert(other.size === this.size);
    assert(this.q.cmp(other.q) === 0);

    let res = [] as BN[];
    for (let i = 0; i < this.size; i++) {
      res.push(other.vector[i].add(this.vector[i]).mod(this.q));
    }
    return new FieldVector(res, this.q);
  }

  addScalar(scalar: BN): FieldVector {
    let res = [] as BN[];
    for (let i = 0; i < this.size; i++) {
      res.push(scalar.add(this.vector[i]).umod(this.q));
    }
    return new FieldVector(res, this.q);
  }

  subtractVector(other: FieldVector): FieldVector {
    assert(other.size === this.size);
    assert(this.q.cmp(other.q) === 0);

    let res = [] as BN[];
    for (let i = 0; i < this.size; i++) {
      const el = this.vector[i].sub(other.vector[i]).umod(this.q);
      res.push(el);
    }

    return new FieldVector(res, this.q);
  }

  sum(): BN {
    let accumulator = new BN(0, 10);
    for (let i = 0; i < this.size; i++) {
      accumulator.iadd(this.vector[i]);
    }
    return accumulator;
  }

  invert(): FieldVector {
    let res = [] as BN[];
    for (let i = 0; i < this.size; i++) {
      res.push(this.vector[i].invm(this.q));
    }
    return new FieldVector(res, this.q);
  }

  get(i: number): BN {
    return this.vector[i];
  }

  subVector(start: number, end: number): FieldVector {
    const res = [] as BN[];
    for (let i = start; i < end; i++) {
      res.push(this.vector[i]);
    }
    return new FieldVector(res, this.q);
  }

  static pow(k: BN, n: number, q: BN): FieldVector {
    let redContext = BN.red(q);
    let res = [];
    let element = new BN(1, 10).toRed(redContext);
    let kRed = k.toRed(redContext);

    res.push(element);
    for (let i = 1; i < n; i++) {
      element = element.redMul(kRed);
      res.push(element.fromRed());
    }

    return new FieldVector(res, q);
  }

  static fill(k: BN, n: number, q: BN): FieldVector {
    let redContext = BN.red(q);
    let res = [] as BN[];
    let kRed = k.toRed(redContext);

    for (let i = 0; i < n; i++) {
      res.push(kRed.fromRed());
    }

    return new FieldVector(res, q);
  }

  equals(other: FieldVector) {
    if (this === other) return true;
    if (other === null) return false;
    if (other.size !== this.size || this.q.cmp(other.q) !== 0) {
      return false;
    }

    for (let i = 0; i < this.size; i++) {
      if (this.vector[i].cmp(other.vector[i]) !== 0) {
        return false;
      }
    }

    return true;
  }

  public static random(n: number, q: BN): FieldVector {
    const res = [];
    for (let i = 0; i < n; i++) {
      res.push(CryptoUtils.randomNumber());
    }
    return new FieldVector(res, q);
  }
}
