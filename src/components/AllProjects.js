// AllProjects.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xC9692c583FaCC936aDE91CD0789Ff9c8d599DdF9';

function AllProjects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('📡 로딩 중...');

  useEffect(() => {
    const loadProjects = async () => {
      if (!window.ethereum) {
        setStatus('❌ Metamask가 설치되어 있지 않습니다.');
        return;
      }
  
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
  
        const count = await contract.projectCount();
        const loadedProjects = [];
  
        for (let i = 1; i <= count; i++) {
          const p = await contract.projects(i);
          if (p.id.toNumber() !== 0 && p.title !== '' && p.isActive) {
            const balance = await contract.projectBalance(p.id);
            loadedProjects.push({
              id: p.id.toString(),
              creator: p.creator,
              title: p.title,
              description: p.description,
              goalAmount: ethers.utils.formatEther(p.goalAmount),
              deadline: new Date(p.deadline.toNumber() * 1000).toLocaleString(),
              expertReviewRequested: p.expertReviewRequested,
              fundedAmount: ethers.utils.formatEther(balance),
            });
          }
        }
  
        setProjects(loadedProjects);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('❌ 프로젝트 목록을 불러오는 데 실패했습니다.');
      }
    };
  
    loadProjects();
  }, []);
  

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>📋 전체 등록된 프로젝트</h2>
      {status && <p>{status}</p>}

      {projects.length > 0 ? (
        projects.map((project) => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                marginBottom: '1rem',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'box-shadow 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <p><strong>🆔 ID:</strong> {project.id}</p>
              <p><strong>📌 제목:</strong> {project.title}</p>
              <p><strong>📝 설명:</strong> {project.description}</p>
              <p><strong>🎯 목표 금액:</strong> {project.goalAmount} ETH</p>
              <p><strong>💰 현재 모금액:</strong> {project.fundedAmount} ETH</p>
              <p><strong>📅 마감일:</strong> {project.deadline}</p>
              <p><strong>🧠 전문가 심사 요청:</strong> {project.expertReviewRequested ? '예' : '아니오'}</p>
              <p><strong>👤 등록자 주소:</strong> {project.creator}</p>
            </div>
          </Link>
        ))
      ) : !status ? (
        <p>등록된 프로젝트가 없습니다.</p>
      ) : null}
    </div>
  );
}

export default AllProjects;