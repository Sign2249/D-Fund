// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundStorage.sol";

abstract contract ProjectManager is FundStorage {
    event ProjectRegistered(
        uint indexed id,
        address indexed creator,
        string title,
        uint goalAmount,
        uint deadline,
        bool expertReviewRequested
    );

    function registerProject(
        string memory _title,
        string memory _description,
        string memory _image,
        string[] memory _detailImages,
        uint _goalAmount,
        uint _deadline,
        bool _expertReviewRequested
    ) public {
        require(bytes(_title).length > 0, "Title is required.");
        require(bytes(_description).length > 0, "Description is required.");
        require(_goalAmount > 0, "Goal amount must be greater than zero.");
        require(_deadline > block.timestamp, "Deadline must be a future time.");

        projectCount++;
        Project storage newProject = projects[projectCount];

        newProject.id = projectCount;
        newProject.creator = msg.sender;
        newProject.title = _title;
        newProject.description = _description;
        newProject.image = _image;
        newProject.detailImages = _detailImages;
        newProject.goalAmount = _goalAmount;
        newProject.deadline = _deadline;
        newProject.expertReviewRequested = _expertReviewRequested;
        newProject.status = ProjectStatus.FUNDRAISING;

        emit ProjectRegistered(projectCount, msg.sender, _title, _goalAmount, _deadline, _expertReviewRequested);
    }

    function getProject(uint _id) public view returns (Project memory) {
        return projects[_id];
    }

    function getAllProjects() public view returns (Project[] memory) {
        Project[] memory result = new Project[](projectCount);
        for (uint i = 1; i <= projectCount; i++) {
            result[i - 1] = projects[i];
        }
        return result;
    }
}
