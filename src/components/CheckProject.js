import React, { useState } from 'react';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xAf74F665aB915FcE4DfE87822F21717a5EFa16Cd';

function CheckProject() {
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('');

  const handleCheck = async () => {
    if (!window.ethereum) {
      alert('Metamask not detected');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
      const data = await contract.projects(projectId); // public mapping getter
      const balance = await contract.projectBalance(projectId);
  
      if (data.id.toNumber() == 0 || data.title == "") {
        setStatus('❌ 해당 ID의 프로젝트가 존재하지 않습니다.');
        setProject(null);
        return;
      }
      
      setProject({
        id: data.id.toString(),
        creator: data.creator,
        title: data.title,
        description: data.description,
        goalAmount: ethers.utils.formatEther(data.goalAmount),
        deadline: new Date(data.deadline.toNumber() * 1000).toLocaleString(),
        expertReviewRequested: data.expertReviewRequested,
        fundedAmount: ethers.utils.formatEther(balance),
      });
      setStatus('✅ Project found');
    } catch (error) {
      console.error(error);
      setStatus('❌ Project not found or error occurred');
      setProject(null);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>🔍 프로젝트 조회</h2>
      <input
        type="number"
        placeholder="프로젝트 ID 입력"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <button onClick={handleCheck}>조회</button>
      <p>{status}</p>

      {project && (
        <div style={{ marginTop: '1rem' }}>
          <p><strong>📌 제목:</strong> {project.title}</p>
          <p><strong>📝 설명:</strong> {project.description}</p>
          <p><strong>🎯 목표 금액:</strong> {project.goalAmount} ETH</p>
          <p><strong>💰 현재 모금액:</strong> {project.fundedAmount} ETH</p>
          <p><strong>📅 마감일:</strong> {project.deadline}</p>
          <p><strong>🧠 전문가 심사 요청:</strong> {project.expertReviewRequested ? '예' : '아니오'}</p>
          <p><strong>👤 등록자 주소:</strong> {project.creator}</p>
        </div>
      )}
    </div>
  );
}

export default CheckProject;
