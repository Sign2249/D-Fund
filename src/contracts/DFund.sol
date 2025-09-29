// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundStorage.sol";
import "./ProjectManager.sol";
import "./FundLogic.sol";
import "./VotingPowerNFT.sol";

contract DFund is FundStorage, ProjectManager, FundLogic {
    VotingPowerNFT public votingNFT;

    function setVotingNFT(address _nft) external {
        require(address(votingNFT) == address(0), "NFT already set");
        votingNFT = VotingPowerNFT(_nft);
    }

    function donateWithReward(uint _projectId, uint _rewardIndex) 
    public 
    payable 
    override 
    {
        Reward memory r = projectRewards[_projectId][_rewardIndex];
        require(msg.value == r.price, "ETH must match reward price");

        donorBalances[_projectId][msg.sender] += msg.value;
        projectFunds[_projectId].totalDonated += msg.value;

        if (!hasDonated[_projectId][msg.sender]) {
            projectDonors[_projectId].push(msg.sender);
            hasDonated[_projectId][msg.sender] = true;
        }

        // ✅ 후원자가 어떤 리워드를 선택했는지 기록
        donorRewards[_projectId][msg.sender].push(_rewardIndex);
    }

    function releaseFundsToCreator(uint _projectId, uint _percent) public override {
        // ✅ NFT 먼저 발행
        if (address(votingNFT) != address(0)) {
            address[] memory backers = projectDonors[_projectId];
            for (uint i = 0; i < backers.length; i++) {
                address donor = backers[i];
                uint donorShare = donorBalances[_projectId][donor]; // 줄어들기 전 값
                if (donorShare > 0) {
                    votingNFT.mintVotingNFT(_projectId, donor, donorShare);
                }
            }
        }

        // ✅ 그 다음에 부모 로직 실행 (잔액 차감 및 송금)
        super.releaseFundsToCreator(_projectId, _percent);
    }

}
