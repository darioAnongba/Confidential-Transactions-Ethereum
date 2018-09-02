import BN from "bn.js";
import GeneratorVector from "../linearAlgebra/GeneratorVector";
import PedersenCommitment from "../commitments/PedersenCommitment";
import GeneratorParams from "./GeneratorParams";
import FieldVector from "../linearAlgebra/FieldVector";
import CryptoUtils from "../utils";
import { assert } from "../elliptic/lib/elliptic/utils";
import FieldVectorPolynomial from "../linearAlgebra/FieldVectorPolynomial";
import PolyCommitment from "../commitments/PolyCommitment";
import VectorBase from "../linearAlgebra/VectorBase";
import InnerProductProof from "../innerProduct";
import ECPoint from "../curve/ECPoint";

export default class Bulletproof {
  aI: ECPoint;
  s: ECPoint;
  tCommits: GeneratorVector;
  tauX: BN;
  mu: BN;
  t: BN;
  productProof: InnerProductProof;
  commitments: GeneratorVector;

  constructor(
    aI: ECPoint,
    s: ECPoint,
    tCommits: GeneratorVector,
    tauX: BN,
    mu: BN,
    t: BN,
    productProof: InnerProductProof,
    commitments: GeneratorVector
  ) {
    this.aI = aI;
    this.s = s;
    this.tCommits = tCommits;
    this.tauX = tauX;
    this.mu = mu;
    this.t = t;
    this.productProof = productProof;
    this.commitments = commitments;
  }

  get numInts(): number {
    return 5;
  }

  get numElements(): number {
    return (
      2 +
      this.tCommits.vector.length +
      this.productProof.L.length +
      this.productProof.R.length
    );
  }

  serializedProof(M) {
    let serializedProof = [];

    // Number of proofs
    serializedProof.push(1);

    // Concatenated lengths
    let combined;

    // Number of bits that each commitment conceals
    const N = new BN(M, 16).and(new BN("0xFFFFFFFFFFFFFFFF", 16));
    // Number of output commitments * 2
    const VLength = new BN(this.commitments.size * 2, 16).and(
      new BN("0xFFFFFFFFFFFFFFFF", 16)
    );
    // Number of L points * 2
    const LLength = new BN(this.productProof.L.length * 2, 16).and(
      new BN("0xFFFFFFFFFFFFFFFF", 16)
    );
    // Number of R points * 2
    const RLength = new BN(this.productProof.R.length * 2, 16).and(
      new BN("0xFFFFFFFFFFFFFFFF", 16)
    );

    combined = N.or(VLength.shln(64))
      .or(LLength.shln(128))
      .or(RLength.shln(192));
    serializedProof.push(combined);

    // Serialized output commitments
    serializedProof = serializedProof.concat(this.serializedCommitments);
    // Serialized coords
    serializedProof = serializedProof.concat(this.serializedCoords);
    // tauX and mu
    serializedProof.push(this.tauX);
    serializedProof.push(this.mu);
    // Serialized L points
    const { lsCoords, rsCoords } = this.serializedLRs;
    serializedProof = serializedProof.concat(lsCoords);
    serializedProof = serializedProof.concat(rsCoords);
    // a, b and t
    serializedProof.push(this.productProof.a);
    serializedProof.push(this.productProof.b);
    serializedProof.push(this.t);

    return serializedProof;
  }

  get serializedCommitments() {
    const commitments = [];
    for (let i = 0; i < this.commitments.size; i++) {
      commitments.push(this.commitments.get(i).x);
      commitments.push(this.commitments.get(i).y);
    }
    return commitments;
  }

  get serializedCoords() {
    return [
      this.aI.x,
      this.aI.y,
      this.s.x,
      this.s.y,
      this.tCommits.get(0).x,
      this.tCommits.get(0).y,
      this.tCommits.get(1).x,
      this.tCommits.get(1).y
    ];
  }

