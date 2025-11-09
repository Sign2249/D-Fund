// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../core/DFundCore.sol";
import "../nft/VotingPowerNFT.sol";

contract FundVote {
    VotingPowerNFT public votingNFT;
    DFundCore public dfundCore;

    struct VoteRound {
        uint yesPower;
        uint noPower;
        mapping(address => bool) voted;
        bool active;
        uint startTime;
        uint endTime;
        bool executed;
    }

    mapping(uint => mapping(uint => VoteRound)) private projectVotes;
    mapping(uint => uint) public currentRound;

    constructor(address _nft, address _core) {
        votingNFT = VotingPowerNFT(_nft);
        dfundCore = DFundCore(_core);
    }

    modifier onlyCreator(uint projectId) {
        DFundCore.Project memory p = dfundCore.getProject(projectId);
        require(msg.sender == p.creator, "Not project creator");
        _;
    }

    // ✅ 투표 개시
    function openVoteRound(uint projectId) external onlyCreator(projectId) {
        DFundCore.Project memory p = dfundCore.getProject(projectId);
        require(uint(p.status) == 1, "Not active");
        require(dfundCore.getTotalDonated(projectId) >= p.goalAmount, "Goal not met");

        currentRound[projectId]++;
        uint round = currentRound[projectId];

        VoteRound storage vr = projectVotes[projectId][round];
        vr.active = true;
        vr.startTime = block.timestamp;
        vr.endTime = block.timestamp + 60;
        vr.executed = false;
    }

    // ✅ 투표 종료 시간
    function getVoteEndTime(uint projectId) external view returns (uint) {
        uint round = currentRound[projectId];
        return projectVotes[projectId][round].endTime;
    }

    // ✅ 투표하기
    function voteOnRound(uint projectId, bool approve) external {
        uint round = currentRound[projectId];
        require(projectVotes[projectId][round].active, "No active vote");
        require(!projectVotes[projectId][round].voted[msg.sender], "Already voted");

        uint power = votingNFT.getVotingPower(projectId, msg.sender);
        require(power > 0, "No voting power");

        projectVotes[projectId][round].voted[msg.sender] = true;

        if (approve) {
            projectVotes[projectId][round].yesPower += power;
        } else {
            projectVotes[projectId][round].noPower += power;
        }
    }

    // ✅ 퍼센트 확인 (안전 계산)
    function getCurrentVotePercentage(uint projectId)
        external
        view
        returns (uint yesPercent, uint noPercent)
    {
        uint round = currentRound[projectId];
        uint yes = projectVotes[projectId][round].yesPower;
        uint no = projectVotes[projectId][round].noPower;
        uint total = yes + no;

        if (total == 0) return (0, 0);
        yesPercent = (yes * 100) / total;
        noPercent = 100 - yesPercent;
    }

    // ✅ 디버깅용
    function getVotePower(uint projectId, uint round)
        external
        view
        returns (uint yesPower, uint noPower)
    {
        VoteRound storage vr = projectVotes[projectId][round];
        return (vr.yesPower, vr.noPower);
    }

    // ✅ 투표 마감
    function finalizeVote(uint projectId) external {
        uint round = currentRound[projectId];
        require(projectVotes[projectId][round].active, "No active vote");
        require(!projectVotes[projectId][round].executed, "Already finalized");

        uint yes = projectVotes[projectId][round].yesPower;
        uint no = projectVotes[projectId][round].noPower;
        uint total = yes + no;
        require(total > 0, "No votes cast");

        projectVotes[projectId][round].executed = true;
        projectVotes[projectId][round].active = false;

        uint percent = (yes * 100) / total;
        DFundCore.Project memory p = dfundCore.getProject(projectId);
        uint releaseAmount = dfundCore.getTotalDonated(projectId) / 2;

        if (percent >= 50) {
            uint available = dfundCore.getRemainingFunds(projectId);
            uint releaseAmount = available / 2;
            dfundCore.releaseFundsToCreator(projectId, releaseAmount);

            if (currentRound[projectId] >= 2) {
                dfundCore.forceComplete(projectId);
            }
        } else {
            // ✅ 실패 시에는 잔여금 전액 환불만
            dfundCore.forceFail(projectId);
        }

    }
}
