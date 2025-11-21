// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IExpertReward {
    function distributeReward(uint projectId, uint totalReward)
        external
        payable;
}
