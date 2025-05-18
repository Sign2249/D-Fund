// AllProjects.js
<<<<<<< HEAD
=======
// git pract
// git prac2
>>>>>>> refs/remotes/origin/develop
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xC9692c583FaCC936aDE91CD0789Ff9c8d599DdF9';

function AllProjects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('로딩 중...');

  useEffect(() => {
    const loadProjects = async () => {
      if (!window.ethereum) {
        setStatus('Metamask가 설치되어 있지 않습니다.');
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
              deadline: new Date(p.deadline.toNumber() * 1000),
              expertReviewRequested: p.expertReviewRequested,
              fundedAmount: ethers.utils.formatEther(balance),
            });
          }
        }

        setProjects(loadedProjects);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('프로젝트 목록을 불러오는 데 실패했습니다.');
      }
    };

    loadProjects();
  }, []);

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일 남음` : '마감';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>전체 등록된 프로젝트</h2>
      {status && <p>{status}</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        {projects.map((project) => {
          const percent = Math.floor((parseFloat(project.fundedAmount) / parseFloat(project.goalAmount)) * 100);

          return (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #ddd',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ backgroundColor: '#f9f9f9', height: '180px' }}>
                {/* 썸네일 자리 (이미지 필드 없으므로 배경색 박스로 대체) */}
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{project.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', minHeight: '48px' }}>{project.description}</p>

                <div style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <span style={{ color: 'crimson' }}>{percent}%</span>
                  &nbsp; {project.fundedAmount} ETH 모금
                </div>
                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                  {calculateDaysLeft(project.deadline)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


export default AllProjects;