var PublicParameters = artifacts.require("./PublicParameters.sol");
var InnerProductVerifier = artifacts.require("./InnerProductVerifier.sol");
var BulletproofVerifier = artifacts.require("./BulletproofVerifier.sol");
var CTToken = artifacts.require("./CTToken.sol");

module.exports = async function(deployer) {
  deployer.deploy(InnerProductVerifier, PublicParameters.address).then(() => {
    return deployer
      .deploy(
        BulletproofVerifier,
        PublicParameters.address,
        InnerProductVerifier.address
      )
      .then(() => {
        return deployer.deploy(
          CTToken,
          BulletproofVerifier.address
        );
      });
  });
};
