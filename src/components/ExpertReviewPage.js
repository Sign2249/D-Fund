// ExpertReviewPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ExpertReviewABI from '../truffle_abis/ExpertReview.json';
import { CONTRACT_ADDRESS } from '../web3/ExpertReviewContract';

function ExpertReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPositive, setIsPositive] = useState(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (isPositive === null) {
      alert('긍정 또는 부정을 선택해주세요.');
      return;
    }

    if (!comment.trim()) {
      alert('한줄평을 입력해주세요.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ExpertReviewABI.abi, signer);

      const tx = await contract.submitReview(id, isPositive, comment);
      await tx.wait();

      console.log('한줄평:', comment);

      alert('평가가 완료되었습니다.');
      setTimeout(() => navigate(`/project/${id}`), 1500);
    } catch (error) {
      console.error(error);
      alert('평가 제출 중 오류 발생');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>전문가 평가</h2>
      <p>해당 프로젝트에 대해 긍정 또는 부정 평가를 선택하고, 한줄평을 남겨주세요.</p>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setIsPositive(true)}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            backgroundColor: isPositive === true ? '#10b981' : '#e5e7eb',
            color: isPositive === true ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          👍 긍정
        </button>

        <button
          onClick={() => setIsPositive(false)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isPositive === false ? '#ef4444' : '#e5e7eb',
            color: isPositive === false ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          👎 부정
        </button>
      </div>

      <textarea
        placeholder="한줄평을 입력하세요"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
      />

      <button
        onClick={handleSubmit}
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#1e40af',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          width: '100%',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        제출하기
      </button>

      {status && <p style={{ marginTop: '1rem', color: '#333' }}>{status}</p>}
    </div>
  );
}

export default ExpertReviewPage;
