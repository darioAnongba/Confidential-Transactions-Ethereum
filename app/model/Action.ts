export default class Action {
  // generate object with type and data attribute
  constructor(public type: string, public data?) {}

  getObjectAction() {
    return {
      type: this.type,
      data: this.data
    };
  }
}
