import "react-native";
import BN from "bn.js";
import GeneratorParams from "../app/libs/prover/rangeProof/GeneratorParams";
import { MBits } from "../app/utils";
import ECCurve from "../app/libs/prover/curve/ECCurve";

let curve;
let cryptoParameters;

beforeAll(() => {
  curve = new ECCurve("bn256");
  cryptoParameters = GeneratorParams.generate(MBits, curve);
});

it("Generates crypto parameters correctly", () => {
  const gs0 = curve.pointFromCoordinates(
    new BN(
      "2ee9d9ac7c3c8401799229d12a921be0a53a94e947b8fe4ad53c10271589475b",
      16
    ),
    new BN(
      "27e30be9524ec86fa23ffd86df08f7534f873cfcd1c476acb06932f45e4b1aa3",
      16
    )
  );
  const hs0 = curve.pointFromCoordinates(
    new BN(
      "5b15e337abcece819885de2ed3156ffcabec15a950f964404243ac3fcc3bf14",
      16
    ),
    new BN(
      "113704c3c34b857f7597bc982ed9ca82ea0f3abf9806b8da6d72c18552e7d308",
      16
    )
  );

  expect(cryptoParameters.vectorBase.gs.get(0).equals(gs0)).toBe(true);
  expect(cryptoParameters.vectorBase.hs.get(0).equals(hs0)).toBe(true);
});

it("Serializes Crypto parameters correctly", () => {
  const serialized = cryptoParameters.serialized;

  expect(
    serialized.base.g.x.cmp(
      new BN(
        "77da99d806abd13c9f15ece5398525119d11e11e9836b2ee7d23f6159ad87d4",
        16
      )
    )
  ).toBe(0);
  expect(
    serialized.base.g.y.cmp(
      new BN(
        "1485efa927f2ad41bff567eec88f32fb0a0f706588b4e41a8d587d008b7f875",
        16
      )
    )
  ).toBe(0);
});
