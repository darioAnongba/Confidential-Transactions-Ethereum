import { keccak256 } from "ethereumjs-util";
import BN from "bn.js";
import HDWalletProvider from "truffle-hdwallet-provider";
import ECPoint from "../curve/ECPoint";
import PedersenCommitment from "../commitments/PedersenCommitment";
// Use this if not on React Native
import randomBytes from "randombytes";
// import { randomBytes } from "react-native-randombytes";

export default class CryptoUtils {
  static keccak256 = keccak256;

  static computeChallenge = function(q: BN, points: ECPoint[]): BN {
    let buffers = [] as Buffer[];
    for (const point of points) {
      const buff = point.serializeBuffer(true);
      buffers.push(buff);
    }
    const hashed = this.keccak256(Buffer.concat(buffers));
    return new BN(hashed, 16, "be").umod(q);
  };

  static computeChallengeForBN(q: BN, ints: BN[]) {
    let buffers = [] as Buffer[];
    for (const bi of ints) {
      const buff = bi.toArrayLike(Buffer, "be", 32) as Buffer;
      buffers.push(buff);
    }
    const hashed = this.keccak256(Buffer.concat(buffers));
    return new BN(hashed, 16, "be").umod(q);
  }

  static randomNumber(): BN {
    return new BN(randomBytes(32), 16, "be");
  }

  static randomBytes(size): Buffer {
    return randomBytes(size);
  }

  static computeSharedSecret(
    curve: any,
    privKey: Buffer,
    pubKey: string
  ): Buffer {
    const key1 = curve.keyFromPrivate(privKey);
    const key2 = curve.keyFromPublic(
      {
        x: new BN(pubKey[0]).toString(16),
        y: new BN(pubKey[1]).toString(16)
      },
      "hex"
    );

    const ss = key1.derive(key2.getPublic());
    return ss.toArrayLike(Buffer, "be", 32);
  }

  static getPrivKey(provider: HDWalletProvider): Buffer {
    const wallet = provider.wallets[provider.getAddress()];
    return wallet.getPrivateKey();
  }

  static getPubKeyAsArray(provider: HDWalletProvider): BN[] {
    const wallet = provider.wallets[provider.getAddress()];
    const pubKey = wallet.getPublicKey();

    const x = new BN(pubKey.slice(0, 32));
    const y = new BN(pubKey.slice(32));
    return [x, y];
  }

  static encryptOutput(
    pcOutput: PedersenCommitment,
    sharedSecret: Buffer
  ): { iv: string; encryptedValue: string; encryptedBF: string } {
    let { iv, encryptedHex } = pcOutput.encrypt(sharedSecret);
    const encryptedValue = encryptedHex.slice(0, 64);
    const encryptedBF = encryptedHex.slice(64);

    return { iv, encryptedValue, encryptedBF };
  }
}
