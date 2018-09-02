import Web3 from "web3";
import Contract from "web3/eth/contract";
import HDWalletProvider from "truffle-hdwallet-provider";
import TokenABI from "../../resources/contracts/CTToken.json";
import GeneratorParams from "../libs/prover/rangeProof/GeneratorParams";
import ECCurve from "../libs/prover/curve/ECCurve";

export default class Session {
  web3: Web3 = undefined;
  cryptoParameters: GeneratorParams = undefined;
  token: Contract = undefined;
  account: string = undefined;
  isRegistered: boolean = undefined;
  centralBankAddress: string = undefined;
  index: number = 0;
  network: any = undefined;

  constructor(session?: Session) {
    if (session) {
      Object.assign(this, session);
    }
  }

  get serialize() {
    return {
      cryptoParameters: this.cryptoParameters.serialized,
      account: this.account,
      isRegistered: this.isRegistered,
      centralBankAddress: this.centralBankAddress,
      index: this.index,
      network: this.network
    };
  }

  static deserialize(parameters: any, mnemonic: string): Session {
    const session = new Session();

    session.isRegistered = parameters.isRegistered;
    session.centralBankAddress = parameters.centralBankAddress;
    session.network = parameters.network;

    // Web3
    const provider = new HDWalletProvider(
      mnemonic,
      parameters.network.url,
      parameters.index
    );
    session.web3 = new Web3(provider);

    // Crypto Parameters
    session.cryptoParameters = GeneratorParams.deserialize(
      new ECCurve("bn256"),
      parameters.cryptoParameters
    );

    // Account
    session.account = parameters.account;

    // Token Contract
    session.token = new session.web3.eth.Contract(
      TokenABI.abi,
      TokenABI.networks[session.network.id].address,
      {
        from: session.account
      }
    );

    return session;
  }
}
