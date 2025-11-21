// src/components/CommunitySetup.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Swal from 'sweetalert2';

import DFundABI from '../truffle_abis/DFundCore.json';
import { CONTRACT_ADDRESS } from '../web3/DFundContract';
import { CONTRACT_ADDRESS as VOTING_NFT_ADDRESS } from "../web3/VotingPowerNFTContract";
import { 
    TEMPLATE_LINK, 
    DFUND_BOT_LINK, 
    GUILD_XYZ_LINK,
    GUILD_GUIDE_LINK
} from '../constants';

function CommunitySetup() {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- 상태 ---
    const [isLoading, setIsLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);
    const [project, setProject] = useState(null);
    const [step, setStep] = useState(() => localStorage.getItem(`dfund_setup_step_${id}`) || 'start');

    // --- 권한 확인 (이전과 동일) ---
    useEffect(() => {
        const checkPermissions = async () => {
            // ... (이전 코드와 100% 동일한 권한 확인 로직) ...
            try {
                if (!window.ethereum) throw new Error("Metamask가 필요합니다. 지갑을 연결해주세요.");
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, DFundABI.abi, provider);
                const detail = await contract.getProject(id);
                if (!detail || detail.title === '') throw new Error("프로젝트를 찾을 수 없습니다.");
                setProject(detail);
                const signer = provider.getSigner();
                const userAddress = await signer.getAddress();
                if (userAddress.toLowerCase() === detail.creator.toLowerCase() && detail.status === 1) {
                    setIsCreator(true);
                } else {
                    setIsCreator(false);
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('오류', err.message, 'error');
                setIsCreator(false);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };
        checkPermissions();
    }, [id, navigate]);

    // --- localStorage 저장 (이전과 동일) ---
    useEffect(() => {
        localStorage.setItem(`dfund_setup_step_${id}`, step);
    }, [step, id]);

    // --- 유틸리티 함수 (이전과 동일) ---
    const handleCompleteStep = (nextStep) => setStep(nextStep);
    const handleCopy = (text) => { /* ... (이전과 동일) ... */ 
        navigator.clipboard.writeText(text).then(() => Swal.fire('복사 완료!', '클립보드에 복사되었습니다.', 'success', { timer: 1500, showConfirmButton: false }));
    };
    const resetProgress = () => { /* ... (이전과 동일) ... */ 
        Swal.fire({ title: '진행 상황을 초기화하시겠습니까?', icon: 'warning', showCancelButton: true, confirmButtonText: '예', cancelButtonText: '아니오' })
            .then(result => { if (result.isConfirmed) { localStorage.removeItem(`dfund_setup_step_${id}`); setStep('start'); } });
    };

    // --- 스타일 (이전과 동일) ---
    const styles = { /* ... (이전과 동일한 styles 객체) ... */ 
        container: { maxWidth: '960px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
        header: { fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0' },
        headerP: { fontSize: '1rem', color: '#555', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' },
        stepCard: { border: '1px solid #ddd', padding: '1.5rem 2rem', marginBottom: '1.5rem', borderRadius: '8px', backgroundColor: '#fff', transition: 'all 0.3s ease' },
        stepCardDisabled: { backgroundColor: '#f9f9f9', opacity: 0.6 },
        stepCardCompleted: { backgroundColor: '#f0fff4', borderColor: '#c6f6d5' },
        stepHeader: { fontSize: '1.25rem', marginTop: 0, marginBottom: '0.75rem' },
        stepHeaderCompleted: { color: '#28a745' },
        stepP: { fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' },
        btn: { display: 'inline-block', backgroundColor: '#007bff', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '5px', textDecoration: 'none', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.95rem', marginRight: '1rem' },
        btnSuccess: { backgroundColor: '#28a745' },
        btnConfirm: { backgroundColor: '#17a2b8' }, // (추가됨) 확인 버튼 색상
        linkRedo: { fontSize: '0.9rem', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', marginLeft: '1rem' }, // (추가됨) 다시 시도 링크
        nftInfo: { backgroundColor: '#f4f6fb', padding: '1rem', marginTop: '1.5rem', borderRadius: '5px', border: '1px solid #e2e8f0' },
        copyBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0.5rem 1rem', border: '1px solid #ddd' },
        copyBtn: { padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
        resetBtn: { marginTop: '1rem', background: '#dc3545', color: 'white' }
    };

    // --- 렌더링 ---
    if (isLoading) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>창작자 권한을 확인 중입니다...</p>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>🚀 {project?.title} 커뮤니티 생성 가이드</h1>
            <p style={styles.headerP}>모금에 성공했습니다! 아래 3단계를 완료하여 후원자 커뮤니티를 활성화하세요.</p>
            
            {/* --- Step 1: 서버 생성 --- */}
            <div style={{ ...styles.stepCard, ...(step !== 'start' && styles.stepCardCompleted), ...(step === 'start' && styles.stepCardDisabled) }}>
                {/* (수정됨) 단계에 따라 UI 변경 */}
                {step === 'start' ? (
                    <>
                        <h3 style={styles.stepHeader}>Step 1: Discord 서버 생성</h3>
                        <p style={styles.stepP}>가장 먼저, 후원자들이 모일 Discord 서버를 생성합니다.</p>
                        <div style={styles.nftInfo}>
                            <p style={{...styles.stepP, margin: '0 0 0.5rem 0'}}>생성할 서버의 이름을 아래와 같이 사용하세요:</p>
                            <div style={styles.copyBox}>
                                <code>{project.title}</code>
                                <button style={styles.copyBtn} onClick={() => handleCopy(project.title)}>복사</button>
                            </div>
                        </div>
                        <a href={TEMPLATE_LINK} target="_blank" rel="noopener noreferrer" style={{ ...styles.btn, marginTop: '1.5rem' }}>
                            ➡️ 1. Discord 서버 생성하기 (새 창)
                        </a>
                        {/* (수정됨) 확인 버튼을 따로 분리 */}
                        <button onClick={() => handleCompleteStep('step1_done')} style={{ ...styles.btn, ...styles.btnConfirm, marginTop: '1.Example 5rem' }}>
                            ✅ 완료, 다음으로
                        </button>
                    </>
                ) : (
                    <h3 style={styles.stepHeaderCompleted}>
                        ✅ Step 1: Discord 서버 생성 완료
                        {/* (수정됨) 다시 시도할 수 있는 링크 제공 */}
                        <a href={TEMPLATE_LINK} target="_blank" rel="noopener noreferrer" style={styles.linkRedo}>(다시 생성하기)</a>
                    </h3>
                )}
            </div>

            {/* --- Step 2: 관리 봇 초대 --- */}
            <div style={{ ...styles.stepCard, ...(step === 'start' && styles.stepCardDisabled), ...(step === 'step2_done' || step === 'all_done') && styles.stepCardCompleted }}>
                {step === 'start' && <h3 style={styles.stepHeader}>Step 2: 관리 봇(DFundBot) 초대</h3>}
                {step === 'step1_done' ? (
                    <>
                        <h3 style={styles.stepHeader}>Step 2: 관리 봇(DFundBot) 초대</h3>
                        <p style={styles.stepP}>방금 만든 서버에 DFund 관리 봇을 초대합니다. 이 봇은 플랫폼 공지사항 전송 등 관리 기능을 수행합니다.</p>
                        <a href={DFUND_BOT_LINK} target="_blank" rel="noopener noreferrer" style={styles.btn}>
                            ➡️ 2. DFundBot 초대하기 (새 창)
                        </a>
                        <button onClick={() => handleCompleteStep('step2_done')} style={{ ...styles.btn, ...styles.btnConfirm }}>
                            ✅ 완료, 다음으로
                        </button>
                    </>
                ) : (
                    step !== 'start' && (
                        <h3 style={styles.stepHeaderCompleted}>
                            ✅ Step 2: 관리 봇(DFundBot) 초대 완료
                            <a href={DFUND_BOT_LINK} target="_blank" rel="noopener noreferrer" style={styles.linkRedo}>(다시 초대하기)</a>
                        </h3>
                    )
                )}
                {step === 'start' && <p style={styles.stepP}>🔒 1단계를 먼저 완료하세요.</p>}
            </div>

            {/* --- Step 3: Guild.xyz 설정 --- */}
            <div style={{ ...styles.stepCard, ...(step !== 'step2_done' && step !== 'all_done') && styles.stepCardDisabled, ...(step === 'all_done') && styles.stepCardCompleted }}>
                {step === 'start' || step === 'step1_done' ? <h3 style={styles.stepHeader}>Step 3: 인증 봇(Guild.xyz) 설정</h3> : null}
                {step === 'step2_done' ? (
                    <>
                        <h3 style={styles.stepHeader}>Step 3: 인증 봇(Guild.xyz) 설정</h3>
                        <p style={styles.stepP}>마지막입니다! Guild.xyz 웹사이트에서 '길드'를 생성하여 후원자 인증을 설정합니다.</p>
                        <a href={GUILD_XYZ_LINK} target="_blank" rel="noopener noreferrer" style={styles.btn}>
                            ➡️ 3-A. Guild.xyz에서 길드 생성하기
                        </a>
                        <a href={GUILD_GUIDE_LINK} target="_blank" rel="noopener noreferrer" style={{ ...styles.linkRedo, marginLeft: 0 }}>
                            (설정 가이드 보기)
                        </a>
                        <div style={styles.nftInfo}>
                            <p style={{...styles.stepP, margin: '0 0 0.5rem 0'}}>Guild.xyz 설정 시 아래 <strong>두 개의 정보</strong>를 사용하세요:</p>
                            <div style={styles.copyBox}>
                                <code>{VOTING_NFT_ADDRESS}</code>
                                <button style={styles.copyBtn} onClick={() => handleCopy(VOTING_NFT_ADDRESS)}>NFT 주소 복사</button>
                            </div>
                            <div style={{...styles.copyBox, marginTop: '0.5rem'}}>
                                <code>Project ID: {project.id.toString()}</code>
                                <button style={styles.copyBtn} onClick={() => handleCopy(project.id.toString())}>ID 복사</button>
                            </div>
                        </div>
                        <button onClick={() => handleCompleteStep('all_done')} style={{ ...styles.btn, ...styles.btnSuccess, marginTop: '1.5rem' }}>
                            🎉 모든 설정 완료하기
                        </button>
                    </>
                ) : (
                    step === 'all_done' && (
                        <h3 style={styles.stepHeaderCompleted}>
                            🎉 모든 설정이 완료되었습니다!
                            <a href={GUILD_XYZ_LINK} target="_blank" rel="noopener noreferrer" style={styles.linkRedo}>(설정 다시 확인)</a>
                        </h3>
                    )
                )}
                {step !== 'step2_done' && step !== 'all_done' && <p style={styles.stepP}>🔒 2단계를 먼저 완료하세요.</p>}
            </div>
            
            <button onClick={resetProgress} style={{...styles.btn, ...styles.resetBtn}}>
                테스트 초기화
            </button>
        </div>
    );
}

export default CommunitySetup;