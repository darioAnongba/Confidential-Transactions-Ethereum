var PublicParameters = artifacts.require("./PublicParameters.sol");

module.exports = async function(deployer) {
  deployer.deploy(PublicParameters).then(async () => {
    const publicParams = await PublicParameters.deployed();
    for (let i = 0; i < 1500; i++) {
      try {
        await publicParams.createGVector();
        await publicParams.createHVector();
      } catch (err) {
        break;
      }
    }
  });
};
