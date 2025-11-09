const FundVote = artifacts.require("FundVote");

module.exports = async function (deployer) {
  const nftAddress = "0xCfB7a6B1F357ee95d196BEBF6Cf55C8ACAbB31d4";
  const coreAddress = "0x5b017F10ab251FF1D1E804741812B4D2A80F074c";

  console.log("🚀 Redeploying FundVote only (updated version)");

  await deployer.deploy(FundVote, nftAddress, coreAddress);
  const vote = await FundVote.deployed();

  console.log("✅ New FundVote Address:", vote.address);
};
