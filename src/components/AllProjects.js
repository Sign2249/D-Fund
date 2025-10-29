// AllProjects.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

import DFundCore from '../truffle_abis/DFundCore.json';

const networkId = window.ethereum?.networkVersion || '5777';
const CONTRACT_ADDRESS = DFundCore.networks[networkId]?.address;

if (!CONTRACT_ADDRESS) {
  console.warn(`⚠️ DFundCore가 네트워크 ${networkId}에 배포되어 있지 않습니다. 
  truffle migrate --reset 후 build/contracts/DFundCore.json을 다시 복사하세요.`);
}

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
        // MetaMask provider 연결
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundCore.abi, provider);

        console.log("🌐 Network:", await provider.getNetwork());
console.log("📍 Contract Address:", CONTRACT_ADDRESS);
console.log("📄 ABI contains getAllProjects:", DFundCore.abi.some(f => f.name === "getAllProjects"));

        // ✅ getAllProjects() 호출 (배열로 한 번에 불러오기)
        const allProjects = await contract.getAllProjects();

        // JS용으로 변환
        const loadedProjects = allProjects
          .filter(p => p.id.toNumber() !== 0 && p.title !== '')
          .map(p => ({
            id: p.id.toString(),
            creator: p.creator,
            title: p.title,
            description: p.description,
            image: p.image,
            goalAmount: ethers.utils.formatEther(p.goalAmount),
            deadline: p.deadline.toNumber(),
            statusCode: p.status,
          }));

        // 각 프로젝트의 모금액 조회 (병렬 처리)
        const fundedAmounts = await Promise.all(
          loadedProjects.map(async p => {
            const balance = await contract.getTotalDonated(p.id);
            return ethers.utils.formatEther(balance);
          })
        );

        const merged = loadedProjects.map((p, i) => ({
          ...p,
          fundedAmount: fundedAmounts[i],
        }));

        setProjects(merged);
        setStatus('');
      } catch (err) {
        console.error('❌ 프로젝트 불러오기 실패:', err);
        setStatus('프로젝트 목록을 불러오는 데 실패했습니다.');
      }
    };

    loadProjects();
  }, []);

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline * 1000 - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일 남음` : '마감';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>전체 등록된 프로젝트</h2>
      {status && <p>{status}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '2rem',
        }}
      >
        {projects.map((project) => {
          const percent = Math.min(
            Math.floor((parseFloat(project.fundedAmount) / parseFloat(project.goalAmount)) * 100),
            100
          );

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
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ backgroundColor: '#f9f9f9', height: '180px', overflow: 'hidden' }}>
                {project.image && (
                  <img
                    src={project.image}
                    alt="thumbnail"
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{project.title}</h3>
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
