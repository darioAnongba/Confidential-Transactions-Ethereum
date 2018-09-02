import BN from "bn.js";
import { assert } from "../elliptic/lib/elliptic/utils";
import CryptoUtils from "../utils";
import VectorBase from "../linearAlgebra/VectorBase";
import FieldVector from "../linearAlgebra/FieldVector";
import ECPoint from "../curve/ECPoint";

export default class InnerProductProof {
  L: ECPoint[];
  R: ECPoint[];
  a: BN;
  b: BN;

  constructor(L: ECPoint[], R: ECPoint[], a: BN, b: BN) {
    this.L = L;
    this.R = R;
    this.a = a;
    this.b = b;
  }

  static generateProofFromWitness(
    base: VectorBase,
    c: ECPoint,
    a: FieldVector,
    b: FieldVector
  ) {
    const n = base.gs.size;
    if (!((n & (n - 1)) === 0)) assert(false, "n is not a power of 2");

    const emptyLS = [] as ECPoint[];
    const emptyRS = [] as ECPoint[];
    return this.generateProofRecursive(base, c, a, b, emptyLS, emptyRS);
  }

  static generateProof(
    vectorBase: VectorBase,
    P: ECPoint,
    as: FieldVector,
    bs: FieldVector
  ) {
    let ls = [] as ECPoint[];
    let rs = [] as ECPoint[];

    let n = as.size;
    let basePrime = vectorBase;
    let PPrime = P;
    let aPrime = as;
    let bPrime = bs;

    while (n !== 1) {
      const nPrime = n / 2;
      const asLeft = aPrime.subVector(0, nPrime);
      const asRight = aPrime.subVector(nPrime, nPrime * 2);
      const bsLeft = bPrime.subVector(0, nPrime);
      const bsRight = bPrime.subVector(nPrime, nPrime * 2);

      const gs = basePrime.gs;
      const gLeft = gs.subVector(0, nPrime);
      const gRight = gs.subVector(nPrime, nPrime * 2);

      const hs = basePrime.hs;
      const hLeft = hs.subVector(0, nPrime);
      const hRight = hs.subVector(nPrime, nPrime * 2);

      const cL = asLeft.innerProduct(bsRight);
      const cR = asRight.innerProduct(bsLeft);

      let L = gRight.commit(asLeft.vector).add(hLeft.commit(bsRight.vector));
      let R = gLeft.commit(asRight.vector).add(hRight.commit(bsLeft.vector));
      const u = basePrime.h;
      L = L.add(u.mul(cL));
      ls.push(L);
      R = R.add(u.mul(cR));
      rs.push(R);

      const q = gs.curve.order;
      const x = CryptoUtils.computeChallenge(q, [L, PPrime, R]);
      const xInv = x.invm(q);
      const TWO = new BN(2, 10);
      const xSquare = x.pow(TWO).umod(q);
      const xInvSquare = xInv.pow(TWO).umod(q);

      const xs = [] as BN[];
      const xInverses = [] as BN[];
      for (let i = 0; i < nPrime; i++) {
        xs.push(x);
        xInverses.push(xInv);
      }

      const gPrime = gLeft.hadamard(xInverses).addVector(gRight.hadamard(xs));
      const hPrime = hLeft.hadamard(xs).addVector(hRight.hadamard(xInverses));
      aPrime = asLeft.times(x).addVector(asRight.times(xInv));
      bPrime = bsLeft.times(xInv).addVector(bsRight.times(x));
      PPrime = L.mul(xSquare)
        .add(R.mul(xInvSquare))
        .add(PPrime);
      basePrime = new VectorBase(gPrime, hPrime, u);

      n = aPrime.size;
    }

    return new InnerProductProof(ls, rs, aPrime.firstValue, bPrime.firstValue);
  }