  get serializedScalars() {
    return [
      this.tauX,
      this.mu,
      this.t,
      this.productProof.a,
      this.productProof.b
    ];
  }

  get serializedLRs() {
    const lsCoords = [];
    const rsCoords = [];
    for (let i = 0; i < this.productProof.L.length; i++) {
      const L = this.productProof.L[i];
      const R = this.productProof.R[i];
      lsCoords.push(L.x);
      lsCoords.push(L.y);
      rsCoords.push(R.x);
      rsCoords.push(R.y);
    }

    return { lsCoords, rsCoords };
  }

  static generate(
    parameters: GeneratorParams,
    witnesses: PedersenCommitment[],
    commitments: ECPoint[]
  ) {
    const generator = new GeneratorVector(commitments, parameters.group);
    const m = generator.size;

    const vectorBase = parameters.vectorBase;
    const base = parameters.base;
    const n = vectorBase.gs.size;

    const bitsPerNumber = Math.floor(n / m);

    const q = parameters.group.order;

    const ZERO = new BN(0, 10);
    const ONE = new BN(1, 10);
    const TWO = new BN(2, 10);

    // Bits
    const aLelements = [] as BN[];
    for (let i = 0; i < n; i++) {
      const value = witnesses[Math.floor(i / bitsPerNumber)].value;
      if (value.testn(i % bitsPerNumber)) aLelements.push(ONE);
      else aLelements.push(ZERO);
    }
    const aL = new FieldVector(aLelements, q);
    const aR = aL.subtractVector(FieldVector.fill(ONE, n, q));

    const alpha = CryptoUtils.randomNumber();
    const a = vectorBase.commitToTwoVectors(aL.vector, aR.vector, alpha);
    const sL = FieldVector.random(n, q);
    const sR = FieldVector.random(n, q);
    const rho = CryptoUtils.randomNumber();
    const s = vectorBase.commitToTwoVectors(sL.vector, sR.vector, rho);

    const challengeArr = generator.vector.concat([a, s]);

    const y = CryptoUtils.computeChallenge(q, challengeArr);
    // y^n
    const ys = FieldVector.pow(y, n, q);

    const z = CryptoUtils.computeChallengeForBN(q, [y]);
    // z^Q
    const zs = FieldVector.pow(z, m + 2, q).subVector(2, m + 2); // 1, z, z^2, z^3 ... -> z^2, z^3 ...
    assert(zs.size === m);

    const twos = FieldVector.pow(TWO, bitsPerNumber, q); // Powers of TWO
    const elements = zs.vector
      .map(bi => {
        return twos.times(bi).vector;
      })
      .reduce(
        (prev: BN[], current: BN[]) => {
          return prev.concat(current);
        },
        [] as BN[]
      );
    assert(elements.length === n);

    // 2^n \cdot z || 2^n \cdot z^2 ...
    const twoTimesZs = new FieldVector(elements, q);

    const l0 = aL.addScalar(z.neg());

    const l1 = sL;
    const lPoly = new FieldVectorPolynomial([l0, l1]);

    const r0 = ys.hadamard(aR.addScalar(z)).addVector(twoTimesZs);
    const r1 = sR.hadamard(ys);
    const rPoly = new FieldVectorPolynomial([r0, r1]);

    // t(X)
    const tPoly = lPoly.innerProduct(rPoly);

    // Commit(t)
    const tPolyCoefficients = tPoly.coefficients;
    const polyCommitment = PolyCommitment.from(
      base,
      tPolyCoefficients[0],
      tPolyCoefficients.slice(1)
    );

    const x = CryptoUtils.computeChallenge(
      q,
      polyCommitment.getNonZeroCommitments()
    );

    const mainCommitment = polyCommitment.evaluate(x);

    const mu = alpha.add(rho.mul(x)).umod(q);
    const t = mainCommitment.value.umod(q);
    const tauX = mainCommitment.bf
      .add(
        zs.innerProduct(
          new FieldVector(
            witnesses.map(
              (w): BN => {
                return w.bf;
              }
            ),
            q
          )
        )
      )
      .umod(q);

    const uChallenge = CryptoUtils.computeChallengeForBN(q, [tauX, mu, t]);
    const u = base.g.mul(uChallenge);
    const hs = vectorBase.hs;
    const gs = vectorBase.gs;
    const hPrimes = hs.hadamard(ys.invert().vector);
    const l = l0.addVector(l1.times(x));
    const r = r0.addVector(r1.times(x));
    const hExp = ys.times(z).addVector(twoTimesZs);
    const P = a
      .add(s.mul(x))
      .add(gs.sum.mul(z.neg()))
      .add(hPrimes.commit(hExp.vector))
      .add(u.mul(t))
      .sub(base.h.mul(mu));

    const primeBase = new VectorBase(gs, hPrimes, u);
    const proof = InnerProductProof.generateProofFromWitness(
      primeBase,
      P,
      l,
      r
    );
    return new Bulletproof(
      a,
      s,
      new GeneratorVector(polyCommitment.getNonZeroCommitments(), hs.curve),
      tauX,
      mu,
      t,
      proof,
      generator
    );
  }

