const DFund = artifacts.require("DFund");
const ExpertReview = artifacts.require("ExpertReview");
const VotingPowerNFT = artifacts.require("VotingPowerNFT");

module.exports = async function (deployer) {
  // 1. VotingPowerNFT 먼저 배포
  await deployer.deploy(VotingPowerNFT);
  const nft = await VotingPowerNFT.deployed();

  // 2. DFund 배포
  await deployer.deploy(DFund);
  const dfund = await DFund.deployed();

  // 3. ExpertReview 배포
  await deployer.deploy(ExpertReview);
  const expertReview = await ExpertReview.deployed();

  // 4. DFund ↔ VotingPowerNFT 연결
  await dfund.setVotingNFT(nft.address);
  await nft.setDFund(dfund.address);

  console.log("✅ VotingPowerNFT deployed at:", nft.address);
  console.log("✅ DFund deployed at:", dfund.address);
  console.log("✅ ExpertReview deployed at:", expertReview.address);
};
