// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IExpertReview {

    enum ReviewStrength {
        STRONG_POSITIVE,
        WEAK_POSITIVE,
        WEAK_NEGATIVE,
        STRONG_NEGATIVE
    }

    function getReviewResult(uint projectId)
        external
        view
        returns (uint sp, uint wp, uint wn, uint sn);

    function getReviewers(uint projectId)
        external
        view
        returns (address[] memory);

    function getReviewerStrength(uint projectId, address reviewer)
        external
        view
        returns (ReviewStrength);

    function hasReviewerVoted(uint projectId, address reviewer)
        external
        view
        returns (bool);

    function getComment(uint projectId, address reviewer)
        external
        view
        returns (string memory);
}
