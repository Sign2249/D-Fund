// ProjectDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { ethers } from 'ethers';

import DFundABI from '../truffle_abis/DFund.json';
import ExpertReviewABI from '../truffle_abis/ExpertReview.json';
import { isFundableStatus, getStatusLabel } from '../utils/statusUtils';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';
import { CONTRACT_ADDRESS as REVIEW_CONTRACT_ADDRESS } from '../web3/ExpertReviewContract';

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('로딩 중...');
  const [amount, setAmount] = useState('');
  const [fundedAmount, setFundedAmount] = useState('0');
  const [reviewStats, setReviewStats] = useState({ positive: 0, negative: 0 });
  const [comments, setComments] = useState([]);
  const [rewards, setRewards] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
        const reviewContract = new ethers.Contract(REVIEW_CONTRACT_ADDRESS, ExpertReviewABI.abi, provider);
        const detail = await contract.getProject(id);
        const balance = await contract.getTotalDonated(id);

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
          deadline: new Date(detail.deadline.toNumber() * 1000),
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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);

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

  // 후원 마감 버튼 기능
  const handleEndFunding = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      if (userAddress.toLowerCase() !== project.creator.toLowerCase()) {
        alert('⚠️ 프로젝트 생성자만 후원을 마감할 수 있습니다.');
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const deadlineTimestamp = Math.floor(project.deadline.getTime() / 1000);
      if (now <= deadlineTimestamp) {
        alert('⚠️ 마감일 이후에만 후원을 마감할 수 있습니다.');
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);
      const totalDonated = await contract.getTotalDonated(project.id);
      const goalAmount = ethers.utils.parseEther(project.goalAmount);

      let tx;
      if (totalDonated.gte(goalAmount)) {
        tx = await contract.releaseFundsToCreator(project.id, 1);
        alert('🎉 목표 달성! 자금이 창작자에게 전달됩니다.');
      } else {
        tx = await contract.changeProjectStatusAndRefund(project.id, 3);
        alert('😢 목표 미달! 후원자에게 환불 처리됩니다.');
      }

      await tx.wait();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('❌ 후원 마감 중 오류 발생');
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
  

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{project.title}</h2>

        <button
          onClick={handleExpertReviewClick}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1e40af',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}
        >
          전문가 평가
        </button>
      </div>


      <div style={{ display: 'flex', gap: '2rem' }}>
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
              <div style={{
                height: '14px',
                background: '#eee',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex'
              }}>
                <div style={{
                  width: `${getReviewRatio().positive}%`,
                  backgroundColor: '#10b981'
                }} />
                <div style={{
                  width: `${getReviewRatio().negative}%`,
                  backgroundColor: '#ef4444'
                }} />
              </div>
            </div>
          )}

        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.8' }}>
            
            
          </div>

          <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', margin: '1rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>모인금액</p>
            <p style={{ fontSize: '2rem', fontWeight: '600' }}>{parseFloat(fundedAmount).toLocaleString()} ETH</p>
            <p> {getStatusLabel(project.status)}</p>
          </div>

          <div style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>달성률</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', marginRight: '0.5rem', color: '#222' }}>{percent}%</span>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>
                목표금액 {parseFloat(project.goalAmount).toLocaleString()} ETH
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>남은기간</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', marginRight: '0.5rem', color: '#222' }}>
                {calculateDaysLeft(project.deadline)}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>
                {formatDate(project.deadline)}에 종료
              </span>
            </div>
          </div>


          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif', fontWeight: '700' }}>
              리워드 선택 후원하기
            </h3>
            {canFund ? (
              rewards.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rewards.map((r, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleFundWithReward(idx, r.price)} // ✅ 카드 전체 클릭
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '0', // ✅ 네모 박스
                        padding: '1.5rem',
                        backgroundColor: '#fff',
                        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, transform 0.15s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                            {r.name}
                          </h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                            {ethers.utils.formatEther(r.price)} ETH
                          </p>
                          {/* 수량 제한을 나중에 추가할 경우 우측에 표시 */}
                        </div>
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

            {window.ethereum && (
              <button
                onClick={handleEndFunding}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0', // ✅ 네모 스타일
                  cursor: 'pointer',
                  fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
                }}
              >
                후원 마감
              </button>
            )}
          </div>


          {!canFund && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>
              후원이 불가능합니다. {isDeadlineOver ? '마감일이 지났습니다.' : `상태: ${getStatusLabel(project.status)}`}
            </p>
          )}
        </div>
      </div>

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
      {project.expertReviewRequested && comments.length > 0 && (
  <div style={{  backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px' }}>
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
