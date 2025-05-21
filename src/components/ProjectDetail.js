import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';
import { isFundableStatus, getStatusLabel } from '../utils/statusUtils';

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('로딩 중...');
  const [amount, setAmount] = useState('');
  const [fundedAmount, setFundedAmount] = useState('0');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
        const data = await contract.projects(id);
        const detail = await contract.getProject(id);

        if (!data || data.title === '') {
          setStatus('프로젝트를 찾을 수 없습니다.');
          return;
        }

        const balance = await contract.getTotalDonated(id);

        setProject({
          id: data.id.toString(),
          creator: data.creator,
          title: data.title,
          description: data.description,
          image: detail.image,
          detailImages: detail.detailImages,
          goalAmount: ethers.utils.formatEther(data.goalAmount),
          deadline: new Date(data.deadline.toNumber() * 1000),
          expertReviewRequested: data.expertReviewRequested,
          status: data.status
        });

        setFundedAmount(ethers.utils.formatEther(balance));
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('오류 발생');
      }
    };

    fetchProject();
  }, [id]);

  const handleFund = async () => {
    if (!window.ethereum) {
      alert('Metamask가 필요합니다.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);

      const tx = await contract.donateToProject(project.id, {
        value: ethers.utils.parseEther(amount),
      });

      await tx.wait();
      alert(`후원 성공! Tx Hash: ${tx.hash}`);
      setAmount('');

      const updated = await contract.getTotalDonated(project.id);
      setFundedAmount(ethers.utils.formatEther(updated));
    } catch (err) {
      console.error(err);
      alert('후원 실패');
    }
  };

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

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>{project.title}</h2>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          {project.image ? (
            <img src={project.image} alt="대표 이미지" style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }} />
          ) : (
            <div style={{ minHeight: '300px', backgroundColor: '#eee', borderRadius: '8px' }} />
          )}
          <p><strong>등록자:</strong> {project.creator}</p>
          <p><strong>전문가 심사 요청:</strong> {project.expertReviewRequested ? '예' : '아니오'}</p>
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

          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <h3 style={{ marginBottom: '1rem' }}>후원하기</h3>
            <input
              type="number"
              placeholder="후원 금액 (ETH)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: '0.5rem', width: '95%', marginBottom: '1rem', fontSize: '1rem' }}
            />
            <button
              onClick={handleFund}
              disabled={!canFund}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: canFund ? '#1e40af' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: canFund ? 'pointer' : 'not-allowed'
              }}
            >
              {canFund ? '후원하기' : '후원 불가'}
            </button>

            {window.ethereum && (
              <button
                onClick={handleEndFunding}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                ⏹️ 후원 마감
              </button>
            )}
          </div>

          {!canFund && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>
              ※ 후원이 불가능합니다. {isDeadlineOver ? '마감일이 지났습니다.' : `상태: ${getStatusLabel(project.status)}`}
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

        <div style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333', marginBottom: '2rem' }}>
          <p>{project.description}</p>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
