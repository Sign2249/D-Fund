import React, { useState } from 'react';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xC9692c583FaCC936aDE91CD0789Ff9c8d599DdF9';

function RegisterProject() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [expertReviewRequested, setExpertReviewRequested] = useState(false);
  const [status, setStatus] = useState('');
  const [registeredProject, setRegisteredProject] = useState(null); // 🔹 등록된 프로젝트 정보 저장

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.ethereum) {
      alert('Metamask not detected');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);
      const goalInWei = ethers.utils.parseEther(goalAmount);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      console.log('Registering project...');
      const tx = await contract.registerProject(
        title,
        description,
        goalInWei,
        deadlineTimestamp,
        expertReviewRequested
      );
      console.log('Tx sent, waiting...');
      setStatus('📨 Waiting for confirmation...');
      await tx.wait(); // 블록에 기록될 때까지 대기
      console.log('Tx confirmed.');

      // ✅ 등록된 프로젝트 ID = projectCount
      const projectCount = await contract.projectCount();
      console.log('projectCount:', projectCount.toString());
      const project = await contract.projects(projectCount);

      // ✅ 검증: 프로젝트가 실제로 등록되었는지 확인
      if (project && project.title.length > 0) {
        setRegisteredProject({
          id: project.id.toString(),
          title: project.title,
          creator: project.creator,
        });
        setStatus(`✅ 등록 성공! 프로젝트 ID: ${projectCount}`);
      } else {
        setStatus('⚠️ 등록 확인 실패. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error(error);
      setStatus('❌ Registration failed.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>📝 프로젝트 등록</h2>
      <form onSubmit={handleSubmit}>
        <label>제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />

        <label>설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />

        <label>목표 금액 (ETH)</label>
        <input
          type="number"
          value={goalAmount}
          onChange={(e) => setGoalAmount(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />

        <label>마감일</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />

        <label>
          <input
            type="checkbox"
            checked={expertReviewRequested}
            onChange={() => setExpertReviewRequested(!expertReviewRequested)}
          />
          전문가 심사 요청
        </label>

        <br />
        <button type="submit" style={{ marginTop: '1rem' }}>🚀 등록</button>
      </form>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}

      {registeredProject && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h4>📦 등록된 프로젝트 정보</h4>
          <p><strong>🆔 ID:</strong> {registeredProject.id}</p>
          <p><strong>📌 제목:</strong> {registeredProject.title}</p>
          <p><strong>👤 등록자:</strong> {registeredProject.creator}</p>
        </div>
      )}
    </div>
  );
}

export default RegisterProject;
