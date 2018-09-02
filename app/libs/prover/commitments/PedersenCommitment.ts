import BN from "bn.js";
import aesjs from "aes-js";
import ECPoint from "../curve/ECPoint";
import PedersenBase from "./PedersenBase";
import CryptoUtils from "../utils";
import GeneratorParams from "../rangeProof/GeneratorParams";
import { assert } from "../elliptic/lib/elliptic/utils";

export default class PedersenCommitment {
  base: PedersenBase;
  value: BN;
  bf: BN;

  constructor(base: PedersenBase, value: BN, bf?: BN) {
    this.base = base;
    this.value = value;
    if (!bf) bf = CryptoUtils.randomNumber();

    this.bf = bf;
  }

  get commitment(): ECPoint {
    return this.base.commit(this.value, this.bf);
  }

  get blinding(): ECPoint {
    return this.base.h.mul(this.bf);
  }

  add(other: PedersenCommitment): PedersenCommitment {
    return new PedersenCommitment(
      this.base,
      this.value.add(other.value),
      this.bf.add(other.bf)
    );
  }

  times(exponent: BN): PedersenCommitment {
    return new PedersenCommitment(
      this.base,
      this.value.mul(exponent),
      this.bf.mul(exponent)
    );
  }

  addConstant(constant: BN): PedersenCommitment {
    return new PedersenCommitment(this.base, this.value.add(constant), this.bf);
  }

  encrypt(
    sharedSecret: Buffer
  ): { iv: string; encryptedBytes: Buffer; encryptedHex: string } {
    const ivBuffer = CryptoUtils.randomBytes(16);
    const aesCbc = new aesjs.ModeOfOperation.cbc(sharedSecret, ivBuffer);
    const dataToEncrypt = Buffer.concat([
      this.value.toArrayLike(Buffer, "be", 32),
      this.bf.toArrayLike(Buffer, "be", 32)
    ]);
    const encryptedBytes = aesCbc.encrypt(dataToEncrypt) as Buffer;
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes) as string;
    const iv = ivBuffer.toString("hex");

    return { iv, encryptedBytes, encryptedHex };
  }

  static decrypt(
    base: PedersenBase,
    sharedSecret: Buffer,
    encryptedData: Array<string>
  ) {
    const toFixedSize = (numberString, size) => {
      return new BN(numberString).toString(16, size);
    };

    const encryptedBytes = aesjs.utils.hex.toBytes(
      toFixedSize(encryptedData[0], 64) + toFixedSize(encryptedData[1], 64)
    );
    const iv = aesjs.utils.hex.toBytes(toFixedSize(encryptedData[2], 32));

    const aesCbcDecryptor = new aesjs.ModeOfOperation.cbc(sharedSecret, iv);
    const decryptedBytes = new Buffer.from(
      aesCbcDecryptor.decrypt(encryptedBytes)
    );

    const value = new BN(decryptedBytes.slice(0, 32), 16, "be");
    const bf = new BN(decryptedBytes.slice(32, 64), 16, "be");

    return new PedersenCommitment(base, value, bf);
  }

  static generateMultiple(
    parameters: GeneratorParams,
    values: number[],
    totalBf: BN
  ): { witnesses: PedersenCommitment[]; commitments: ECPoint[] } {
    const q = parameters.group.order as BN;
    const witnesses = [] as PedersenCommitment[];
    const commitments = [] as ECPoint[];
    let sumBfs = new BN(0);

    // For each value, create a Pedersen Commitment and a generator vector
    // Last PC has a blinding factor such that (totalBf - sumBfs = 0)
    for (let i = 0; i < values.length; i++) {
      let bf;
      if (i < values.length - 1) bf = CryptoUtils.randomNumber();
      else bf = totalBf.sub(sumBfs).umod(q);

      sumBfs = sumBfs.add(bf);
      const witness = new PedersenCommitment(
        parameters.base,
        new BN(values[i]),
        bf
      );
      witnesses.push(witness);
      commitments.push(witness.commitment);
    }

    assert(
      totalBf
        .sub(sumBfs)
        .umod(q)
        .eq(new BN(0))
    );

    return { witnesses, commitments };
  }
}
