import BN from "bn.js";
import FieldVector from "./FieldVector";
import FieldPolynomial from "./FieldPolynomial";

export default class FieldVectorPolynomial {
  coefficients: FieldVector[];

  constructor(coefficients: FieldVector[]) {
    this.coefficients = coefficients;
  }

  get size(): number {
    return this.coefficients.length;
  }

  innerProduct(other: FieldVectorPolynomial): FieldPolynomial {
    const ZERO = new BN(0, 10);
    const newCoefficients = [] as BN[];

    for (let i = 0; i < this.size + other.size - 1; i++) {
      newCoefficients.push(ZERO);
    }

    for (let i = 0; i < this.coefficients.length; ++i) {
      const aCoefficient = this.coefficients[i];
      if (aCoefficient !== null) {
        for (let j = 0; j < other.coefficients.length; ++j) {
          const b = other.coefficients[j];
          if (b !== null) {
            newCoefficients[i + j] = newCoefficients[i + j].add(
              aCoefficient.innerProduct(b)
            );
          }
        }
      }
    }

    return new FieldPolynomial(newCoefficients);
  }
}
