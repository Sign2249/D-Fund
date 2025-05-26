// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundStorage.sol";

abstract contract FundLogic is FundStorage {
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

    function releaseFundsToCreator(uint _projectId, uint _percent) external {
        require(_percent <= 1, "Invalid percentage");
        Project storage project = projects[_projectId];
        require(project.creator == msg.sender, "Only creator can withdraw");

        FundBalance storage fund = projectFunds[_projectId];
        uint available = fund.totalDonated - fund.transferredToCreator;
        require(available > 0, "No available funds");

        uint payout = available * _percent;
        require(payout > 0, "Payout too small");

        address[] memory backers = projectDonors[_projectId];
        for (uint i = 0; i < backers.length; i++) {
            address donor = backers[i];
            uint donorShare = donorBalances[_projectId][donor];
            if (donorShare > 0) {
                uint reduction = donorShare * _percent;
                donorBalances[_projectId][donor] -= reduction;
            }
        }

        if (project.status != ProjectStatus.IN_PROGRESS) {
            project.status = ProjectStatus.IN_PROGRESS;
        }

        fund.transferredToCreator += payout;
        payable(project.creator).transfer(payout);
    }

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

    function getDonorBalance(uint _projectId, address _donor) public view returns (uint) {
        return donorBalances[_projectId][_donor];
    }

    function getTotalDonated(uint _projectId) public view returns (uint) {
        return projectFunds[_projectId].totalDonated;
    }

    function getRemainingFunds(uint _projectId) public view returns (uint) {
        FundBalance memory f = projectFunds[_projectId];
        return f.totalDonated - f.transferredToCreator;
    }
}
