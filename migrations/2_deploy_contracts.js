const VotingPowerNFT = artifacts.require("VotingPowerNFT");
const DFundCore = artifacts.require("DFundCore");
const FundVote = artifacts.require("FundVote");
const ExpertReview = artifacts.require("ExpertReview");
const ExpertReputation = artifacts.require("ExpertReputation");
const ExpertReward = artifacts.require("ExpertReward");

module.exports = async function (deployer, network, accounts) {
  console.log("🚀 Deploying to", network);

  // 1️⃣ NFT 배포
  await deployer.deploy(VotingPowerNFT);
  const nft = await VotingPowerNFT.deployed();

  // 2️⃣ DFundCore 배포 (NFT 주소 constructor로 전달)
  await deployer.deploy(DFundCore, nft.address);
  const dfundCore = await DFundCore.deployed();

  // 3️⃣ FundVote 배포
  await deployer.deploy(FundVote, nft.address, dfundCore.address);
  const fundVote = await FundVote.deployed();

  // 4️⃣ ExpertReview 배포
  await deployer.deploy(ExpertReview);
  const review = await ExpertReview.deployed();

  // 5️⃣ ExpertReputation 배포
  await deployer.deploy(ExpertReputation, review.address);
  const reputation = await ExpertReputation.deployed();

  // 6️⃣ ExpertReward 배포
  await deployer.deploy(ExpertReward, reputation.address, review.address);
  const reward = await ExpertReward.deployed();

  // 7️⃣ DFundCore에 모듈 연결 (🔥 가장 중요!)
  await dfundCore.setExpertModules(
    review.address,
    reputation.address,
    reward.address
  );

  // 8️⃣ NFT에 Core 주소 등록
  await nft.setDFund(dfundCore.address);

  console.log("==============================================");
  console.log("✅ VotingPowerNFT deployed at:", nft.address);
  console.log("✅ DFundCore deployed at:", dfundCore.address);
  console.log("✅ FundVote deployed at:", fundVote.address);
  console.log("✅ ExpertReview deployed at:", review.address);
  console.log("✅ ExpertReputation deployed at:", reputation.address);
  console.log("✅ ExpertReward deployed at:", reward.address);
  console.log("==============================================");
};