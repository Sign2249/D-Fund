// ExpertReviewPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Swal from "sweetalert2";

import ExpertReviewABI from '../truffle_abis/ExpertReview.json';

import { CONTRACT_ADDRESS } from '../web3/ExpertReviewContract';

function ExpertReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ 평가 강도 선택 (0~3)
  const [strength, setStrength] = useState(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (strength === null) {
      Swal.fire("선택 확인", "평가 강도를 선택해주세요.", "warning");
      return;
    }
    if (!comment.trim()) {
      Swal.fire("입력 확인", "한줄평을 입력해주세요.", "warning");
      return;
    }

    Swal.fire({
      title: "평가 제출",
      text: "작성하신 평가를 제출하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "제출",
      cancelButtonText: "취소",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) {
        Swal.fire("취소", "평가 제출이 취소되었습니다.", "info");
        return;
      }
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ExpertReviewABI.abi, signer);

        // ✅ strength(0~3) enum 전달
        const tx = await contract.submitReview(id, strength, comment);
        await tx.wait();

        Swal.fire("성공", "평가가 성공적으로 등록되었습니다.", "success");
        setTimeout(() => navigate(`/project/${id}`), 1500);
      } catch (error) {
        console.error(error);
        Swal.fire("실패", "평가 제출 중 오류가 발생했습니다.", "error");
      }
    })
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>전문가 평가</h2>
      <p>프로젝트에 대해 강도별 평가를 선택하고, 한줄평을 남겨주세요.</p>

      {/* ✅ 4단계 평가 버튼 */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setStrength(0)}
          style={{
            flex: '1',
            padding: '0.75rem',
            backgroundColor: strength === 0 ? '#15803d' : '#e5e7eb',
            color: strength === 0 ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          💪 강한 긍정
        </button>

        <button
          onClick={() => setStrength(1)}
          style={{
            flex: '1',
            padding: '0.75rem',
            backgroundColor: strength === 1 ? '#22c55e' : '#e5e7eb',
            color: strength === 1 ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🙂 약한 긍정
        </button>

        <button
          onClick={() => setStrength(2)}
          style={{
            flex: '1',
            padding: '0.75rem',
            backgroundColor: strength === 2 ? '#f97316' : '#e5e7eb',
            color: strength === 2 ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🙁 약한 부정
        </button>

        <button
          onClick={() => setStrength(3)}
          style={{
            flex: '1',
            padding: '0.75rem',
            backgroundColor: strength === 3 ? '#b91c1c' : '#e5e7eb',
            color: strength === 3 ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          💀 강한 부정
        </button>
      </div>

      <textarea
        placeholder="한줄평을 입력하세요"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '1rem',
          resize: 'none'
        }}
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
          fontWeight: '600',
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