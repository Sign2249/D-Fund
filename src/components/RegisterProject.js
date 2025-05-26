// RegisterProject.js (통합 버전: 이미지 업로드 + 상태 확인)
import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import DFundABI from '../truffle_abis/DFund.json';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';
import { useNavigate } from 'react-router-dom';
import { ProjectStatus, isFundableStatus, getStatusLabel } from '../utils/statusUtils';  // 프로젝트 진행 상태를 문자로 표현
import ExpertReviewABI from '../truffle_abis/ExpertReview.json';
import { CONTRACT_ADDRESS as REVIEW_CONTRACT_ADDRESS } from '../web3/ExpertReviewContract';



const PINATA_API_KEY = 'f238b0f7401c3c3028bb';
const PINATA_SECRET_API_KEY = 'a0efd638ade333eec0f64aed2411edcbb72e98da5f6b950d5b1ad774879716d5';

function RegisterProject() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [expertReviewRequested, setExpertReviewRequested] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [detailImageUrls, setDetailImageUrls] = useState([]);
  const [status, setStatus] = useState('');
  const [registeredProject, setRegisteredProject] = useState(null);

  const navigate = useNavigate();

  const uploadToPinata = async (file) => {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await axios.post(url, data, {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      });
      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (err) {
      console.error('Pinata 업로드 실패:', err);
      return '';
    }
  };

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadToPinata(file);
    if (url) setMainImageUrl(url);
  };

  const handleDetailImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const file of files) {
      const url = await uploadToPinata(file);
      if (url) urls.push(url);
    }
    setDetailImageUrls(urls);
  };

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
        mainImageUrl || '',
        detailImageUrls || [],
        goalInWei,
        deadlineTimestamp,
        expertReviewRequested
      );

      setStatus('등록 중...');
      await tx.wait();

      const projectCount = await contract.projectCount();
      const project = await contract.projects(projectCount);

      if (expertReviewRequested) {
        const reviewContract = new ethers.Contract(
          REVIEW_CONTRACT_ADDRESS,
          ExpertReviewABI.abi,
          signer
        );
      
        const enableTx = await reviewContract.enableReview(projectCount, deadlineTimestamp);
        await enableTx.wait();
      }

      if (project && project.title.length > 0) {
        setRegisteredProject({
          id: project.id.toString(),
          title: project.title,
          creator: project.creator,
        });
        setStatus(`✅ 등록 성공! 프로젝트 ID: ${projectCount}`);
        navigate('/projects');
      } else {
        setStatus('⚠️ 등록 확인 실패. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error(error);
      alert('❌ 등록 실패. 다시 시도해주세요.');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1rem', marginTop: '1rem' }}>프로젝트 등록</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={labelStyle}>프로젝트 제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
        </div>

        <div>
          <label style={labelStyle}>프로젝트 설명</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} style={{ ...inputStyle, resize: 'vertical' }} required />
        </div>

        <div>
          <label style={labelStyle}>대표 이미지</label>
          <input type="file" accept="image/*" onChange={handleMainImageChange} />
          {mainImageUrl && <img src={mainImageUrl} alt="대표 미리보기" style={{ width: '100%', marginTop: '0.5rem', borderRadius: '6px' }} />}
        </div>

        <div>
          <label style={labelStyle}>상세 이미지</label>
          <input type="file" accept="image/*" multiple onChange={handleDetailImagesChange} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {detailImageUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`상세-${idx}`} width="120" style={{ borderRadius: '4px' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ width: '350px' }}>
            <label style={labelStyle}>목표 금액 (ETH)</label>
            <input type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ width: '350px', paddingLeft: '1rem' }}>
            <label style={labelStyle}>마감일</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} required />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={expertReviewRequested} onChange={() => setExpertReviewRequested(!expertReviewRequested)} />
          <label style={{ fontSize: '0.95rem' }}>전문가 심사 요청</label>
        </div>

        <button type="submit" style={{ width: '730px', marginTop: '0.5rem', backgroundColor: '#1e40af', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}>
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