// SPDX-License-Identifier: MIT
// 프로젝트 기본 형식
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
    mapping(uint => Project) public projects;                       // 프로젝트의 전체 정보
    mapping(uint => FundBalance) public projectFunds;               // 후원 금액 관련 정보
    mapping(uint => mapping(address => uint)) public donorBalances; // 특정 프로젝트에 특정 주소가 얼마를 후원했는지
    mapping(uint => address[]) public projectDonors;                // 후원한 사람들의 주소 목록
    mapping(uint => mapping(address => bool)) public hasDonated;    // 해당 주소가 해당 프로젝트에 최소 한 번 이상 후원한 이력이 있는지
}
