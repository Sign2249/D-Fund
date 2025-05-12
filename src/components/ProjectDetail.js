// ProjectDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xC9692c583FaCC936aDE91CD0789Ff9c8d599DdF9'; // 🛠️ 반드시 실제 배포 주소로 교체할 것

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('⏳ 로딩 중...');
  const [amount, setAmount] = useState('');
  const [fundedAmount, setFundedAmount] = useState('0');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
        const data = await contract.projects(id);

        if (!data || data.title === '') {
          setStatus('❌ 프로젝트를 찾을 수 없습니다.');
          return;
        }

        const balance = await contract.projectBalance(id);

        setProject({
          id: data.id.toString(),
          creator: data.creator,
          title: data.title,
          description: data.description,
          goalAmount: ethers.utils.formatEther(data.goalAmount),
          deadline: new Date(data.deadline.toNumber() * 1000).toLocaleString(),
          expertReviewRequested: data.expertReviewRequested,
        });

        setFundedAmount(ethers.utils.formatEther(balance));
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('❌ 오류 발생');
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

      // 후원 후 금액 갱신
      const updated = await contract.projectBalance(project.id);
      setFundedAmount(ethers.utils.formatEther(updated));
    } catch (err) {
      console.error(err);
      alert('후원 실패');
    }
  };

  if (status) return <p>{status}</p>;
  if (!project) return null;

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>📌 {project.title}</h2>
      <p><strong>🆔 ID:</strong> {project.id}</p>
      <p><strong>📝 설명:</strong> {project.description}</p>
      <p><strong>🎯 목표 금액:</strong> {project.goalAmount} ETH</p>
      <p><strong>📅 마감일:</strong> {project.deadline}</p>
      <p><strong>💰 현재 모금된 금액:</strong> {fundedAmount} ETH</p>
      <p><strong>🧠 전문가 심사 요청:</strong> {project.expertReviewRequested ? '예' : '아니오'}</p>
      <p><strong>👤 등록자 주소:</strong> {project.creator}</p>

      <div style={{ marginTop: '2rem' }}>
        <h3>💸 후원하기</h3>
        <input
          type="number"
          placeholder="후원 금액 (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '1rem' }}
        />
        <button onClick={handleFund} style={{ padding: '0.5rem 1rem' }}>
          💰 후원하기
        </button>
      </div>
    </div>
  );
}

export default ProjectDetail;
