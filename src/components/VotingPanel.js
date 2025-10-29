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

  // ✅ 초기 로드 + 1초마다 남은 시간 갱신
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

      // ✅ 투표 종료 시간
      const endTimeBn = await contract.getVoteEndTime(projectId);
      const endTimeNum = endTimeBn.toNumber();
      setEndTime(endTimeNum);

      const now = Math.floor(Date.now() / 1000);
      setRemainingSeconds(Math.max(0, endTimeNum - now));

      // ✅ 찬성/반대 퍼센트 불러오기
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
    const diff = endTime - now;
    setRemainingSeconds(Math.max(0, diff));
  }

  // ✅ 투표 개시 (창작자만)
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
        provider.pollingInterval = 500; // ✅ 블록 감지 주기 빠르게
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, FUNDVOTE_ABI, signer);

        const tx = await contract.voteOnRound(projectId, approve);
        await tx.wait();

        // ✅ 트랜잭션 완료 후 강제 새로고침
        await new Promise(r => setTimeout(r, 1500));
        await loadVoteInfo();

        alert(`✅ 투표 완료 (${approve ? "찬성" : "반대"})`);
        setHasVoted(true);
    } catch (err) {
        console.error(err);
        alert("투표 실패");
    }
    }


  // ✅ 투표 마감 (시간이 지나야 가능)
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

      // ✅ 최소 한 표라도 있어야 마감 가능
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
    <div
      style={{
        marginTop: "2rem",
        padding: "1.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif'
      }}
    >
      <h3>📊 프로젝트 진행 투표</h3>
      <p>현재 라운드: {currentRound}</p>

      {endTime > 0 ? (
        <p>
          종료 예정:{" "}
          {new Date(endTime * 1000).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour12: false,
          })}
          <br />
          남은 시간: <strong>{remainingText}</strong>
        </p>
      ) : (
        <p>아직 투표가 개시되지 않았습니다.</p>
      )}

      {/* ✅ 투표율 표시 */}
      <div style={{ marginTop: "1rem" }}>
        <p>찬성률: {yesPercent}% / 반대율: {noPercent}%</p>
        <div
          style={{
            width: "100%",
            height: "12px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#eee",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${yesPercent}%`,
              backgroundColor: "#10b981",
              transition: "width 0.3s ease",
            }}
          ></div>
          <div
            style={{
              width: `${noPercent}%`,
              backgroundColor: "#ef4444",
              transition: "width 0.3s ease",
            }}
          ></div>
        </div>
      </div>

      {/* ✅ 버튼 그룹 */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={handleOpenVote} style={btnStyleBlue}>투표 개시</button>
        <button onClick={() => handleVote(true)} style={btnStyleGreen}>찬성</button>
        <button onClick={() => handleVote(false)} style={btnStyleRed}>반대</button>
        <button
          onClick={handleFinalize}
          disabled={remainingSeconds > 0}
          style={{
            ...btnStyleBlack,
            opacity: remainingSeconds > 0 ? 0.5 : 1,
            cursor: remainingSeconds > 0 ? "not-allowed" : "pointer",
          }}
        >
          투표 마감
        </button>
      </div>

      {status && (
        <p style={{ marginTop: "1rem", color: "#555" }}>{status}</p>
      )}
    </div>
  );
}

// 버튼 스타일
const btnStyleBlue = {
  padding: "0.6rem 1.2rem",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
};
const btnStyleGreen = {
  padding: "0.6rem 1.2rem",
  backgroundColor: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
};
const btnStyleRed = {
  padding: "0.6rem 1.2rem",
  backgroundColor: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
};
const btnStyleBlack = {
  padding: "0.6rem 1.2rem",
  backgroundColor: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
};
