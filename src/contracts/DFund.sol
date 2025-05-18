// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DFund {
    uint public projectCount = 0;

    struct Project {
        uint id;
        address creator;
        string title;
        string description;
        string image;               // ✅ 대표 이미지 (선택)
        string[] detailImages;      // ✅ 상세 이미지 배열 (선택)
        uint goalAmount;            // 단위: wei
        uint deadline;              // Unix timestamp
        bool expertReviewRequested;
        bool isActive;
    }

    mapping(uint => Project) public projects;
    mapping(uint => uint) public projectBalance;

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
        string memory _image,             // ✅ image 파라미터 추가
        string[] memory _detailImages,    // ✅ detailImages 파라미터 추가
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
        newProject.image = _image;                     // ✅ 이미지 저장
        newProject.goalAmount = _goalAmount;
        newProject.deadline = _deadline;
        newProject.expertReviewRequested = _expertReviewRequested;
        newProject.isActive = true;

        for (uint i = 0; i < _detailImages.length; i++) {
            newProject.detailImages.push(_detailImages[i]); // ✅ 상세 이미지 배열 저장
        }

        emit ProjectRegistered(
            projectCount,
            msg.sender,
            _title,
            _goalAmount,
            _deadline,
            _expertReviewRequested
        );
    }

    function getProject(uint _id) public view returns (
        uint id,
        address creator,
        string memory title,
        string memory description,
        string memory image,               // ✅ 반환값 추가
        string[] memory detailImages,      // ✅ 반환값 추가
        uint goalAmount,
        uint deadline,
        bool expertReviewRequested
    ) {
        Project memory p = projects[_id];
        return (
            p.id,
            p.creator,
            p.title,
            p.description,
            p.image,
            p.detailImages,
            p.goalAmount,
            p.deadline,
            p.expertReviewRequested
        );
    }

    function getAllProjects() public view returns (Project[] memory) {
        Project[] memory result = new Project[](projectCount);
        for (uint i = 1; i <= projectCount; i++) {
            result[i - 1] = projects[i];
        }
        return result;
    }

    function donateToProject(uint _projectId) external payable {
        require(msg.value > 0, "Must send ETH");
        require(projects[_projectId].isActive, "Invalid project");
        projectBalance[_projectId] += msg.value;
    }
}
