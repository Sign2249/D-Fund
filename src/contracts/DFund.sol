pragma solidity ^0.8.19;

contract DFund {
    uint public projectCount = 0;

    enum ProjectStatus { FUNDRAISING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED }

    struct Project {
        uint id;
        address creator;
        string title;
        string description;
        string image;
        string[] detailImages;
        uint goalAmount;
        uint deadline;
        bool expertReviewRequested;
        ProjectStatus status;
    }

    struct FundBalance {
        uint totalDonated;
        uint transferredToCreator;
    }

    mapping(uint => Project) public projects;
    mapping(uint => FundBalance) public projectFunds;
    mapping(uint => mapping(address => uint)) public donorBalances;
    mapping(uint => address[]) public projectDonors;
    mapping(uint => mapping(address => bool)) public hasDonated;

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
        newProject.goalAmount = _goalAmount;
        newProject.deadline = _deadline;
        newProject.expertReviewRequested = _expertReviewRequested;
        newProject.status = ProjectStatus.FUNDRAISING;

        for (uint i = 0; i < _detailImages.length; i++) {
            newProject.detailImages.push(_detailImages[i]);
        }

        emit ProjectRegistered(projectCount, msg.sender, _title, _goalAmount, _deadline, _expertReviewRequested);
    }

    function getProject(uint _id) public view returns (
        uint id,
        address creator,
        string memory title,
        string memory description,
        string memory image,
        string[] memory detailImages,
        uint goalAmount,
        uint deadline,
        bool expertReviewRequested,
        ProjectStatus status
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
            p.expertReviewRequested,
            p.status
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
}