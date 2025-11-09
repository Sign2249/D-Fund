// src/components/Main.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import Hero from "./Hero";
import ProjectCard from "./ProjectCard";

export default function Main() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const connectWalletForApproval = async () => {
      if (!window.ethereum) {
        console.error("MetaMask가 감지되지 않았습니다.");
        alert("MetaMask가 설치되어 있지 않습니다.");
        return;
      }
      
      try {
        // 'eth_requestAccounts'가 "연결" 팝업을 띄웁니다.
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // ✅ [수정됨] 성공 알림창(alert)을 제거했습니다.
        console.log("Wallet approved for localhost:3000");

      } catch (err) {
        if (err.code === 4001) {
          alert("MetaMask 연결이 거부되었습니다. 다시 시도해주세요.");
          console.warn("User rejected connection.");
        } else {
          alert(`지갑 연결 중 오류 발생: ${err.message}`);
          console.error("Wallet connection error:", err);
        }
      }
    };
    
    // 페이지 로드 시 바로 연결 함수 실행
    connectWalletForApproval();

    const mockProjects = [
      {
        id: "1",
        title: "AI 기반 스마트 농업 솔루션",
        description: "인공지능과 IoT를 활용하여 농작물의 생장 환경을 자동으로 최적화하는 혁신적인 농업 기술을 개발합니다.",
        goalAmount: 50,
        fundedAmount: 32.5,
        percent: 65,
        deadline: Date.now() / 1000 + 15 * 24 * 60 * 60,
        image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&h=300&fit=crop",
        backerCount: 156,
        category: "Technology",
      },
      {
        id: "2",
        title: "친환경 해양 정화 드론",
        description: "바다의 플라스틱 쓰레기를 자동으로 수거하는 AI 드론 시스템으로 해양 환경을 보호합니다.",
        goalAmount: 75,
        fundedAmount: 68.2,
        percent: 91,
        deadline: Date.now() / 1000 + 8 * 24 * 60 * 60,
        image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&h=300&fit=crop",
        backerCount: 243,
        category: "Environment",
      },
      {
        id: "3",
        title: "블록체인 교육 플랫폼",
        description: "누구나 쉽게 배울 수 있는 인터랙티브 블록체인 교육 콘텐츠와 실습 환경을 제공합니다.",
        goalAmount: 30,
        fundedAmount: 12.8,
        percent: 43,
        deadline: Date.now() / 1000 + 22 * 24 * 60 * 60,
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=300&fit=crop",
        backerCount: 89,
        category: "Education",
      },
    ];
    setProjects(mockProjects);
  }, []);

  const handleGetStarted = () => navigate("/register");
  const handleViewAllProjects = () => navigate("/projects");
  const handleProjectClick = (id) => navigate(`/project/${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaefff] via-[#f6f0ff] to-[#ffffff]">
          <Hero onGetStarted={handleGetStarted} />
          
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">인기 프로젝트</h2>
            <p className="text-muted-foreground">커뮤니티에서 가장 주목받는 혁신적인 프로젝트들을 확인해보세요</p>
          </div>
          <Button
            variant="outline"
            onClick={handleViewAllProjects}
            className="group border-primary/30 text-primary hover:bg-primary/10"
          >
            모든 프로젝트 보기
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <ProjectCard key={p.id} {...p} onClick={() => handleProjectClick(p.id)} />
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-card to-card/50 border border-card-border rounded-2xl p-12">
            <h3 className="text-2xl font-bold text-foreground mb-4">혁신적인 아이디어가 있으신가요?</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              D-Fund에서 프로젝트를 시작하고, 전 세계 커뮤니티의 지원을 받아보세요. 
              블록체인 기술로 투명하고 안전한 펀딩이 가능합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                프로젝트 시작하기
              </Button>
              <Button variant="outline" size="lg" className="border-accent/30 text-accent hover:bg-accent/10">
                자세히 알아보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
