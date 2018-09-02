import Web3 from "web3";
import HDWalletProvider from "truffle-hdwallet-provider";
import * as types from "./types";
import Session from "../model/Session";
import { store } from "../store";
import { networks, endpoints } from "../store/api/config";
import TokenABI from "../../resources/contracts/CTToken.json";
import { MBits } from "../utils";
import { fetchApi } from "../store/api";
import RegistrationResponse from "../model/RegistrationResponse";
import { showLongToastAndroid } from "../utils/errorHandler";
import { localeString } from "../locales";
import apiConfig from "../store/api/config";
import GeneratorParams from "../libs/prover/rangeProof/GeneratorParams";
import ECCurve from "../libs/prover/curve/ECCurve";
import CryptoUtils from "../libs/prover/utils";

// Action functions
export async function createSession(
  dispatch,
  mnemonic: string,
  index?: number
) {
  const session = new Session();

  // Web3
  if (index) session.index = index;
  session.network = networks.main;
  const provider = new HDWalletProvider(mnemonic, session.network.url, index);
  session.web3 = new Web3(provider);

  // Crypto Parameters
  session.cryptoParameters = GeneratorParams.generate(
    MBits,
    new ECCurve("bn256")
  );

  // Account
  session.account = session.web3.utils.toChecksumAddress(provider.addresses[0]);

  // Token Contract
  session.token = new session.web3.eth.Contract(
    TokenABI.abi,
    TokenABI.networks[session.network.id].address,
    {
      from: session.account
    }
  );

  session.isRegistered = await session.token.methods
    .isRegistered(session.account)
    .call();

  session.centralBankAddress = await session.token.methods.owner().call();

  // If not registered, receive ether and register user
  if (!session.isRegistered && apiConfig.host !== "") {
    const response = (await fetchApi(
      endpoints.REGISTRATION.replace("{userAddress}", session.account)
    )) as RegistrationResponse;

    switch (response.type) {
      case "Success":
        await setRegister(session);
        break;
      case "Error":
        showLongToastAndroid(
          response.message +
            "\n" +
            localeString("intro.error_registration_manual")
        );
        break;
      default:
        showLongToastAndroid(localeString("intro.registration_error"));
    }
  }

  dispatch({
    type: types.SESSION_INIT,
    session: session
  });

  dispatch({
    type: types.PARAMETERS_SAVE,
    parameters: session.serialize
  });
}

export async function loadSession(dispatch, mnemonic: string) {
  const parameters = store.getState().parameters;
  const session = Session.deserialize(parameters, mnemonic);

  dispatch({
    type: types.SESSION_INIT,
    session: session
  });
}

export async function register(dispatch) {
  const session = store.getState().session as Session;
  const parameters = store.getState().parameters;
  await setRegister(session);

  dispatch({
    type: types.SESSION_INIT,
    session
  });

  parameters.isRegistered = true;
  dispatch({
    type: types.PARAMETERS_SAVE,
    parameters
  });
}

async function setRegister(session: Session) {
  const { web3, token } = session;

  const pubKey = CryptoUtils.getPubKeyAsArray(web3.currentProvider);
  const r = await token.methods.register(pubKey).send();
  console.log(r);
  session.isRegistered = true;
}
