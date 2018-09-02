var alt_bn128 = artifacts.require("./alt_bn128.sol");
var Conversion = artifacts.require("./Conversion.sol");
var UTXO = artifacts.require("./UTXO.sol");
var PublicParameters = artifacts.require("./PublicParameters.sol");
var InnerProductVerifier = artifacts.require("./InnerProductVerifier.sol");
var BulletproofVerifier = artifacts.require("./BulletproofVerifier.sol");
var CTToken = artifacts.require("./CTToken.sol");

module.exports = function(deployer) {
  deployer.deploy(alt_bn128);
  deployer.deploy(Conversion);
  deployer.deploy(UTXO);
  deployer.link(alt_bn128, PublicParameters);
  deployer.link(Conversion, PublicParameters);
  deployer.link(alt_bn128, InnerProductVerifier);
  deployer.link(alt_bn128, BulletproofVerifier);
  deployer.link(alt_bn128, CTToken);
  deployer.link(UTXO, CTToken);
};
