import Config from "react-native-config";

export default {
  host: Config.HOST
};

export const keys = {
  MNEMONIC: "mnemonic",
  WALLET: "wallet"
};

export const endpoints = {
  REGISTRATION: "/users/register/{userAddress}"
};

export const networks = {
  main: {
    name: "Main network",
    url: Config.NETWORK_HOST,
    id: Config.NETWORK_ID
  }
};
