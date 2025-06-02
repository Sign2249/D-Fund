// SPDX-License-Identifier: MIT
// 프로젝트 후원 및 환불, 출금 기능
pragma solidity ^0.8.19;

import "./FundStorage.sol";

abstract contract FundLogic is FundStorage {
    
    //프로젝트 후원
    function donateToProject(uint _projectId) external payable {
        require(msg.value > 0, "Must send ETH");
        require(projects[_projectId].status == ProjectStatus.FUNDRAISING, "Project not fundraising");   // 모금중 상태일때만 후원 가능

        donorBalances[_projectId][msg.sender] += msg.value;     // 특정 프로젝트에 특정 후원자가 얼마를 후원했는지
        projectFunds[_projectId].totalDonated += msg.value;     // 특정 프로젝트에 총 모금된 금액

        if (!hasDonated[_projectId][msg.sender]) {
            projectDonors[_projectId].push(msg.sender);         // 프로젝트 후원자 목록에 추가
            hasDonated[_projectId][msg.sender] = true;          // 프로젝트 후원 여부 true
        }
    }

    // 후원금 출금
    function releaseFundsToCreator(uint _projectId, uint _percent) external {
        require(_percent <= 1, "Invalid percentage");

        Project storage project = projects[_projectId];
        require(project.creator == msg.sender, "Only creator can withdraw");

        FundBalance storage fund = projectFunds[_projectId];
        uint available = fund.totalDonated - fund.transferredToCreator;     // 후원받은 금액에서 이미 인출한 금액을 뺀 값이 인출 가능 금액
        require(available > 0, "No available funds");

        uint payout = available * _percent;                                 // 인출 가능 금액에서 percent만큼 인출
        require(payout > 0, "Payout too small");

        address[] memory backers = projectDonors[_projectId];               // 후원자들의 후원 잔액 차감
        for (uint i = 0; i < backers.length; i++) {                         // 정산 로직
            address donor = backers[i];
            uint donorShare = donorBalances[_projectId][donor];
            if (donorShare > 0) {
                uint reduction = donorShare * _percent;                     // 각 후원자가 기여한 금액(donorShare)에서 _percent만큼 감소
                donorBalances[_projectId][donor] -= reduction;
            }
        }

        if (project.status != ProjectStatus.IN_PROGRESS) {
            project.status = ProjectStatus.IN_PROGRESS;
        }

        fund.transferredToCreator += payout;
        payable(project.creator).transfer(payout);                          // 창작자에게 후원금 전송
    }

    // 프로젝트 무산 시 환불 기능
    function changeProjectStatusAndRefund(uint _projectId, uint8 newStatus) external {
        require(newStatus == uint8(ProjectStatus.FAILED) || newStatus == uint8(ProjectStatus.CANCELLED), "Only FAILED or CANCELLED allowed");

        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only creator can change status");

        project.status = ProjectStatus(newStatus);

        address[] memory backers = projectDonors[_projectId];
        for (uint i = 0; i < backers.length; i++) {
            address donor = backers[i];
            uint amount = donorBalances[_projectId][donor];
            if (amount > 0) {
                donorBalances[_projectId][donor] = 0;
                payable(donor).transfer(amount);
            }
        }
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
}
