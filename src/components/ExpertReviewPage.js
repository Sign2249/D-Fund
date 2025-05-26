import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';

function ExpertReviewPage() {
  const { id } = useParams();
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const submitReview = async (isPositive) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, signer);

      const tx = await contract.submitExpertReview(id, isPositive);
      await tx.wait();
      alert('✅ 전문가 평가 완료!');
      navigate(`/project/${id}`);
    } catch (err) {
      console.error(err);
      alert('❌ 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
      <h2>🧠 프로젝트 전문가 평가</h2>
      <p>이 프로젝트에 대해 어떤 평가를 남기시겠습니까?</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => submitReview(true)}
          style={{ padding: '1rem 2rem', fontSize: '1rem', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          👍 긍정 평가
        </button>
        <button
          onClick={() => submitReview(false)}
          style={{ padding: '1rem 2rem', fontSize: '1rem', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          👎 부정 평가
        </button>
      </div>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
    </div>
  );
}

export default ExpertReviewPage;
