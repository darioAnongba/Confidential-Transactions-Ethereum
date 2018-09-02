import BN from "bn.js";

export default class FieldPolynomial {
  coefficients: BN[];

  constructor(coefficients: BN[]) {
    this.coefficients = coefficients;
  }
}