  static generateProofRecursive(
    base: VectorBase,
    P: ECPoint,
    as: FieldVector,
    bs: FieldVector,
    ls: ECPoint[],
    rs: ECPoint[]
  ) {
    let n = as.size;
    if (n === 1)
      return new InnerProductProof(ls, rs, as.firstValue, bs.firstValue);

    const nPrime = n / 2;
    const asLeft = as.subVector(0, nPrime);
    const asRight = as.subVector(nPrime, nPrime * 2);
    const bsLeft = bs.subVector(0, nPrime);
    const bsRight = bs.subVector(nPrime, nPrime * 2);

    const gs = base.gs;
    const gLeft = gs.subVector(0, nPrime);
    const gRight = gs.subVector(nPrime, nPrime * 2);

    const hs = base.hs;
    const hLeft = hs.subVector(0, nPrime);
    const hRight = hs.subVector(nPrime, nPrime * 2);

    const cL = asLeft.innerProduct(bsRight);
    const cR = asRight.innerProduct(bsLeft);
    let L = gRight.commit(asLeft.vector).add(hLeft.commit(bsRight.vector));
    let R = gLeft.commit(asRight.vector).add(hRight.commit(bsLeft.vector));

    const u = base.h;
    L = L.add(u.mul(cL));
    ls.push(L);
    R = R.add(u.mul(cR));
    rs.push(R);

    const q = gs.curve.order;
    const x = CryptoUtils.computeChallenge(q, [L, P, R]);
    const xInv = x.invm(q) as BN;
    const TWO = new BN(2, 10);
    const xSquare = x.pow(TWO).umod(q) as BN;
    const xInvSquare = xInv.pow(TWO).umod(q) as BN;
    let xs = [] as BN[];
    let xInverses = [] as BN[];

    for (let i = 0; i < nPrime; i++) {
      xs.push(x);
      xInverses.push(xInv);
    }

    const gPrime = gLeft.hadamard(xInverses).addVector(gRight.hadamard(xs));
    const hPrime = hLeft.hadamard(xs).addVector(hRight.hadamard(xInverses));
    const aPrime = asLeft.times(x).addVector(asRight.times(xInv));
    const bPrime = bsLeft.times(xInv).addVector(bsRight.times(x));

    const PPrime = L.mul(xSquare)
      .add(R.mul(xInvSquare))
      .add(P);
    const basePrime = new VectorBase(gPrime, hPrime, u);

    return this.generateProofRecursive(
      basePrime,
      PPrime,
      aPrime,
      bPrime,
      ls,
      rs
    );
  }

  static verify(
    params: VectorBase,
    c: ECPoint,
    proof: InnerProductProof
  ): Boolean {
    const ls = proof.L;
    const rs = proof.R;
    const ONE = new BN(1, 10);
    const TWO = new BN(2, 10);
    let challenges = [] as BN[];
    const inverseChallenges = [] as BN[];
    const q = params.gs.curve.order;

    for (let i = 0; i < ls.length; ++i) {
      const l = ls[i];
      const r = rs[i];
      const x = CryptoUtils.computeChallenge(q, [l, c, r]);
      challenges.push(x);
      const xInv = x.invm(q) as BN;
      inverseChallenges.push(xInv);
      c = l
        .mul(x.pow(TWO))
        .add(r.mul(xInv.pow(TWO)))
        .add(c);
    }
    const n = params.gs.size;
    const otherExponents = [] as BN[];
    for (let i = 0; i < n; i++) {
      otherExponents.push(new BN(0, 10));
    }
    otherExponents[0] = challenges
      .reduce((prev, current) => {
        return prev.mul(current).umod(q);
      }, ONE)
      .invm(q);
    challenges = challenges.reverse();
    let bitSet = new BN(0, 10);
    const n_t = new BN(n, 10);
    for (let i = 0; i < n / 2; i++) {
      const i_t = new BN(i, 10);
      let j = 0;

      do {
        const shifted = ONE.shln(j);
        if (i_t.add(shifted).cmp(n_t) !== -1) {
          break;
        }
        const i1 = new BN(i, 10).add(shifted).toNumber();
        if (!bitSet.testn(i1)) {
          otherExponents[i1] = otherExponents[i]
            .mul(challenges[j].pow(TWO))
            .umod(q);
          bitSet = bitSet.bincn(i1);
        }

        j++;
      } while (true);
    }

    const challengeVector = [] as BN[];
    for (let i = 0; i < otherExponents.length; i++) {
      challengeVector.push(otherExponents[i]);
    }
    const g = params.gs.commit(challengeVector);

    const h = params.hs.commit(challengeVector.reverse());
    const prod = proof.a.mul(proof.b).umod(q);
    const cProof = g
      .mul(proof.a)
      .add(h.mul(proof.b))
      .add(params.h.mul(prod));
    return c.equals(cProof);
  }
}
