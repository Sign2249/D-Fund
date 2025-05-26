const DFund = artifacts.require("DFund");
const ExpertReview = artifacts.require("ExpertReview");

module.exports = async function (deployer) {
  await deployer.deploy(DFund);

  await deployer.deploy(ExpertReview);
};