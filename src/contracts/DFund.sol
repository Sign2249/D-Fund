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

        // ✅ NFT 발행 (그대로 유지)
        if (address(votingNFT) != address(0)) {
            votingNFT.mintVotingNFT(_projectId, msg.sender, msg.value);
        }
    }

}
