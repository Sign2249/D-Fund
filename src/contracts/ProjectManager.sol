// SPDX-License-Identifier: MIT
// 프로젝트 등록 및 조회 기능
pragma solidity ^0.8.19;

import "./FundStorage.sol";

abstract contract ProjectManager is FundStorage {       // FundStorage에서 정의된 변수들 상속받아 사용
    
    function registerProject(
        string memory _title,                           // 참조 타입(string, byte, array, struct)을 인자로 받을 때는 memory를 써야함
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
    }

    function getProject(uint _id) public view returns (Project memory) { // 반환값도 구조체 형식이기 때문에 memory 사용
        return projects[_id];
    }

    function getAllProjects() public view returns (Project[] memory) {
        Project[] memory result = new Project[](projectCount);          // result는 참조타입이고 임시변수이기 때문에 memory 사용
        for (uint i = 1; i <= projectCount; i++) {                      // projectCount 길이를 가진 빈 Project 배열을 메모리에 생성하고, 그 배열을 result라는 변수에 저장
            result[i - 1] = projects[i];
        }
        return result;
    }
}
