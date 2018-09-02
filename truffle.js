require("dotenv").config();
require("babel-register");
require("babel-polyfill");

var HDWalletProvider = require("truffle-hdwallet-provider");

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network =>
  providerWithMnemonic(
    process.env.MNEMONIC || "",
    `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
  );

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    secutix: {
      provider: providerWithMnemonic(
        process.env.MNEMONIC || "",
        "http://int1geth2a.euwe.secutix.net:8080"
      ),
      network_id: 1515
    },
    ropsten: {
      provider: infuraProvider("ropsten"),
      network_id: 3
    },
    rinkeby: {
      provider: infuraProvider("rinkeby"),
      network_id: 4
    },
    kovan: {
      provider: infuraProvider("kovan"),
      network_id: 42
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
