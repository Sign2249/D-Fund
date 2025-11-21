// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ExpertReview.sol";

contract ExpertReputation {
    ExpertReview public expertReview;

    // 초기 평판 = 50
    mapping(address => uint256) public reputation;

    event ReputationUpdated(address indexed expert, uint256 oldScore, uint256 newScore);

    constructor(address _expertReview) {
        expertReview = ExpertReview(_expertReview);
    }

    // α 매핑
    function getAlpha(ExpertReview.ReviewStrength s) internal pure returns (uint256) {
        if (
            s == ExpertReview.ReviewStrength.STRONG_POSITIVE ||
            s == ExpertReview.ReviewStrength.STRONG_NEGATIVE
        ) return 8; // α = 0.08 → 정수 8으로 처리
        return 3; // α = 0.03 → 정수 3
    }

    // 프로젝트 종료 시 호출
    function updateReputation(uint projectId, bool projectSucceeded) external {

        address[] memory experts = expertReview.getReviewers(projectId);

        for (uint i = 0; i < experts.length; i++) {
            address expert = experts[i];

            uint256 oldScore = reputation[expert] == 0 ? 50 : reputation[expert];
            ExpertReview.ReviewStrength strength = expertReview.getReviewerStrength(projectId, expert);

            uint256 alpha = getAlpha(strength);

            uint256 T;

            if (projectSucceeded) {
                // 성공 예측이 맞으면
                if (strength == ExpertReview.ReviewStrength.STRONG_POSITIVE ||
                    strength == ExpertReview.ReviewStrength.WEAK_POSITIVE
                ) T = 100;
                else T = 0; // 실패 예측 → 틀림
            } else {
                // 실패 예측이 맞으면
                if (strength == ExpertReview.ReviewStrength.STRONG_NEGATIVE ||
                    strength == ExpertReview.ReviewStrength.WEAK_NEGATIVE
                ) T = 0;
                else T = 100; // 성공 예측 → 틀림
            }

            // PDF 수식: S_new = (1 - α)*S + α*T
            // α는 0~1이 아닌 0.08 → 8 로 처리 → 8/100
            uint256 newScore = ((100 - alpha) * oldScore + alpha * T) / 100;

            reputation[expert] = newScore;

            emit ReputationUpdated(expert, oldScore, newScore);
        }
    }

    // 현재 평판 조회
    function getReputation(address expert) external view returns (uint) {
        return reputation[expert] == 0 ? 50 : reputation[expert];
    }
}