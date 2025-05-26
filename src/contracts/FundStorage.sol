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
        uint totalDonated;
        uint transferredToCreator;
    }

    struct Expert {
        uint positive;
        uint negative;
        uint predictedSuccessCount;
        uint totalResponses;
    }

    uint public projectCount;
    mapping(uint => Project) public projects;
    mapping(uint => FundBalance) public projectFunds;
    mapping(uint => mapping(address => uint)) public donorBalances;
    mapping(uint => address[]) public projectDonors;
    mapping(uint => mapping(address => bool)) public hasDonated;

    // 전문가 평가 관련 상태
    mapping(address => Expert) public expertStats;
    mapping(uint => mapping(address => bool)) public hasReviewed;
    mapping(uint => address[]) public reviewers;
    mapping(uint => mapping(address => bool)) public reviewIsPositive;
}