  static verify(params: GeneratorParams, proof: Bulletproof): Boolean {
    const commitments = proof.commitments;
    const m = commitments.size;
    const vectorBase = params.vectorBase;
    const base = params.base;
    const n = vectorBase.gs.size;

    const bitsPerNumber = Math.floor(n / m);

    const a = proof.aI;
    const s = proof.s;
    const ZERO = new BN(0, 10);
    const TWO = new BN(2, 10);

    const q = params.group.order;

    const challengeArr = commitments.vector.concat([a, s]);

    const y = CryptoUtils.computeChallenge(q, challengeArr);
    const ys = FieldVector.pow(y, n, q);

    const z = CryptoUtils.computeChallengeForBN(q, [y]);
    const zs = FieldVector.pow(z, m + 2, q).subVector(2, m + 2); // 1, z, z^2, z^3 ... -> z^2, z^3 ...
    assert(zs.size === m);

    const twos = FieldVector.pow(TWO, bitsPerNumber, q); // Powers of TWO
    const elements = zs.vector
      .map(bi => {
        return twos.times(bi).vector;
      })
      .reduce(
        (prev: BN[], current: BN[]) => {
          return prev.concat(current);
        },
        [] as BN[]
      );
    assert(elements.length === n);

    const twoTimesZSquared = new FieldVector(elements, q);
    const zSum = zs
      .sum()
      .mul(z)
      .umod(q);
    const k = ys
      .sum()
      .mul(z.sub(zs.get(0)))
      .sub(zSum.shln(bitsPerNumber).sub(zSum))
      .umod(q);

    const tCommits = proof.tCommits;

    const x = CryptoUtils.computeChallenge(q, tCommits.vector) as BN;

    const tauX = proof.tauX;
    const mu = proof.mu;
    const t = proof.t;
    const lhs = base.commit(t, tauX);
    const rhs = tCommits
      .commit([x, x.pow(TWO)])
      .add(commitments.commit(zs.vector))
      .add(base.commit(k, ZERO));

    assert(lhs.equals(rhs), "Polynomial identity check failed");

    const uChallenge = CryptoUtils.computeChallengeForBN(q, [tauX, mu, t]);
    const u = base.g.mul(uChallenge);
    const hs = vectorBase.hs;
    const gs = vectorBase.gs;
    const hPrimes = hs.hadamard(ys.invert().vector);
    const hExp = ys.times(z).addVector(twoTimesZSquared);
    const P = a
      .add(s.mul(x))
      .add(gs.sum.mul(z.neg()))
      .add(hPrimes.commit(hExp.vector))
      .sub(base.h.mul(mu))
      .add(u.mul(t));
    const primeBase = new VectorBase(gs, hPrimes, u);

    return InnerProductProof.verify(primeBase, P, proof.productProof);
  }
}
