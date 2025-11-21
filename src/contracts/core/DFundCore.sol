// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundStorage.sol";
import "./ProjectManager.sol";
import "./FundLogic.sol";
import "../nft/VotingPowerNFT.sol";

contract DFundCore is FundStorage, ProjectManager, FundLogic {
    VotingPowerNFT public votingNFT;

    event FundingSuccessful(uint projectId, uint totalDonated);
    event FundingFailed(uint projectId);

    constructor(address _nft) {
        votingNFT = VotingPowerNFT(_nft);
    }

    function setVotingNFT(address _nft) external {
        require(address(votingNFT) == address(0), "NFT already set");
        votingNFT = VotingPowerNFT(_nft);
    }

    // ✅ ProjectManager 상속 구현
    function registerProject(
        string memory _title,
        string memory _description,
        string memory _image,
        string[] memory _detailImages,
        uint _goalAmount,
        uint _startDate,
        uint _endDate,
        uint _deadline,
        bool _expertReviewRequested,
        Reward[] memory _rewards
    ) public override {
        super.registerProject(
            _title,
            _description,
            _image,
            _detailImages,
            _goalAmount,
            _startDate,
            _endDate,
            _deadline,
            _expertReviewRequested,
            _rewards
        );
    }

    // ✅ 후원 성공 시 NFT 발행 + 상태 전환 함수
    function endFundingPhase(uint _projectId) external {
        Project storage project = projects[_projectId];
        FundBalance storage fund = projectFunds[_projectId];

        require(project.status == ProjectStatus.FUNDRAISING, "Not fundraising");

        // ✅ 목표 달성 여부 확인
        if (fund.totalDonated >= project.goalAmount) {
            project.status = ProjectStatus.IN_PROGRESS;

            // ✅ NFT 발행 (후원자 전원에게)
            if (address(votingNFT) != address(0)) {
                address[] memory donors = projectDonors[_projectId];
                for (uint i = 0; i < donors.length; i++) {
                    address donor = donors[i];
                    uint donorShare = donorBalances[_projectId][donor];
                    if (donorShare > 0) {
                        votingNFT.mintVotingNFT(_projectId, donor, donorShare);
                    }
                }
            }

            emit FundingSuccessful(_projectId, fund.totalDonated);
        } else {
            // 실패 시 환불
            project.status = ProjectStatus.FAILED;
            address[] memory donors = projectDonors[_projectId];
            for (uint i = 0; i < donors.length; i++) {
                address donor = donors[i];
                uint amount = donorBalances[_projectId][donor];
                if (amount > 0) {
                    donorBalances[_projectId][donor] = 0;
                    payable(donor).transfer(amount);
                }
            }
            emit FundingFailed(_projectId);
        }
    }

    // ✅ 기존 releaseFundsToCreator는 NFT 발행 없이 송금만
    function releaseFundsToCreator(uint _projectId, uint _percent)
        public
        override
    {
        super.releaseFundsToCreator(_projectId, _percent);
    }

    // 관리용: 강제 상태 변경 함수 (테스트용)
    function forceComplete(uint projectId) external {
        projects[projectId].status = ProjectStatus.COMPLETED;
    }

    function forceFail(uint projectId) external {
        _changeProjectStatusAndRefund(projectId, uint8(ProjectStatus.FAILED));
    }

    function setExpertModules(
        address _review,
        address _reputation,
        address _reward
    ) public override {
        super.setExpertModules(_review, _reputation, _reward);
    }

    function getExpertModules()
        external
        view
        returns (address review, address reputation, address reward)
    {
        return (
            expertReviewContract,
            expertReputationContract,
            expertRewardContract
        );
    }
}