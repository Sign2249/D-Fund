// src/components/CommunitySetup.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Swal from 'sweetalert2';

// ⭐ 세폴리아 버전 ABI & 주소 사용
import { DFundCoreABI, CONTRACT_ADDRESS as DFUND_ADDRESS } from '../web3/DFundContract';
import { VotingPowerNFTABI, CONTRACT_ADDRESS as VOTING_NFT_ADDRESS } from "../web3/VotingPowerNFTContract";

import { 
    TEMPLATE_LINK, 
    DFUND_BOT_LINK, 
    GUILD_XYZ_LINK,
    GUILD_GUIDE_LINK
} from '../constants';

function CommunitySetup() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);
    const [project, setProject] = useState(null);
    const [step, setStep] = useState(() => localStorage.getItem(`dfund_setup_step_${id}`) || 'start');

    // ---------------- 권한 확인 ----------------
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                if (!window.ethereum) throw new Error("Metamask가 필요합니다.");

                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(DFUND_ADDRESS, DFundCoreABI, provider);

                const detail = await contract.getProject(id);
                if (!detail || detail.title === '') throw new Error("프로젝트를 찾을 수 없습니다.");

                setProject(detail);

                const signer = provider.getSigner();
                const userAddress = (await signer.getAddress()).toLowerCase();

                // ✔ status === 1(모금 성공)일 때만 커뮤니티 생성 가능
                if (userAddress === detail.creator.toLowerCase() && detail.status === 1) {
                    setIsCreator(true);
                } else {
                    throw new Error("커뮤니티 설정은 모금 성공 후 창작자만 가능합니다.");
                }
            } catch (err) {
                Swal.fire("오류", err.message, "error");
                navigate("/");
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, [id, navigate]);

    // ---------------- Step 저장 ----------------
    useEffect(() => {
        localStorage.setItem(`dfund_setup_step_${id}`, step);
    }, [step, id]);

    const handleCompleteStep = (nextStep) => setStep(nextStep);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        Swal.fire("복사 완료!", "클립보드에 복사되었습니다.", "success");
    };

    const resetProgress = () => {
        Swal.fire({
            title: "정말 초기화할까요?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "예",
            cancelButtonText: "아니오"
        }).then((r) => {
            if (r.isConfirmed) {
                localStorage.removeItem(`dfund_setup_step_${id}`);
                setStep("start");
            }
        });
    };

    // ---------------- 스타일 ----------------
    const styles = {
        container: {
            maxWidth: "900px",
            margin: "2rem auto",
            padding: "2rem",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontFamily: "Pretendard, sans-serif"
        },
        header: { fontSize: "2rem", fontWeight: "700" },
        headerP: {
            color: "#555",
            marginBottom: "1.5rem",
            borderBottom: "1px solid #eee",
            paddingBottom: "1rem"
        },
        stepCard: {
            border: "1px solid #ddd",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            borderRadius: "10px",
            background: "#fff"
        },
        btn: {
            padding: "0.7rem 1.4rem",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer"
        },
        btnSecond: {
            padding: "0.7rem 1.4rem",
            background: "#17a2b8",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            marginLeft: "0.5rem"
        },
        btnSuccess: {
            padding: "0.7rem 1.4rem",
            background: "#16a34a",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "1rem"
        }
    };

    if (isLoading) return <p style={{ textAlign: "center", marginTop: "3rem" }}>확인 중...</p>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>🚀 {project?.title} 커뮤니티 설정</h1>
            <p style={styles.headerP}>후원자 커뮤니티 생성은 3단계로 구성됩니다.</p>

            {/* STEP 1 */}
            <div style={styles.stepCard}>
                <h3>Step 1 — Discord 서버 생성</h3>
                <p>생성할 서버 이름은 아래를 복사하세요.</p>

                <code style={{ background: "#f4f4f4", padding: "0.4rem 0.7rem", borderRadius: "6px" }}>
                    {project?.title}
                </code>

                <button style={styles.btnSecond} onClick={() => handleCopy(project.title)}>
                    복사하기
                </button>

                <br /><br />

                <a href={TEMPLATE_LINK} target="_blank" rel="noopener noreferrer">
                    <button style={styles.btn}>Discord 서버 생성하기 →</button>
                </a>

                {step === "start" && (
                    <button style={styles.btnSuccess} onClick={() => handleCompleteStep("step1_done")}>
                        완료
                    </button>
                )}

                {step !== "start" && <p>✔ 완료됨</p>}
            </div>

            {/* STEP 2 */}
            <div style={styles.stepCard}>
                <h3>Step 2 — DFundBot 초대</h3>

                {step === "step1_done" && (
                    <>
                        <p>관리 봇을 서버에 초대하세요.</p>

                        <a href={DFUND_BOT_LINK} target="_blank" rel="noopener noreferrer">
                            <button style={styles.btn}>DFund Bot 초대하기 →</button>
                        </a>

                        <button style={styles.btnSuccess} onClick={() => handleCompleteStep("step2_done")}>
                            완료
                        </button>
                    </>
                )}

                {step !== "step1_done" && step !== "start" && <p>✔ 완료됨</p>}
                {step === "start" && <p>🔒 Step 1을 먼저 완료하세요</p>}
            </div>

            {/* STEP 3 */}
            <div style={styles.stepCard}>
                <h3>Step 3 — Guild.xyz 인증 설정</h3>

                {step === "step2_done" ? (
                    <>
                        <p>Guild.xyz에서 NFT 기반 인증을 설정합니다.</p>

                        <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f7faff", borderRadius: "8px" }}>
                            <p>NFT Contract:</p>
                            <code>{VOTING_NFT_ADDRESS}</code>
                            <button style={styles.btnSecond} onClick={() => handleCopy(VOTING_NFT_ADDRESS)}>
                                복사
                            </button>

                            <p style={{ marginTop: "1rem" }}>Project ID:</p>
                            <code>{id}</code>
                            <button style={styles.btnSecond} onClick={() => handleCopy(id)}>
                                복사
                            </button>
                        </div>

                        <a href={GUILD_XYZ_LINK} target="_blank" rel="noopener noreferrer">
                            <button style={styles.btn}>Guild 설정하기 →</button>
                        </a>

                        <button style={styles.btnSuccess} onClick={() => handleCompleteStep("all_done")}>
                            🎉 모든 설정 완료
                        </button>
                    </>
                ) : (
                    step === "all_done" && <p>🎉 모든 커뮤니티 설정이 완료되었습니다!</p>
                )}

                {(step !== "step2_done" && step !== "all_done") && (
                    <p>🔒 Step 2를 완료해야 합니다.</p>
                )}
            </div>

            <button style={{ ...styles.btn, background: "#dc2626" }} onClick={resetProgress}>
                진행 초기화
            </button>
        </div>
    );
}

export default CommunitySetup;
