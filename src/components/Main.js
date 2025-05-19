// Main.js (Top Projects 카드 UI 개선 + 대표 이미지 추가)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';

function Main() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTopProjects = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
        const count = await contract.projectCount();

        const loaded = [];
        for (let i = 1; i <= count; i++) {
          const p = await contract.projects(i);
          if (p.id.toNumber() !== 0 && p.title !== '') {
            const detail = await contract.getProject(p.id);
            const balance = await contract.getTotalDonated(p.id);
            const goal = parseFloat(ethers.utils.formatEther(p.goalAmount));
            const raised = parseFloat(ethers.utils.formatEther(balance));
            const percent = goal > 0 ? Math.floor((raised / goal) * 100) : 0;
            loaded.push({
              id: p.id.toString(),
              title: p.title,
              description: p.description,
              goalAmount: goal,
              fundedAmount: raised,
              deadline: p.deadline.toNumber(),
              percent,
              image: detail.image, // ✅ 대표 이미지
            });
          }
        }

        const top3 = loaded.sort((a, b) => b.percent - a.percent).slice(0, 3);
        setProjects(top3);
      } catch (err) {
        console.error(err);
      }
    };

    loadTopProjects();
  }, []);

  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline * 1000 - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일 남음` : '마감';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Empower Ideas, Fund the Future</h1>
        <p style={{ fontSize: '1.1rem', color: '#555' }}>
          D-Fund is a decentralized crowdfunding platform built on Ethereum.<br />
          Register your project, get support, and make an impact!
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '9999px',
            backgroundColor: '#6366f1',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Get Started
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Top Projects</h2>
        <span onClick={() => navigate('/projects')} style={{ fontSize: '0.95rem', color: '#4f46e5', cursor: 'pointer' }}>모든 프로젝트 보기 →</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/project/${p.id}`)}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
          >
            <div style={{ height: '160px', position: 'relative' }}>
              {p.image && (
                <img src={p.image} alt="썸네일" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: '0.5rem 1rem',
                color: '#fff',
                background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))',
                fontWeight: '600'
              }}>
                {p.percent}% Funded
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{p.title}</h3>
              
              <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ width: `${p.percent}%`, backgroundColor: '#6366f1', height: '100%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                <span>{p.fundedAmount} ETH raised</span>
                <span>{p.goalAmount} ETH goal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
                <span>{calculateDaysLeft(p.deadline)}</span>
                <span style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Main;