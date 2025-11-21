
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IExpertReputation {
    function updateReputation(uint projectId, bool projectSucceeded) external;
    function getReputation(address expert) external view returns (uint);
}
