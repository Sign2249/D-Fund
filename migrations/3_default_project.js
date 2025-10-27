const DFundCore = artifacts.require("DFundCore");

module.exports = async function (deployer, network, accounts) {
  console.log("📦 Registering default project on:", network);

  const dfund = await DFundCore.deployed();
  const creator = accounts[0];
  const goalAmount = web3.utils.toWei("1", "ether");
  const now = Math.floor(Date.now() / 1000);

  const startDate = now + 60 * 5;
  const endDate = now + 60 * 10;
  const deadline = now + 60 * 1;

  const rewards = [
    { name: "첫번째 리워드", price: web3.utils.toWei("1", "ether") },
    { name: "두번째 리워드", price: web3.utils.toWei("2", "ether") }
  ];

  // Solidity 구조체 배열로 전달할 때는 단순 객체 배열 전달 가능 (Truffle 자동 인코딩)
  await dfund.registerProject(
    "기본 프로젝트",
    "이건 자동 등록된 예시 프로젝트입니다",
    "https://example.com/default.jpg",
    ["https://example.com/detail1.jpg", "https://example.com/detail2.jpg"],
    goalAmount,
    startDate,
    endDate,
    deadline,
    false,
    rewards,
    { from: creator }
  );
  await new Promise(r => setTimeout(r, 5000));

  console.log("🎯 기본 프로젝트가 자동 등록되었습니다!");
  console.log("-------------------------------------------");
  console.log("창작자:", creator);
  console.log("목표 금액: 1 ETH");
  console.log("후원 마감일:", new Date(deadline * 1000).toLocaleString());
  console.log("시작일:", new Date(startDate * 1000).toLocaleString());
  console.log("마감일:", new Date(endDate * 1000).toLocaleString());
  console.log("리워드:", rewards);
  console.log("-------------------------------------------");
};
