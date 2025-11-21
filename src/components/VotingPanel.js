import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { FUNDVOTE_ABI, CONTRACT_ADDRESS } from "../web3/FundVoteContract";

export default function VotingPanel({ projectId, projectCreator }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [yesPercent, setYesPercent] = useState(0);
  const [noPercent, setNoPercent] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadVoteInfo();
    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [projectId, endTime]);

  async function loadVoteInfo() {
    if (!window.ethereum) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FUNDVOTE_ABI, provider);

    try {
      const round = await contract.currentRound(projectId);
      setCurrentRound(round.toNumber());

      const endTimeBn = await contract.getVoteEndTime(projectId);
      const endTimeNum = endTimeBn.toNumber();
      setEndTime(endTimeNum);

      const now = Math.floor(Date.now() / 1000);
      setRemainingSeconds(Math.max(0, endTimeNum - now));

      try {
        const [yes, no] = await contract.getCurrentVotePercentage(projectId);
        setYesPercent(yes.toNumber());
        setNoPercent(no.toNumber());
      } catch {
        setYesPercent(0);
        setNoPercent(0);
      }
    } catch (err) {
      console.error("투표 정보 로드 실패:", err);
    }
  }

  function updateRemainingTime() {
    if (endTime === 0) return;
    const now = Math.floor(Date.now() / 1000);
    setRemainingSeconds(Math.max(0, endTime - now));
  }

  async function handleOpenVote() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const user = await signer.getAddress();

      if (user.toLowerCase() !== projectCreator.toLowerCase()) {
        alert("⚠️ 프로젝트 생성자만 투표를 개시할 수 있습니다.");
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, FUNDVOTE_ABI, signer);
      const tx = await contract.openVoteRound(projectId);
      await tx.wait();

      alert("✅ 투표 라운드가 개시되었습니다!");
      loadVoteInfo();
    } catch (err) {
      console.error(err);
      alert("투표 개시 실패");
    }
  }

  async function handleVote(approve) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      provider.pollingInterval = 500;
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FUNDVOTE_ABI, signer);

      const tx = await contract.voteOnRound(projectId, approve);
      await tx.wait();

      await new Promise((r) => setTimeout(r, 1500));
      await loadVoteInfo();

      alert(`✅ 투표 완료 (${approve ? "찬성" : "반대"})`);
      setHasVoted(true);
    } catch (err) {
      console.error(err);
      alert("투표 실패");
    }
  }

  async function handleFinalize() {
    const now = Math.floor(Date.now() / 1000);
    if (now < endTime) {
      alert("⚠️ 아직 투표 마감 시간이 되지 않았습니다.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FUNDVOTE_ABI, signer);

      const [yes, no] = await contract.getCurrentVotePercentage(projectId);
      if (yes.toNumber() + no.toNumber() === 0) {
        alert("❌ 아직 투표가 없습니다.");
        return;
      }

      const tx = await contract.finalizeVote(projectId);
      await tx.wait();

      alert("✅ 투표가 정상적으로 마감되었습니다!");
      loadVoteInfo();
    } catch (err) {
      console.error("투표 마감 실패:", err);
      alert("❌ 투표 마감 중 오류 발생");
    }
  }

  const remainingText =
    remainingSeconds > 0
      ? `${remainingSeconds}초 남음`
      : "투표 종료됨 (마감 가능)";

  return (
    <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-8 space-y-6">

        {/* 제목 */}
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
          <span>📊</span> 프로젝트 진행 투표
        </h3>

        {/* 투표 정보 */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-primary">현재 라운드:</span>{" "}
            {currentRound}
          </p>

          {endTime > 0 ? (
            <>
              <p>
                <span className="font-semibold text-primary">종료 예정:</span>{" "}
                {new Date(endTime * 1000).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-primary">남은 시간:</span>{" "}
                {remainingText}
              </p>
            </>
          ) : (
            <p>아직 투표가 개시되지 않았습니다.</p>
          )}
        </div>

        {/* 투표율 표시 */}
        <div className="mt-5">
          <p className="text-sm mb-2">
            찬성률:{" "}
            <span className="font-semibold text-green-600">
              {yesPercent}%
            </span>{" "}
            / 반대율:{" "}
            <span className="font-semibold text-red-600">
              {noPercent}%
            </span>
          </p>

          <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${yesPercent}%` }}
            ></div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3 mt-8 flex-wrap">

          {/* 투표 개시 버튼 */}
          <button
            onClick={handleOpenVote}
            className="px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            투표 개시
          </button>

          {/* 찬성 버튼 */}
          <button
            onClick={() => handleVote(true)}
            className="px-5 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition"
          >
            찬성
          </button>

          {/* 반대 버튼 */}
          <button
            onClick={() => handleVote(false)}
            className="px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
          >
            반대
          </button>

          {/* 투표 마감 버튼 */}
          <button
            onClick={handleFinalize}
            disabled={remainingSeconds > 0}
            className={`px-5 py-3 rounded-xl font-semibold transition ${
              remainingSeconds > 0
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-[#0f172a] text-white hover:bg-black cursor-pointer"
            }`}
          >
            투표 마감
          </button>
        </div>

        {status && (
          <p className="text-sm text-gray-600 mt-4">{status}</p>
        )}
      </div>
  );
}