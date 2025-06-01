// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ExpertReview {

    // 프로젝트의 모든 Review들
    struct ReviewInfo {
        uint positive;
        uint negative;
        mapping(address => bool) hasVoted;
        mapping(address => string) comments;
    }

    mapping(uint => ReviewInfo) private projectReviews;
    mapping(uint => address[]) private reviewers;
    mapping(uint => uint) public projectDeadline;
    mapping(uint => bool) public isReviewEnabled;

    event ReviewSubmitted(
        uint indexed projectId,
        address indexed reviewer,
        bool isPositive,
        string comment
    );

    modifier onlyBeforeDeadline(uint _projectId) {
        require(block.timestamp < projectDeadline[_projectId] - 60, "Review period has ended");
        _;
    }

    modifier reviewable(uint _projectId) {
        require(isReviewEnabled[_projectId], "Project not reviewable");
        _;
    }

    // 전문가 평가가 가능하도록 함
    function enableReview(uint _projectId, uint _deadline) external {
        require(_deadline > block.timestamp, "Invalid deadline");
        isReviewEnabled[_projectId] = true;
        projectDeadline[_projectId] = _deadline;
    }

    // 평가 제출 (프로젝트에 긍정, 부정 개수 증가, 평가 여부, comment 추가)
    function submitReview(
        uint _projectId,
        bool isPositive,
        string calldata comment
    ) external reviewable(_projectId) onlyBeforeDeadline(_projectId) {
        ReviewInfo storage review = projectReviews[_projectId];
        require(!review.hasVoted[msg.sender], "Already reviewed");

        if (isPositive) {
            review.positive++;
        } else {
            review.negative++;
        }

        review.hasVoted[msg.sender] = true;
        review.comments[msg.sender] = comment;
        reviewers[_projectId].push(msg.sender);

        emit ReviewSubmitted(_projectId, msg.sender, isPositive, comment);
    }

    // 평가 결과 반환
    function getReviewResult(uint _projectId) external view returns (uint positive, uint negative) {
        ReviewInfo storage review = projectReviews[_projectId];
        return (review.positive, review.negative);
    }

    // 전문가 평가 여부 반환
    function hasReviewerVoted(uint _projectId, address reviewer) external view returns (bool) {
        return projectReviews[_projectId].hasVoted[reviewer];
    }

    // 리뷰어 목록 (한줄평 출력용)
    function getReviewers(uint _projectId) external view returns (address[] memory) {
        return reviewers[_projectId];
    }

    // comment 받아오기
    function getComment(uint _projectId, address reviewer) external view returns (string memory) {
        return projectReviews[_projectId].comments[reviewer];
    }
}
