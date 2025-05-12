import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom'; // 라우터 추가

function Main() {
  const [walletAddress, setWalletAddress] = useState('');
  const navigate = useNavigate(); // 페이지 이동 함수

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Metamask가 설치되어 있지 않습니다.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) {
      console.error('지갑 연결 실패:', err);
    }
  };

  // Metamask 계정 변경 감지
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress('');
        }
      });
    }
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Welcome to D-Fund</h2>
      <button onClick={connectWallet}>🔗 Connect Wallet</button>

      {walletAddress && (
        <>
          <p>
            ✅ 연결된 지갑: <br />
            <strong>{walletAddress}</strong>
          </p>
          {/* 프로젝트 등록 버튼 추가 */}
          <button onClick={() => navigate('/register')} style={{ marginTop: '1rem' }}>
            ➕ 프로젝트 등록
          </button>
        </>
      )}
    </div>
  );
}

export default Main;
