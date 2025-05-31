// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract FundStorage {
    enum ProjectStatus { FUNDRAISING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED }

    struct Project {
        uint id;
        address creator;
        string title;
        string description;
        string image;
        string[] detailImages;
        uint goalAmount;
        uint deadline;
        bool expertReviewRequested;
        ProjectStatus status;
    }

    struct FundBalance {
        uint totalDonated;          // 전체 후원 금액
        uint transferredToCreator;  // 창작자에게 전송되는 금액
    }

    uint public projectCount;
    mapping(uint => Project) public projects;
    mapping(uint => FundBalance) public projectFunds;
    mapping(uint => mapping(address => uint)) public donorBalances;
    mapping(uint => address[]) public projectDonors;
    mapping(uint => mapping(address => bool)) public hasDonated;
}
