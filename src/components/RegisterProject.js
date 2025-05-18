// RegisterProject.js
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.ethereum) {
      alert('Metamask가 필요합니다.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);

      const goalInWei = ethers.utils.parseEther(goalAmount);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      const tx = await contract.registerProject(
        title,
        description,
        '', // image placeholder
        [], // detailImages placeholder
        goalInWei,
        deadlineTimestamp,
        expertReviewRequested
      );

      setStatus('등록 중...');
      await tx.wait();
      setStatus('✅ 프로젝트 등록이 완료되었습니다.');
    } catch (error) {
      console.error(error);
      setStatus('❌ 등록 실패. 다시 시도해주세요.');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '2rem' }}>프로젝트 등록</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={labelStyle}>프로젝트 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 기깔난 프로젝트"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>프로젝트 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="후원자에게 소개하고 싶은 내용을 입력하세요."
            style={{ ...inputStyle, resize: 'vertical' }}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>목표 금액 (ETH)</label>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="예: 5"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>마감일</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={expertReviewRequested}
            onChange={() => setExpertReviewRequested(!expertReviewRequested)}
          />
          <label style={{ fontSize: '0.95rem' }}>전문가 심사 요청</label>
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: '#1e40af',
            color: '#fff',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          등록하기
        </button>

        {status && <p style={{ marginTop: '1rem', color: '#333' }}>{status}</p>}
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '1rem',
  fontWeight: '600',
  marginBottom: '0.5rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem',
};

export default RegisterProject;