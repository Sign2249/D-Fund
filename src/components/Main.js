// Main.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import DFundABI from '../truffle_abis/DFund.json';

const CONTRACT_ADDRESS = '0xC9692c583FaCC936aDE91CD0789Ff9c8d599DdF9';

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
          if (p.id.toNumber() !== 0 && p.title !== '' && p.isActive) {
            const balance = await contract.projectBalance(p.id);
            const goal = parseFloat(ethers.utils.formatEther(p.goalAmount));
            const raised = parseFloat(ethers.utils.formatEther(balance));
            const percent = goal > 0 ? Math.floor((raised / goal) * 100) : 0;
            loaded.push({
              id: p.id.toString(),
              title: p.title,
              description: p.description,
              goalAmount: goal,
              deadline: new Date(p.deadline.toNumber() * 1000).toISOString().split('T')[0],
              percent,
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

      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Top Projects</h2>
      <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            cursor: 'pointer'
        }}
        >
        {projects.map((p) => (
            <div
            key={p.id}
            onClick={() => navigate(`/project/${p.id}`)}
            style={{
                height: '220px',
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '1rem',
                backgroundColor: '#fff',
                boxShadow: '0 1px 5px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
            >
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#4f46e5' }}>{p.title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#444', minHeight: '48px' }}>{p.description}</p>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <p>Goal: {p.goalAmount} ETH</p>
                <p>Deadline: {p.deadline}</p>
                <p style={{ fontWeight: '600' }}>달성률: {p.percent}%</p>
            </div>
            </div>
        ))}
        </div>

    </div>
  );
}

export default Main;