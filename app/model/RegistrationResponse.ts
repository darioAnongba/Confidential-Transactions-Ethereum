export default class RegistrationResponse {
  type: string;
  result: Object;
  etherBalance: string;
  message: string;

  constructor(response?: RegistrationResponse) {
    if (response) {
      Object.assign(this, response);
    }
  }
}
