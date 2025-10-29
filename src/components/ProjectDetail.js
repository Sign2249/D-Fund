// ProjectDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { ethers } from 'ethers';

import DFundCoreABI from '../truffle_abis/DFundCore.json';
import ExpertReviewABI from '../truffle_abis/ExpertReview.json';
import { isFundableStatus, getStatusLabel } from '../utils/statusUtils';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';
import { CONTRACT_ADDRESS as REVIEW_CONTRACT_ADDRESS } from '../web3/ExpertReviewContract';
import VotingPowerNFTABI from "../truffle_abis/VotingPowerNFT.json";
import { CONTRACT_ADDRESS as VOTING_NFT_ADDRESS } from "../web3/VotingPowerNFTContract";
import Swal from 'sweetalert2';

import VotingPanel from '../components/VotingPanel';


function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('로딩 중...');
  const [amount, setAmount] = useState('');
  const [fundedAmount, setFundedAmount] = useState('0');
  const [reviewStats, setReviewStats] = useState({ positive: 0, negative: 0 });
  const [comments, setComments] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [allDonorRewards, setAllDonorRewards] = useState([]);
  const [userAddress, setUserAddress] = useState(null); // userAddress 상태 추가

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCoreABI.abi, provider);
        const reviewContract = new ethers.Contract(REVIEW_CONTRACT_ADDRESS, ExpertReviewABI.abi, provider);
        const detail = await contract.getProject(id);
        const balance = await contract.getTotalDonated(id);

        // 👈 2. useEffect 초기에 유저 주소 가져오기
        try {
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address.toLowerCase()); // 소문자로 통일
        } catch (err) {
          console.warn("지갑 주소를 가져올 수 없습니다.", err);
        }

        if (!detail || detail.title === '') {
          setStatus('프로젝트를 찾을 수 없습니다.');
          return;
        }

        // 프로젝트 설정
        setProject({
          id: detail.id.toString(),
          creator: detail.creator,
          title: detail.title,
          description: detail.description,
          image: detail.image,
          detailImages: detail.detailImages,
          goalAmount: ethers.utils.formatEther(detail.goalAmount),

          startDate: detail.startDate ? new Date(detail.startDate.toNumber() * 1000) : null,
          endDate: detail.endDate ? new Date(detail.endDate.toNumber() * 1000) : null,
          deadline: detail.deadline ? new Date(detail.deadline.toNumber() * 1000) : null,

          expertReviewRequested: detail.expertReviewRequested,
          status: detail.status
        });


        setFundedAmount(ethers.utils.formatEther(balance));
        setStatus('');

        // 리워드 불러오기
        try {
          const rewardsData = await contract.getProjectRewards(id);
          setRewards(rewardsData);
        } catch (err) {
          console.warn("리워드 불러오기 실패:", err);
        }


        // 전문가 평가 설정
        try {
          const result = await reviewContract.getReviewResult(Number(id));
          const positive = result.positive;
          const negative = result.negative;
          setReviewStats({ positive: Number(positive), negative: Number(negative) });
          try {
            // reviewContract에서 reviewers 가져오기
            const reviewerAddresses = await reviewContract.getReviewers(Number(id));
            const loadedComments = [];
          
            for (const addr of reviewerAddresses) {
              const comment = await reviewContract.getComment(Number(id), addr);
              if (comment && comment.trim() !== '') {
                loadedComments.push({ reviewer: addr, comment });
              }
            }
            setComments(loadedComments);
          } catch (err) {
            console.error('한줄평 불러오기 실패:', err);
          }          
        } catch (error) {
          console.error("리뷰 데이터 로딩 실패:", error);
        }
      } catch (err) {
        console.error(err);
        setStatus('오류 발생');
      }
    };
    fetchProject();
  }, [id]);

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일` : '마감';
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };
  
  if (status) return <p>{status}</p>;
  if (!project) return null;

  const percent = Math.floor((parseFloat(fundedAmount) / parseFloat(project.goalAmount)) * 100);
  const isDeadlineOver = new Date() > project.deadline;
  const canFund = isFundableStatus(project.status) && !isDeadlineOver;

  // ✅ 리워드 선택 후 후원
  const handleFundWithReward = async (rewardIndex, rewardPrice) => {
    if (!window.ethereum) {
      alert('Metamask가 필요합니다.');
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCoreABI.abi, signer);

      const tx = await contract.donateWithReward(project.id, rewardIndex, {
        value: rewardPrice
      });
      await tx.wait();

      alert('리워드 후원 성공!');
      const updated = await contract.getTotalDonated(project.id);
      setFundedAmount(ethers.utils.formatEther(updated));
    } catch (err) {
      console.error(err);
      alert('후원 실패');
    }
  };

  // ✅ 금액 직접 입력 후 후원
const handleFund = async () => {
  // ... (위에 있는 두 번째 코드의 함수 내용과 동일)
  if (!window.ethereum || !amount) {
    alert('Metamask가 필요하거나 후원 금액을 입력해야 합니다.');
    return;
  }
  
  if (parseFloat(amount) <= 0) {
    Swal.fire({
      title: '후원 실패',
      text: '후원 금액은 0보다 커야 합니다.',
      icon: 'warning',

      confirmButtonText: '확인'
    });
    return; // 함수를 즉시 종료
  }

  Swal.fire({
    title: '후원하시겠습니까?',
    text: `이 프로젝트에 ${amount}ETH를 후원하시겠습니까?`,
    icon: 'question',

    showCancelButton: true,
    confirmButtonColor: '#0000ff',
    cancelButtonColor: '#ff0000',
    confirmButtonText: '예',
    cancelButtonText: '아니오',
    reverseButtons: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCoreABI.abi, signer);

          const tx = await contract.donateToProject(project.id, {
            value: ethers.utils.parseEther(amount),
          });

          await tx.wait();

          Swal.fire({
            title: '후원 성공!',
            text: `프로젝트에 ${amount}ETH 후원하였습니다.`,
            icon: 'success',

            confirmButtonText: '확인'
                    }).then(() => {
            navigate(`/project/${project.id}/community-setup`);});
          setAmount(''); // 입력창 비우기

          const updated = await contract.getTotalDonated(project.id);
          setFundedAmount(ethers.utils.formatEther(updated));
        } catch (err) {
          console.error(err);
          Swal.fire({
            title: '후원 실패',
            text: '알 수 없는 이유로 후원에 실패했습니다.',
            icon: 'error',

            confirmButtonText: '확인'
          });
        }
    }

    else if (result.isDismissed) {
      Swal.fire({
            title: '후원 취소',
            text: '후원이 취소되었습니다.',
            icon: 'info',
            
            confirmButtonText: '확인'
      });
    }
  })


};

  // 내가 선택한 리워드 확인
const handleCheckMyRewards = async () => {
  if (!window.ethereum) {
    setMyRewards(["Metamask가 필요합니다."]);
    return;
  }
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const user = await signer.getAddress();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCoreABI.abi, provider);

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

// 전체 후원자 리워드 조회 (창작자만 가능)
const handleCheckAllDonorRewards = async () => {
  if (!window.ethereum) {
    setAllDonorRewards([{ donor: "시스템", rewards: ["Metamask가 필요합니다."] }]);
    return;
  }
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const user = await signer.getAddress();

    if (user.toLowerCase() !== project.creator.toLowerCase()) {
      setAllDonorRewards([{ donor: "시스템", rewards: ["⚠️ 프로젝트 생성자만 조회할 수 있습니다."] }]);
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCoreABI.abi, provider);
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
    setAllDonorRewards([{ donor: "시스템", rewards: ["후원자 리워드 전체 조회 실패"] }]);
  }
};

// ✅ 수정된 후원 마감 로직 (단계별 투표 구조용)
  const handleEndFunding = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      // ⚠️ 창작자 확인
      if (userAddress.toLowerCase() !== project.creator.toLowerCase()) {
        Swal.fire({
          icon: 'warning',
          title: '권한 오류',
          text: '⚠️ 프로젝트 생성자만 후원을 마감할 수 있습니다.',
        });
        return;
      }

      // ⚠️ 마감일 확인
      const now = Math.floor(Date.now() / 1000);
      const deadlineTimestamp = Math.floor(project.deadline.getTime() / 1000);
      if (now <= deadlineTimestamp) {
        Swal.fire({
          icon: 'info',
          title: '아직 마감일이 되지 않았습니다',
          text: '마감일 이후에만 후원을 마감할 수 있습니다.',
        });
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCoreABI.abi, signer);

      // ✅ 목표 달성 여부와 관계없이 closeFundraising 호출
      const tx = await contract.endFundingPhase(project.id);
      await tx.wait();

      Swal.fire({
        icon: 'success',
        title: '후원 마감 완료!',
        text: '목표 달성 여부에 따라 상태가 변경되었습니다.\n\n투표 개시를 통해 단계별로 자금이 분배됩니다.',
      });

      window.location.reload();
    } catch (err) {
      console.error('❌ 후원 마감 중 오류:', err);
      Swal.fire({
        icon: 'error',
        title: '후원 마감 실패',
        text: '컨트랙트 실행 중 오류가 발생했습니다.',
      });
    }
  };

  
  const handleExpertReviewClick = async () => {
    if (!project.expertReviewRequested) {
      alert('❌ 전문가 사전 심사를 선택하지 않은 프로젝트입니다.');
      return;
    }
  
    const now = new Date();
    const isBeforeDeadline = now.getTime() < project.deadline.getTime() - 60000;
  
    if (!isBeforeDeadline) {
      alert('⚠️ 전문가 평가는 마감 1분 전까지만 가능합니다.');
      return;
    }
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
  
      const reviewContract = new ethers.Contract(REVIEW_CONTRACT_ADDRESS, ExpertReviewABI.abi, provider);
      const alreadyReviewed = await reviewContract.hasReviewerVoted(Number(project.id), userAddress);
  
      if (alreadyReviewed) {
        alert('✅ 이미 평가한 전문가입니다. 중복 평가는 불가능합니다.');
        return;
      }
  
      navigate(`/project/${project.id}/expert-review`);
    } catch (err) {
      console.error('전문가 평가 여부 확인 오류:', err);
      alert('❌ 전문가 평가 확인 중 오류가 발생했습니다.');
    }
  };

  // 전문가 평가 긍정 부정 비율
  const getReviewRatio = () => {
    const total = reviewStats.positive + reviewStats.negative;
    if (total === 0) return { positive: 0, negative: 0 };
    return {
      positive: Math.round((reviewStats.positive / total) * 100),
      negative: Math.round((reviewStats.negative / total) * 100),
    };
  };
  
const handleCheckMyNFTs = async () => {
  if (!window.ethereum) {
    alert("Metamask가 필요합니다.");
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

    // ✅ 해당 유저의 NFT tokenId 확인
    const tokenId = await nft.donorTokenId(project.id, user);

    if (tokenId.toString() === "0") {
      setMyNFTs([{ tokenId: null, power: "0" }]);
      return;
    }

    // ✅ Voting Power 조회
    const rawPower = await nft.getVotingPower(project.id, user);
    const formattedPower = rawPower.toString()/1000000000; // 정수 그대로 표시

    // 상태에 반영
    setMyNFTs([{ tokenId: tokenId.toString(), power: formattedPower }]);
  } catch (err) {
    console.error("NFT 조회 오류:", err);
    alert("NFT 조회 실패");
  }
};


   return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      {/* --- 프로젝트 제목 및 전문가 평가 버튼 --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{project.title}</h2>
        <button
          onClick={handleExpertReviewClick}
          style={{
            padding: '0.5rem 1rem', backgroundColor: '#1e40af', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '500', fontSize: '0.95rem'
          }}
        >
          전문가 평가
        </button>
      </div>

      {/* --- 메인 레이아웃 (좌/우 2단) --- */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        
        {/* === 왼쪽 컬럼: 이미지 및 정보 === */}
        <div style={{ flex: 1 }}>
          {project.image ? (
            <img src={project.image} alt="대표 이미지" style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }} />
          ) : (
            <div style={{ minHeight: '300px', backgroundColor: '#eee', borderRadius: '8px' }} />
          )}
          <p><strong>등록자:</strong> {project.creator}</p>
          <p><strong>전문가 심사 요청:</strong> {project.expertReviewRequested ? '예' : '아니오'}</p>
          {project.expertReviewRequested && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>전문가 평가 결과</h3>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem', color: '#444' }}>
                긍정: {getReviewRatio().positive}% / 부정: {getReviewRatio().negative}%
              </div>
              <div style={{ height: '14px', background: '#eee', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${getReviewRatio().positive}%`, backgroundColor: '#10b981' }} />
                <div style={{ width: `${getReviewRatio().negative}%`, backgroundColor: '#ef4444' }} />
              </div>
            </div>
          )}
        </div>

        {/* === 오른쪽 컬럼: 펀딩 상태 및 후원하기 === */}
        <div style={{ flex: 1 }}>
          <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', margin: '1rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>모인금액</p>
            <p style={{ fontSize: '2rem', fontWeight: '600' }}>{parseFloat(fundedAmount).toLocaleString()} ETH</p>
            <p> {getStatusLabel(project.status)}</p>
          </div>

          <div style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>달성률</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', marginRight: '0.5rem', color: '#222' }}>{percent}%</span>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>목표금액 {parseFloat(project.goalAmount).toLocaleString()} ETH</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>남은기간</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', marginRight: '0.5rem', color: '#222' }}>{calculateDaysLeft(project.deadline)}</span>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(project.deadline)}에 종료</span>
            </div>
            {project.startDate && (
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>프로젝트 시작</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', marginRight: '0.5rem', color: '#222' }}>{formatDate(project.startDate)}</span>
              </div>
            )}
            {project.endDate && (
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>프로젝트 마감</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', marginRight: '0.5rem', color: '#222' }}>{formatDate(project.endDate)}</span>
              </div>
            )}
          </div>

          {/* --- ✅✅✅ 여기에 합쳐진 후원 기능 전체를 넣습니다 ✅✅✅ --- */}
          <div style={{ marginTop: '2rem' }}>
            {/* --- 1. 리워드 선택 후원하기 UI --- */}
            <h3 style={{ marginBottom: '1rem', fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif', fontWeight: '700' }}>
              리워드 선택하여 후원하기
            </h3>
            {canFund ? (
              rewards.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rewards.map((r, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleFundWithReward(idx, r.price)}
                      style={{
                        border: '1px solid #ddd', borderRadius: '0', padding: '1.5rem',
                        cursor: 'pointer', transition: 'background-color 0.2s, transform 0.15s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{r.name}</h4>
                        <p style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>{ethers.utils.formatEther(r.price)} ETH</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>등록된 리워드가 없습니다.</p>
              )
            ) : (
              <p style={{ color: 'red' }}>
                후원이 불가능합니다. {isDeadlineOver ? '마감일이 지났습니다.' : `상태: ${getStatusLabel(project.status)}`}
              </p>
            )}

            {/* --- 2. 금액 직접 입력하여 후원하기 UI --- */}
            <div style={{ marginTop: '2.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif', fontWeight: '700' }}>
                자유롭게 후원하기
              </h3>
              <div style={{ border: '1px solid #ddd', padding: '1.5rem' }}>
                <input
                  type="number"
                  placeholder="후원 금액 (ETH)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ padding: '0.75rem', width: 'calc(100% - 1.5rem)', marginBottom: '1rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '0' }}
                  disabled={!canFund}
                />
                <button
                  onClick={handleFund}
                  disabled={!canFund || !amount}
                  style={{
                    width: '100%', padding: '1rem', fontSize: '1rem',
                    backgroundColor: (canFund && amount) ? '#1e40af' : '#ccc',
                    color: '#fff', border: 'none', borderRadius: '0',
                    cursor: (canFund && amount) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {canFund ? '금액 직접 후원' : '후원 불가'}
                </button>
              </div>
            </div>
          </div>
          {/* --- ✅✅✅ 합쳐진 후원 기능 끝 ✅✅✅ --- */}

          {/* --- 후원 마감 버튼 --- */}
          {window.ethereum && (
            <button
              onClick={handleEndFunding}
              style={{
                marginTop: '1.5rem', width: '100%', padding: '1rem', fontSize: '1rem',
                backgroundColor: '#f44336', color: '#fff', border: 'none',
                borderRadius: '0', cursor: 'pointer',
                fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
              }}
            >
              후원 마감
            </button>
          )}

           {/* --- 🚀🚀🚀 커뮤니티 생성 버튼 🚀🚀🚀 --- */}
          {/* 조건: 프로젝트 상태가 '모금 성공'(1)이고, 현재 사용자가 '창작자'일 때만 보임 */}
          {project.status === 1 && userAddress.toLowerCase() === project.creator.toLowerCase() && (
            <button
              onClick={() => navigate(`/project/${project.id}/community-setup`)}
              style={{
                marginTop: '1.5rem', width: '100%', padding: '1rem', fontSize: '1rem',
                backgroundColor: '#007bff', // 커뮤니티 생성 관련 색상 (예: 파란색)
                color: '#fff', border: 'none',
                borderRadius: '0', cursor: 'pointer', fontWeight: '700'
              }}
            >
              🚀 커뮤니티 생성/관리 페이지로 이동
            </button>
          )}

          {/* --- NFT 투표권 확인 버튼 --- */}
          <div style={{ marginTop: "2rem" }}>
            <button
              onClick={handleCheckMyNFTs}
              style={{
                padding: "0.75rem 1.5rem", backgroundColor: "#4caf50", color: "#fff",
                border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600",
              }}
            >
              내 Voting Power 확인하기
            </button>
            {myNFTs.length > 0 && myNFTs[0].tokenId && (
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontSize: "1.1rem", fontWeight: "700", color: "#222" }}>
                  NFT Token ID: {myNFTs[0].tokenId}
                </p>
                <p style={{ fontSize: "1.1rem", fontWeight: "700", color: "#222" }}>
                  Voting Power: {myNFTs[0].power}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ✅ 내 리워드 조회 버튼 및 결과 --- */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={handleCheckMyRewards}
          style={{
            padding: "0.75rem 1.5rem", backgroundColor: "#1e88e5", color: "#fff",
            border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600",
          }}
        >
          내가 선택한 리워드 보기
        </button>

        {myRewards.length > 0 && (
          <div style={{ marginTop: "1rem", backgroundColor: "#f1f5f9", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>내 리워드 내역</h4>
            <ul style={{ paddingLeft: "1rem" }}>
              {myRewards.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* --- ✅ 창작자용 전체 후원자 리워드 조회 버튼 및 결과 --- */}
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={handleCheckAllDonorRewards}
          style={{
            padding: "0.75rem 1.5rem", backgroundColor: "#6d28d9", color: "#fff",
            border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600",
          }}
        >
          전체 후원자 리워드 보기 (창작자용)
        </button>

        {allDonorRewards.length > 0 && (
          <div style={{ marginTop: "1rem", backgroundColor: "#fdf2f8", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>전체 후원자 리워드 내역</h4>
            <ul style={{ paddingLeft: "1rem" }}>
              {allDonorRewards.map((d, i) => (
                <li key={i}>
                  <strong>{d.donor.slice ? `${d.donor.slice(0, 6)}...${d.donor.slice(-4)}` : d.donor}:</strong>{" "}
                  {d.rewards.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <VotingPanel
        projectId={project.id}
        projectCreator={project.creator}
      />

      {/* --- 하단 프로젝트 상세 설명 --- */}
      <div style={{ marginTop: '3rem', backgroundColor: '#f4f6fb', padding: '2rem', borderRadius: '12px' }}>
        <div style={{ borderLeft: '5px solid #1e40af', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>프로젝트 소개</h3>
        </div>
        {project.detailImages && project.detailImages.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {project.detailImages.map((url, idx) => (
              <img key={idx} src={url} alt={`상세-${idx}`} style={{ maxWidth: '300px', borderRadius: '6px' }} />
            ))}
          </div>
        )}
        <div
          style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333', marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
      </div>

      {/* --- 하단 전문가 한줄평 --- */}
      {project.expertReviewRequested && comments.length > 0 && (
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}> 전문가 한줄평</h3>
          <ul style={{ paddingLeft: '1rem' }}>
            {comments.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: '#333' }}>
                <strong style={{ color: '#666' }}>
                  {item.reviewer.slice(0, 6)}...{item.reviewer.slice(-4)}:
                </strong>{' '}
                {item.comment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;