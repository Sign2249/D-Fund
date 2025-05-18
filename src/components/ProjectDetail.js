// ProjectDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xC9692c583FaCC936aDE91CD0789Ff9c8d599DdF9';

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

        if (!data || data.title === '') {
          setStatus('프로젝트를 찾을 수 없습니다.');
          return;
        }

        const balance = await contract.projectBalance(id);

        setProject({
          id: data.id.toString(),
          creator: data.creator,
          title: data.title,
          description: data.description,
          goalAmount: ethers.utils.formatEther(data.goalAmount),
          deadline: new Date(data.deadline.toNumber() * 1000),
          expertReviewRequested: data.expertReviewRequested,
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

      const updated = await contract.projectBalance(project.id);
      setFundedAmount(ethers.utils.formatEther(updated));
    } catch (err) {
      console.error(err);
      alert('후원 실패');
    }
  };

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일` : '마감';
  };

  const formatDate = (date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  if (status) return <p>{status}</p>;
  if (!project) return null;

  const percent = Math.floor((parseFloat(fundedAmount) / parseFloat(project.goalAmount)) * 100);

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>{project.title}</h2>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1, minHeight: '300px', backgroundColor: '#eee', borderRadius: '8px' }}>
          {/* 대표 이미지 공간 */}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>모인금액</p>
            <p style={{ fontSize: '2rem', fontWeight: '600' }}>{parseFloat(fundedAmount).toLocaleString()} ETH</p>
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
              style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', fontSize: '1rem' }}
            />
            <button
              onClick={handleFund}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: '#1e40af',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              후원하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;