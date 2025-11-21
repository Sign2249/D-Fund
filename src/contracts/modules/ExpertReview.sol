// SPDX-License-Identifier: MIT
// 전문가 리뷰
pragma solidity ^0.8.19;

contract ExpertReview {

    enum ReviewStrength { STRONG_POSITIVE, WEAK_POSITIVE, WEAK_NEGATIVE, STRONG_NEGATIVE }

    // 프로젝트의 모든 Review들
    struct ReviewInfo {
        uint strongPositive;
        uint weakPositive;
        uint weakNegative;
        uint strongNegative;
        mapping(address => bool) hasVoted;
        mapping(address => string) comments;
        mapping(address => ReviewStrength) strengths;
    }

    mapping(uint => ReviewInfo) private projectReviews;
    mapping(uint => address[]) private reviewers;
    mapping(uint => uint) public projectDeadline;
    mapping(uint => bool) public isReviewEnabled;

    event ReviewSubmitted(
        uint indexed projectId,
        address indexed reviewer,
        ReviewStrength strength,
        string comment
    );

    modifier onlyBeforeDeadline(uint _projectId) {
        require(block.timestamp < projectDeadline[_projectId] - 10, "Review period has ended");
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
    ReviewStrength strength,
    string calldata comment
    ) external reviewable(_projectId) onlyBeforeDeadline(_projectId) {
        ReviewInfo storage review = projectReviews[_projectId];
        require(!review.hasVoted[msg.sender], "Already reviewed");

        if (strength == ReviewStrength.STRONG_POSITIVE) review.strongPositive++;
        else if (strength == ReviewStrength.WEAK_POSITIVE) review.weakPositive++;
        else if (strength == ReviewStrength.WEAK_NEGATIVE) review.weakNegative++;
        else review.strongNegative++;

        review.hasVoted[msg.sender] = true;
        review.comments[msg.sender] = comment;
        review.strengths[msg.sender] = strength;
        reviewers[_projectId].push(msg.sender);

        emit ReviewSubmitted(_projectId, msg.sender, strength, comment);
    }

    // 평가 결과 반환
    function getReviewResult(uint _projectId)
        external
        view
        returns (uint sp, uint wp, uint wn, uint sn)
    {
        ReviewInfo storage review = projectReviews[_projectId];
        return (review.strongPositive, review.weakPositive, review.weakNegative, review.strongNegative);
    }

    // 전문가 평가 여부 반환
    function hasReviewerVoted(uint _projectId, address reviewer)
        external
        view
        returns (bool)
    {
        return projectReviews[_projectId].hasVoted[reviewer];
    }

        function getReviewerStrength(uint _projectId, address reviewer)
        external
        view
        returns (ReviewStrength)
    {
        return projectReviews[_projectId].strengths[reviewer];
    }

    // 리뷰어 목록 (한줄평 출력용)
    function getReviewers(uint _projectId)
        external
        view
        returns (address[] memory)
    {
        return reviewers[_projectId];
    }

    function getComment(uint _projectId, address reviewer)
        external
        view
        returns (string memory)
    {
        return projectReviews[_projectId].comments[reviewer];
    }

}