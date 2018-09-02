import VectorBase from "../linearAlgebra/VectorBase";
import PedersenBase from "../commitments/PedersenBase";
import ECCurve from "../curve/ECCurve";
import ECPoint from "../curve/ECPoint";
import GeneratorVector from "../linearAlgebra/GeneratorVector";

export default class GeneratorParams {
  vectorBase: VectorBase;
  base: PedersenBase;
  group: ECCurve;

  constructor(vectorBase: VectorBase, base: PedersenBase, group: ECCurve) {
    this.vectorBase = vectorBase;
    this.base = base;
    this.group = group;
  }

  get serialized(): Object {
    return {
      base: this.base.serialized,
      vectorBase: this.vectorBase.serialized
    };
  }

  static deserialize(group: ECCurve, parameters: any) {
    // Compute base
    const g = group.pointFromCoordinates(
      parameters.base.g.x,
      parameters.base.g.y
    );
    const h = group.pointFromCoordinates(
      parameters.base.h.x,
      parameters.base.h.y
    );
    const base = new PedersenBase(g, h);

    // Compute Vector base
    const gPoints = parameters.vectorBase.gs.map(point =>
      group.pointFromCoordinates(point.x, point.y)
    );
    const hPoints = parameters.vectorBase.hs.map(point =>
      group.pointFromCoordinates(point.x, point.y)
    );
    const generatorVectorG = new GeneratorVector(gPoints, group);
    const generatorVectorH = new GeneratorVector(hPoints, group);
    const vectorBase = new VectorBase(generatorVectorG, generatorVectorH, h);

    return new GeneratorParams(vectorBase, base, group);
  }

  static generate(size: number, group: ECCurve): GeneratorParams {
    let gPoints = [] as ECPoint[];
    let hPoints = [] as ECPoint[];

    const stringToPoint = (input: string): ECPoint => {
      const bufferedString = Buffer.from(input, "utf8");
      return group.hashToPoint(bufferedString);
    };

    for (let i = 0; i < size; i++) {
      gPoints.push(stringToPoint("G" + i));
      hPoints.push(stringToPoint("H" + i));
    }

    const g = stringToPoint("G");
    const h = stringToPoint("H");

    const generatorVectorG = new GeneratorVector(gPoints, group);
    const generatorVectorH = new GeneratorVector(hPoints, group);

    const vectorBase = new VectorBase(generatorVectorG, generatorVectorH, h);
    const base = new PedersenBase(g, h);

    return new GeneratorParams(vectorBase, base, group);
  }
}
