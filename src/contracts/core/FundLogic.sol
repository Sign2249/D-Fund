// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundStorage.sol";
import "../interfaces/IExpertReputation.sol";
import "../interfaces/IExpertReview.sol";
import "../interfaces/IExpertReward.sol";


abstract contract FundLogic is FundStorage {

    // 🔹 새로 추가: 모금 종료(창작자만) — 돈은 건드리지 않고 상태만 전환
    function closeFundraising(uint _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only creator can close");
        require(project.status == ProjectStatus.FUNDRAISING, "Not fundraising");

        uint raised = projectFunds[_projectId].totalDonated;

        if (raised >= project.goalAmount) {
            // ✅ 목표 달성: 바로 송금/환불하지 말고, 투표를 위한 진행 상태로만 전환
            project.status = ProjectStatus.IN_PROGRESS;
        } else {
            // ❌ 목표 미달: 실패 처리 + 환불
            project.status = ProjectStatus.FAILED;
            _refundAllDonors(_projectId);
        }
    }

    function _refundAllDonors(uint _projectId) internal {
        address[] memory backers = projectDonors[_projectId];
        uint contractBalance = address(this).balance;

        for (uint i = 0; i < backers.length; i++) {
            address payable donor = payable(backers[i]);
            uint amount = donorBalances[_projectId][donor];

            if (amount > 0) {
                // 컨트랙트 잔액보다 큰 금액은 제한
                if (amount > contractBalance) {
                    amount = contractBalance;
                }

                donorBalances[_projectId][donor] = 0;
                (bool sent, ) = donor.call{value: amount}("");
                if (sent) {
                    contractBalance -= amount;
                } else {
                    donorBalances[_projectId][donor] = amount; // 실패 시 복원
                }
            }
        }
    }


    // 🔹 내부 환불 루틴(재사용)
    function releaseFundsToCreator(uint _projectId, uint _amount) public virtual {
        Project storage project = projects[_projectId];

        FundBalance storage fund = projectFunds[_projectId];
        uint available = fund.totalDonated - fund.transferredToCreator;
        require(available > 0, "No available funds");
        require(_amount > 0 && _amount <= available, "Invalid amount");

        // ✅ 후원자 비율대로 잔액 차감
        address[] memory backers = projectDonors[_projectId];
        uint total = projectFunds[_projectId].totalDonated;
        for (uint i = 0; i < backers.length; i++) {
            address donor = backers[i];
            uint bal = donorBalances[_projectId][donor];
            if (bal > 0) {
                // 후원자의 전체금액 대비 이번 지급 비율만큼 차감
                uint reduction = (bal * _amount) / total;
                donorBalances[_projectId][donor] -= reduction;
            }
        }

        // ✅ 상태 유지
        if (project.status != ProjectStatus.IN_PROGRESS) {
            project.status = ProjectStatus.IN_PROGRESS;
        }

        // ✅ 자금 전송
        fund.transferredToCreator += _amount;
        payable(project.creator).transfer(_amount);
    }



    // --- 이하 기존 코드 유지 ---

    function donateToProject(uint _projectId) external payable {
        require(msg.value > 0, "Must send ETH");
        require(projects[_projectId].status == ProjectStatus.FUNDRAISING, "Project not fundraising");

        donorBalances[_projectId][msg.sender] += msg.value;
        projectFunds[_projectId].totalDonated += msg.value;

        if (!hasDonated[_projectId][msg.sender]) {
            projectDonors[_projectId].push(msg.sender);
            hasDonated[_projectId][msg.sender] = true;
        }
    }


    function changeProjectStatusAndRefund(uint _projectId, uint8 newStatus) external {
        require(newStatus == uint8(ProjectStatus.FAILED) || newStatus == uint8(ProjectStatus.CANCELLED), "Only FAILED or CANCELLED allowed");

        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only creator can change status");

        project.status = ProjectStatus(newStatus);
        _refundAllDonors(_projectId);
    }

    function _changeProjectStatusAndRefund(uint _projectId, uint8 newStatus) internal {
        require(newStatus == uint8(ProjectStatus.FAILED) || newStatus == uint8(ProjectStatus.CANCELLED), "Only FAILED or CANCELLED allowed");
        Project storage project = projects[_projectId];
        project.status = ProjectStatus(newStatus);
        _refundAllDonors(_projectId);
    }


    // 후원자별 후원금 확인
    function getDonorBalance(uint _projectId, address _donor) public view returns (uint) {
        return donorBalances[_projectId][_donor];
    }

    // 후원금 총액 확인
    function getTotalDonated(uint _projectId) public view returns (uint) {
        return projectFunds[_projectId].totalDonated;
    }

    // 후원금 잔액 확인
    function getRemainingFunds(uint _projectId) public view returns (uint) {
        FundBalance memory f = projectFunds[_projectId];
        return f.totalDonated - f.transferredToCreator;
    }

    function donateWithReward(uint _projectId, uint _rewardIndex) external payable virtual {
        Reward memory r = projectRewards[_projectId][_rewardIndex];
        require(msg.value == r.price, "ETH must match reward price");

        donorBalances[_projectId][msg.sender] += msg.value;
        projectFunds[_projectId].totalDonated += msg.value;

        if (!hasDonated[_projectId][msg.sender]) {
            projectDonors[_projectId].push(msg.sender);
            hasDonated[_projectId][msg.sender] = true;
        }

        // ✅ 리워드 기록 추가
        donorRewards[_projectId][msg.sender].push(_rewardIndex);
    }


    // ✅ 조회 함수들
    function getDonorRewards(uint _projectId, address _donor) 
        external 
        view 
        returns (uint[] memory) 
    {
        return donorRewards[_projectId][_donor];
    }

    function getAllDonorRewards(uint _projectId) 
        external 
        view 
        returns (address[] memory donors, uint[][] memory rewards) 
    {
        address[] memory d = projectDonors[_projectId];
        uint[][] memory r = new uint[][](d.length);

        for (uint i = 0; i < d.length; i++) {
            r[i] = donorRewards[_projectId][d[i]];
        }

        return (d, r);
    }

function setExpertModules(
    address _review,
    address _reputation,
    address _reward
) public virtual {
    expertReviewContract = _review;
    expertReputationContract = _reputation;
    expertRewardContract = _reward;
}

    function completeProject(uint projectId) external {
        require(expertReputationContract != address(0), "Reputation contract not set");
        require(expertRewardContract != address(0), "Reward contract not set");

        Project storage project = projects[projectId];
        FundBalance storage fund = projectFunds[projectId];

        require(project.status == ProjectStatus.IN_PROGRESS, "Not in progress");

        // 🔹 남은 잔액 기준으로 계산
        uint remaining = fund.totalDonated - fund.transferredToCreator;
        require(remaining > 0, "No remaining funds");

        uint rewardAmount = (remaining * 20) / 100;  
        uint creatorAmount = remaining - rewardAmount;

        fund.transferredToCreator += creatorAmount;
        payable(project.creator).transfer(creatorAmount);

        // 🔹 전문가 평판 업데이트
        IExpertReputation(expertReputationContract)
            .updateReputation(projectId, true);

        // 🔹 전문가 보상 분배 (10%)
        IExpertReward(expertRewardContract)
            .distributeReward{value: rewardAmount}(projectId, rewardAmount);

        project.status = ProjectStatus.COMPLETED;
    }

}
