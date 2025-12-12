// ProjectDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import Swal from "sweetalert2";

import DFundCoreABI from "../truffle_abis/DFundCore.json";
import ExpertReviewABI from "../truffle_abis/ExpertReview.json";
import ExpertReputationABI from "../truffle_abis/ExpertReputation.json";
import ExpertRewardABI from "../truffle_abis/ExpertReward.json";
import VotingPowerNFTABI from "../truffle_abis/VotingPowerNFT.json";

import { isFundableStatus, getStatusLabel } from "../utils/statusUtils";
import { CONTRACT_ADDRESS } from "../web3/DFundContract";
import { CONTRACT_ADDRESS as REVIEW_CONTRACT_ADDRESS } from "../web3/ExpertReviewContract";
import { CONTRACT_ADDRESS as VOTING_NFT_ADDRESS } from "../web3/VotingPowerNFTContract";

import VotingPanel from "../components/VotingPanel";

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("로딩 중...");
  const [amount, setAmount] = useState("");
  const [fundedAmount, setFundedAmount] = useState("0");

  const [reviewStats, setReviewStats] = useState({
    sp: 0,
    wp: 0,
    wn: 0,
    sn: 0,
  });
  const [comments, setComments] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [allDonorRewards, setAllDonorRewards] = useState([]);
  const [userAddress, setUserAddress] = useState(null);

  const [expertStats, setExpertStats] = useState([]);

  /* ---------------------- 공통 유틸 ---------------------- */

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일` : "마감";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  /* ---------------------- 프로젝트 & 리뷰 로딩 ---------------------- */

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DFundCoreABI.abi,
          provider
        );
        const reviewContract = new ethers.Contract(
          REVIEW_CONTRACT_ADDRESS,
          ExpertReviewABI.abi,
          provider
        );

        const detail = await contract.getProject(id);
        const balance = await contract.getTotalDonated(id);

        // 유저 주소
        try {
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address.toLowerCase());
        } catch (err) {
          console.warn("지갑 주소를 가져올 수 없습니다.", err);
        }

        if (!detail || detail.title === "") {
          setStatus("프로젝트를 찾을 수 없습니다.");
          return;
        }

        setProject({
          id: detail.id.toString(),
          creator: detail.creator,
          title: detail.title,
          description: detail.description,
          image: detail.image,
          detailImages: detail.detailImages,
          goalAmount: ethers.utils.formatEther(detail.goalAmount),
          startDate: detail.startDate
            ? new Date(detail.startDate.toNumber() * 1000)
            : null,
          endDate: detail.endDate
            ? new Date(detail.endDate.toNumber() * 1000)
            : null,
          deadline: detail.deadline
            ? new Date(detail.deadline.toNumber() * 1000)
            : null,
          expertReviewRequested: detail.expertReviewRequested,
          status: detail.status,
        });

        setFundedAmount(ethers.utils.formatEther(balance));
        setStatus("");

        // 리워드 로딩
        try {
          const rewardsData = await contract.getProjectRewards(id);
          setRewards(rewardsData);
        } catch (err) {
          console.warn("리워드 불러오기 실패:", err);
        }

        // 전문가 평가 및 코멘트
        try {
          const result = await reviewContract.getReviewResult(Number(id));

          const sp = Number(result[0]);
          const wp = Number(result[1]);
          const wn = Number(result[2]);
          const sn = Number(result[3]);
          const total = sp + wp + wn + sn || 1;

          setReviewStats({
            sp: Math.round((sp / total) * 100),
            wp: Math.round((wp / total) * 100),
            wn: Math.round((wn / total) * 100),
            sn: Math.round((sn / total) * 100),
          });

          // 한줄평
          try {
            const reviewerAddresses = await reviewContract.getReviewers(
              Number(id)
            );
            const loadedComments = [];
            for (const addr of reviewerAddresses) {
              const comment = await reviewContract.getComment(Number(id), addr);
              if (comment && comment.trim() !== "") {
                loadedComments.push({ reviewer: addr, comment });
              }
            }
            setComments(loadedComments);
          } catch (err) {
            console.error("한줄평 불러오기 실패:", err);
          }
        } catch (err) {
          console.error("리뷰 데이터 로딩 실패:", err);
        }
      } catch (err) {
        console.error(err);
        setStatus("오류 발생");
      }
    };

    fetchProject();
  }, [id]);

  /* ---------------------- 전문가 평판 / 보상 ---------------------- */

  useEffect(() => {
    const loadExpertStats = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DFundCoreABI.abi,
          provider
        );

        const [reviewAddr, repAddr, rewardAddr] =
          await contract.getExpertModules();

        const review = new ethers.Contract(
          reviewAddr,
          ExpertReviewABI.abi,
          provider
        );
        const reputation = new ethers.Contract(
          repAddr,
          ExpertReputationABI.abi,
          provider
        );
        const reward = new ethers.Contract(
          rewardAddr,
          ExpertRewardABI.abi,
          provider
        );

        const reviewers = await review.getReviewers(Number(id));
        let list = [];
        let multipliers = [];

        for (let expert of reviewers) {
          const repScore = await reputation.getReputation(expert);
          const multiplier = await reward.getMultiplier(repScore);

          list.push({
            expert,
            repScore: Number(repScore),
            multiplier: Number(multiplier),
          });
          multipliers.push(Number(multiplier));
        }

        const total = await contract.getTotalDonated(id);
        const funds = await contract.projectFunds(id);
        const remaining = Number(total) - Number(funds.transferredToCreator);
        const rewardAmount = Number(total) * 0.1;

        const sumMultiplier = multipliers.reduce((a, b) => a + b, 0) || 1;

        const finalList = list.map((e) => {
          const expectedReward =
            (e.multiplier / sumMultiplier) * rewardAmount;
          return {
            ...e,
            expectedReward: ethers.utils.formatEther(
              expectedReward.toString()
            ),
          };
        });

        setExpertStats(finalList);
      } catch (err) {
        console.error("전문가 데이터 로딩 실패:", err);
      }
    };

    loadExpertStats();
  }, [id]);

  /* ---------------------- 후원 / 리워드 / NFT ---------------------- */

  const percent =
    project && project.goalAmount > 0
      ? Math.floor(
          (parseFloat(fundedAmount) / parseFloat(project.goalAmount)) * 100
        )
      : 0;

  const isDeadlineOver =
    project && project.deadline
      ? new Date() > project.deadline
      : false;

  const canFund =
    project && isFundableStatus(project.status) && !isDeadlineOver;

  // 리워드 선택 후 후원
  const handleFundWithReward = async (rewardIndex, rewardPrice) => {
    if (!window.ethereum) {
      Swal.fire("지갑 연결 필요", "Metamask가 필요합니다.", "error");
      return;
    }

    Swal.fire({
      title: "리워드 후원",
      text: `${amount} ETH를 후원하시겠습니까?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "후원",
      cancelButtonText: "취소",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) {
        Swal.fire("취소", "후원이 취소되었습니다.", "info");
        return;
      }
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DFundCoreABI.abi,
          signer
        );

        const tx = await contract.donateWithReward(project.id, rewardIndex, {
          value: rewardPrice,
        });
        await tx.wait();

        Swal.fire("성공", `${amount} ETH 후원이 완료되었습니다.`, "success");

        const updated = await contract.getTotalDonated(project.id);
        setFundedAmount(ethers.utils.formatEther(updated));
      } catch (err) {
        console.error(err);
        Swal.fire("실패", "후원에 실패했습니다.", "error");
      }
    });
  };

  // 금액 직접 입력 후 후원
  const handleFund = async () => {
    if (!window.ethereum) {
      Swal.fire("지갑 연결 필요", "Metamask가 필요합니다.", "error");
      return;
    }
    if (!amount) {
      Swal.fire("입력 확인", "후원할 금액이 입력되지 않았습니다.", "warning");
      return;
    }
    if (parseFloat(amount) <= 0) {
      Swal.fire("금액 확인", "후원 금액은 0보다 커야 합니다.", "warning");
      return;
    }

    Swal.fire({
      title: "리워드 후원",
      text: `${amount} ETH를 후원하시겠습니까?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "후원",
      cancelButtonText: "취소",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) {
        Swal.fire("취소", "후원이 취소되었습니다.", "info");
        return;
      }
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DFundCoreABI.abi,
          signer
        );

        const tx = await contract.donateToProject(project.id, {
          value: ethers.utils.parseEther(amount),
        });

        await tx.wait();

        Swal.fire("성공", `${amount} ETH 후원이 완료되었습니다.`, "success").then(() => {
          navigate(`/project/${project.id}/community-setup`);
        });

        setAmount("");
        const updated = await contract.getTotalDonated(project.id);
        setFundedAmount(ethers.utils.formatEther(updated));
      } catch (err) {
        console.error(err);
        Swal.fire("실패", "후원에 실패했습니다.", "error");
      }
    });
  };

  // 내 리워드 조회
  const handleCheckMyRewards = async () => {
    if (!window.ethereum) {
      setMyRewards(["Metamask가 필요합니다."]);
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const user = await signer.getAddress();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DFundCoreABI.abi,
        provider
      );

      const rewardIndexes = await contract.getDonorRewards(project.id, user);
      if (rewardIndexes.length === 0) {
        setMyRewards(["선택한 리워드가 없습니다."]);
        return;
      }

      const rewardsData = await contract.getProjectRewards(project.id);
      const myRewardsFormatted = rewardIndexes.map((idx) => {
        const r = rewardsData[idx];
        return `${r.name} (${ethers.utils.formatEther(r.price)} ETH)`;
      });

      setMyRewards(myRewardsFormatted);
    } catch (err) {
      console.error("내 리워드 조회 오류:", err);
      setMyRewards(["내 리워드 조회 실패"]);
    }
  };

  // 전체 후원자 리워드 조회 (창작자)
  const handleCheckAllDonorRewards = async () => {
    if (!window.ethereum) {
      setAllDonorRewards([
        { donor: "시스템", rewards: ["Metamask가 필요합니다."] },
      ]);
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const user = await signer.getAddress();

      if (user.toLowerCase() !== project.creator.toLowerCase()) {
        setAllDonorRewards([
          {
            donor: "시스템",
            rewards: ["⚠️ 프로젝트 생성자만 조회할 수 있습니다."],
          },
        ]);
        return;
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DFundCoreABI.abi,
        provider
      );
      const result = await contract.getAllDonorRewards(project.id);
      const donors = result[0];
      const rewardsList = result[1];
      const rewardsData = await contract.getProjectRewards(project.id);

      const donorRewardInfo = donors.map((donor, i) => {
        const indexes = rewardsList[i];
        const rewardsForDonor = indexes.map((idx) => {
          const r = rewardsData[idx];
          return `${r.name} (${ethers.utils.formatEther(r.price)} ETH)`;
        });
        return { donor, rewards: rewardsForDonor };
      });

      setAllDonorRewards(donorRewardInfo);
    } catch (err) {
      console.error("후원자 리워드 전체 조회 오류:", err);
      setAllDonorRewards([
        { donor: "시스템", rewards: ["후원자 리워드 전체 조회 실패"] },
      ]);
    }
  };

  // 후원 마감
  const handleEndFunding = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddr = await signer.getAddress();

      if (userAddr.toLowerCase() !== project.creator.toLowerCase()) {
        Swal.fire("권한 없음", "창작자만 후원을 마감할 수 있습니다.", "warning");
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const deadlineTimestamp = Math.floor(project.deadline.getTime() / 1000);
      if (now <= deadlineTimestamp) {
        Swal.fire("안내", "마감일 이후에만 후원을 마감할 수 있습니다.", "info");
        return;
      }

      Swal.fire({
        title: "후원 마감",
        text: "프로젝트 후원을 마감하시겠습니까?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "개시",
        cancelButtonText: "취소",
        reverseButtons: true,
      }).then(async (result) => {
        if (!result.isConfirmed) {
          Swal.fire("취소", "후원 마감이 취소되었습니다.", "info");
        }
        try {
          const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            DFundCoreABI.abi,
            signer
          );
          const tx = await contract.endFundingPhase(project.id);
          await tx.wait();

          Swal.fire("완료", "후원 마감이 완료되었습니다. 이후 단계별 투표가 진행됩니다.", "success"
          ).then(() => window.location.reload());
        } catch (err) {
          console.error("후원 마감 중 오류:", err);
          Swal.fire("실패", "후원 마감 중 오류가 발생했습니다.", "error");
        }
      });

    } catch (err) {
      console.error("초기 설정 오류", err);
    }
  };

  // 전문가 평가 페이지로 이동
  const handleExpertReviewClick = async () => {
    if (!project.expertReviewRequested) {
      Swal.fire("안내", "전문가 평가를 선택하지 않은 프로젝트입니다.", "info");
      return;
    }

    const now = new Date();
    const isBeforeDeadline =
      now.getTime() < project.deadline.getTime() - 10000;
    if (!isBeforeDeadline) {
      Swal.fire("평가 불가", "전문가 평가는 마감 10초 전까지만 가능합니다.", "warning");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      const reviewContract = new ethers.Contract(
        REVIEW_CONTRACT_ADDRESS,
        ExpertReviewABI.abi,
        provider
      );
      const alreadyReviewed = await reviewContract.hasReviewerVoted(
        Number(project.id),
        addr
      );
      if (alreadyReviewed) {
        Swal.fire("평가 완료", "이미 전문가 평가를 완료하였습니다.", "warning");
        return;
      }
      navigate(`/project/${project.id}/expert-review`);
    } catch (err) {
      console.error("전문가 평가 여부 확인 오류:", err);
      Swal.fire("오류", "전문가 평가 확인 중 오류가 발생했습니다.", "error");
    }
  };

  // 내 Voting NFT 조회
  const handleCheckMyNFTs = async () => {
    if (!window.ethereum) {
      Swal.fire("지갑 연결 필요", "Metamask가 필요합니다.", "error");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const user = await signer.getAddress();

      const nft = new ethers.Contract(
        VOTING_NFT_ADDRESS,
        VotingPowerNFTABI.abi,
        provider
      );

      const tokenId = await nft.donorTokenId(project.id, user);
      if (tokenId.toString() === "0") {
        setMyNFTs([{ tokenId: null, power: "0" }]);
        return;
      }

      const rawPower = await nft.getVotingPower(project.id, user);
      const formattedPower = rawPower.toString() / 1000000000;

      setMyNFTs([{ tokenId: tokenId.toString(), power: formattedPower }]);
    } catch (err) {
      console.error("NFT 조회 오류:", err);
      Swal.fire("실패", "NFT 정보를 불러오는 데 실패하였습니다.", "error");
    }
  };

  /* ---------------------- 렌더링 ---------------------- */

  if (status) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#eaefff] via-[#f4efff] to-white flex items-center justify-center">
        <p className="text-[#4b5563]">{status}</p>
      </div>
    );
  }
  if (!project) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] via-[#eef5ff] to-[#f7fbff] py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* 상단 제목 + 전문가 평가 버튼 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111827]">
              {project.title}
            </h1>
            <p className="text-sm text-[#6b7280] mt-2">
              생성자:{" "}
              <span className="font-mono">
                {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
              </span>
            </p>
          </div>

          <button
            onClick={handleExpertReviewClick}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#2563eb] text-white text-sm font-medium shadow hover:bg-[#1d4ed8] transition"
          >
            전문가 평가하기
          </button>
        </div>

        {/* 메인 2컬럼 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 이미지 + 전문가 평가 요약 */}
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden bg-[#e5e7eb] shadow-md">
              {project.image ? (
                <img
                  src={project.image}
                  alt="대표"
                  className="w-full h-150 object-cover"
                />
              ) : (
                <div className="w-full h-72" />
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#4b5563]">
                  전문가 심사 요청
                </span>
                <span className="text-sm font-semibold">
                  {project.expertReviewRequested ? "예" : "아니오"}
                </span>
              </div>

              {project.expertReviewRequested && (
                <>
                  <div className="h-3 w-full bg-[#e5e7eb] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-700"
                      style={{ width: `${reviewStats.sp}%` }}
                    />
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${reviewStats.wp}%` }}
                    />
                    <div
                      className="h-full bg-orange-400"
                      style={{ width: `${reviewStats.wn}%` }}
                    />
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${reviewStats.sn}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#4b5563]">
                    강한 긍정 {reviewStats.sp}% · 약한 긍정 {reviewStats.wp}% ·
                    약한 부정 {reviewStats.wn}% · 강한 부정 {reviewStats.sn}%
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 오른쪽: 펀딩 상태 + 후원 UI */}
          <div className="space-y-5">
            {/* 펀딩 요약 카드 */}
            <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-4">
              <div className="border-b border-[#e5e7eb] pb-4">
                <p className="text-xs text-[#6b7280] mb-1">모인 금액</p>
                <p className="text-3xl font-bold text-[#111827]">
                  {parseFloat(fundedAmount).toLocaleString()} ETH
                </p>
                <p className="text-sm text-[#4b5563] mt-1">
                  상태: {getStatusLabel(project.status)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">달성률</span>
                  <span className="text-xl font-bold text-[#111827]">
                    {percent}%
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    목표 {parseFloat(project.goalAmount).toLocaleString()} ETH
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#dbe4ff] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563eb]"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>

                <div className="flex flex-col gap-1 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">남은 기간</span>
                    <span className="text-lg font-semibold text-[#111827]">
                      {project.deadline
                        ? calculateDaysLeft(project.deadline)
                        : "-"}
                    </span>
                    {project.deadline && (
                      <span className="text-xs text-[#6b7280]">
                        {formatDate(project.deadline)} 마감
                      </span>
                    )}
                  </div>

                  {project.startDate && (
                    <p className="text-xs text-[#6b7280]">
                      프로젝트 시작: {formatDate(project.startDate)}
                    </p>
                  )}
                  {project.endDate && (
                    <p className="text-xs text-[#6b7280]">
                      프로젝트 종료: {formatDate(project.endDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 리워드 후원 카드 */}
            <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-4">
              <h3 className="text-base font-semibold text-[#111827]">리워드 선택 후원</h3>

              {rewards.length > 0 ? (
                <div className="space-y-3">
                  {rewards.map((r, idx) => {
                    const rewardDisabled = !canFund; // 🔒 마감되면 버튼 비활성화

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={rewardDisabled}
                        onClick={() => !rewardDisabled && handleFundWithReward(idx, r.price)}
                        className={`
                          w-full text-left rounded-2xl px-4 py-3 flex items-center justify-between transition
                          ${rewardDisabled
                            ? "border border-[#e5e7eb] bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border border-[#e5e7eb] bg-white hover:shadow-md hover:-translate-y-0.5"
                          }
                        `}
                      >
                        <span className="font-medium">{r.name}</span>
                        <span className={`text-sm font-semibold ${rewardDisabled ? "text-gray-400" : "text-[#2563eb]"}`}>
                          {ethers.utils.formatEther(r.price)} ETH
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">등록된 리워드가 없습니다.</p>
              )}

              {/* 기존의 “후원 불가” 메시지는 아래에 추가 */}
              {!canFund && (
                <p className="text-sm text-red-500 pt-2">
                  후원 기간이 종료되어 클릭할 수 없습니다.
                </p>
              )}
            </div>

            {/* 자유 금액 후원 카드 */}
            <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-3">
              <h3 className="text-base font-semibold text-[#111827]">
                자유 후원
              </h3>
              <input
                type="number"
                placeholder="후원 금액 (ETH)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border border-[#d1d5db] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40"
                disabled={!canFund}
              />
              <button
                type="button"
                onClick={handleFund}
                disabled={!canFund || !amount}
                className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow transition ${
                  canFund && amount
                    ? "bg-[#2563eb] hover:bg-[#1d4ed8]"
                    : "bg-[#9ca3af] cursor-not-allowed"
                }`}
              >
                {canFund ? "금액 직접 후원" : "후원 불가"}
              </button>
            </div>

            {/* 후원 마감 / 커뮤니티 / NFT */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleEndFunding}
                className="w-full rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow transition"
              >
                후원 마감
              </button>

              {project.status === 1 &&
                userAddress &&
                userAddress === project.creator.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/project/${project.id}/community-setup`)
                    }
                    className="w-full rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow transition"
                  >
                    🚀 커뮤니티 생성 / 관리
                  </button>
                )}

              <div className="bg-white rounded-2xl border border-[#e5e8ef] shadow px-4 py-3 space-y-2">
                <button
                  type="button"
                  onClick={handleCheckMyNFTs}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e] text-xs font-semibold text-white hover:bg-[#16a34a] transition"
                >
                  내 Voting Power 확인
                </button>

                {myNFTs.length > 0 && myNFTs[0].tokenId && (
                  <div className="text-xs text-[#374151] space-y-1 mt-2">
                    <p>
                      NFT Token ID:{" "}
                      <span className="font-mono">{myNFTs[0].tokenId}</span>
                    </p>
                    <p>
                      Voting Power:{" "}
                      <span className="font-semibold">
                        {myNFTs[0].power}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 내 리워드 / 전체 리워드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 내 리워드 */}
          <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">
                내가 선택한 리워드
              </h3>
              <button
                type="button"
                onClick={handleCheckMyRewards}
                className="px-3 py-1.5 rounded-full bg-[#2563eb] text-xs font-semibold text-white hover:bg-[#1d4ed8] transition"
              >
                조회
              </button>
            </div>
            {myRewards.length > 0 && (
              <div className="mt-2 bg-[#f1f5f9] rounded-2xl p-3">
                <ul className="list-disc pl-5 text-xs text-[#374151] space-y-1">
                  {myRewards.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 전체 후원자 리워드 */}
          <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">
                전체 후원자 리워드 (창작자)
              </h3>
              <button
                type="button"
                onClick={handleCheckAllDonorRewards}
                className="px-3 py-1.5 rounded-full bg-[#6d28d9] text-xs font-semibold text-white hover:bg-[#5b21b6] transition"
              >
                조회
              </button>
            </div>
            {allDonorRewards.length > 0 && (
              <div className="mt-2 bg-[#fdf2ff] rounded-2xl p-3">
                <ul className="list-disc pl-5 text-xs text-[#374151] space-y-1">
                  {allDonorRewards.map((d, i) => (
                    <li key={i}>
                      <span className="font-mono font-semibold">
                        {d.donor.slice
                          ? `${d.donor.slice(0, 6)}...${d.donor.slice(-4)}`
                          : d.donor}
                      </span>
                      : {d.rewards.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 투표 패널 */}
        <VotingPanel projectId={project.id} projectCreator={project.creator} />

        {/* 프로젝트 소개 / 상세 이미지 */}
        <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-8 space-y-6">
          <div className="border-l-4 border-[#2563eb] pl-4">
            <h2 className="text-xl font-bold text-[#111827]">프로젝트 소개</h2>
          </div>

          {project.detailImages && project.detailImages.length > 0 && (
            <div className="flex flex-wrap gap-4 justify-center">
              {project.detailImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`detail-${idx}`}
                  className="max-w-xs rounded-2xl shadow"
                />
              ))}
            </div>
          )}

          <div
            className="prose max-w-none text-sm text-[#374151]"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        </div>

        {/* 전문가 한줄평 */}
        {project.expertReviewRequested && comments.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-3">
            <h2 className="text-lg font-semibold text-[#111827]">
              전문가 한줄평
            </h2>
            <ul className="space-y-2 text-sm text-[#374151]">
              {comments.map((item, idx) => (
                <li
                  key={idx}
                  className="border-b last:border-0 border-[#e5e7eb] pb-2"
                >
                  <span className="font-mono text-xs text-[#6b7280]">
                    {item.reviewer.slice(0, 6)}...
                    {item.reviewer.slice(-4)}
                  </span>
                  <span className="ml-2">{item.comment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 전문가 상세 보상 테이블 */}
        {expertStats.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#e5e8ef] shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#111827]">
              전문가 평가 상세 정보
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[#e5e7eb] rounded-2xl overflow-hidden">
                <thead className="bg-[#f1f5f9]">
                  <tr>
                    <th className="px-3 py-2 border border-[#e5e7eb]">
                      전문가
                    </th>
                    <th className="px-3 py-2 border border-[#e5e7eb]">
                      평판 점수
                    </th>
                    <th className="px-3 py-2 border border-[#e5e7eb]">
                      Multiplier
                    </th>
                    <th className="px-3 py-2 border border-[#e5e7eb]">
                      예상 보상액 (ETH)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expertStats.map((e, i) => (
                    <tr key={i} className="text-center">
                      <td className="px-3 py-2 border border-[#e5e7eb] font-mono">
                        {e.expert.slice(0, 6)}...{e.expert.slice(-4)}
                      </td>
                      <td className="px-3 py-2 border border-[#e5e7eb]">
                        {e.repScore}
                      </td>
                      <td className="px-3 py-2 border border-[#e5e7eb]">
                        {e.multiplier}
                      </td>
                      <td className="px-3 py-2 border border-[#e5e7eb]">
                        {Number(e.expectedReward).toFixed(4)} ETH
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;