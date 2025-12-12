// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IExpertReward.sol";
import "../interfaces/IExpertReputation.sol";
import "../interfaces/IExpertReview.sol";

contract ExpertReward is IExpertReward {
    IExpertReputation public reputation;
    IExpertReview public reviews;

    constructor(address _rep, address _review) {
        reputation = IExpertReputation(_rep);
        reviews = IExpertReview(_review);
    }

    /// ------------------------------------------------------------
    /// 💰 평판 기반 multiplier
    /// ------------------------------------------------------------
    function getMultiplier(uint score) public pure returns (uint256) {
        return score * score / 100;
    }

    /// ------------------------------------------------------------
    /// 💸 전문가 보상 분배
    /// R = 총 보상 금액
    /// ------------------------------------------------------------
    function distributeReward(uint projectId, uint R)
        external
        payable
        override
    {
        require(msg.value == R, "Incorrect reward amount");

        address[] memory experts = reviews.getReviewers(projectId);
        require(experts.length > 0, "No reviewers");

        uint totalMultiplier = 0;
        uint[] memory m = new uint[](experts.length);

        // 모든 전문가 multiplier 계산
        for (uint i = 0; i < experts.length; i++) {
            uint repScore = reputation.getReputation(experts[i]);
            m[i] = getMultiplier(repScore);
            totalMultiplier += m[i];
        }

        // 보상 분배
        for (uint i = 0; i < experts.length; i++) {
            uint amount = (R * m[i]) / totalMultiplier;
            payable(experts[i]).transfer(amount);
        }
    }
}