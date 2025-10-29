const VotingPowerNFT = artifacts.require("VotingPowerNFT");
const DFundCore = artifacts.require("DFundCore");
const FundVote = artifacts.require("FundVote");
const ExpertReview = artifacts.require("ExpertReview");

module.exports = async function (deployer, network, accounts) {
  console.log("🚀 Deploying to", network);

  // 1️⃣ NFT 배포
  await deployer.deploy(VotingPowerNFT);
  const nft = await VotingPowerNFT.deployed();

  // 2️⃣ DFundCore 배포 (NFT 주소 constructor로 전달됨)
  await deployer.deploy(DFundCore, nft.address);
  const dfundCore = await DFundCore.deployed();

  // 3️⃣ FundVote 배포
  await deployer.deploy(FundVote, nft.address, dfundCore.address);
  const fundVote = await FundVote.deployed();

  // 4️⃣ ExpertReview 배포
  await deployer.deploy(ExpertReview);
  const expert = await ExpertReview.deployed();

  // ✅ NFT ↔ DFundCore 연결
  await nft.setDFund(dfundCore.address);

  console.log("✅ VotingPowerNFT:", nft.address);
  console.log("✅ DFundCore:", dfundCore.address);
  console.log("✅ FundVote:", fundVote.address);
  console.log("✅ ExpertReview:", expert.address);
};
