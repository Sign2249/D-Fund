// src/components/Main.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import Hero from "./Hero";
import ProjectCard from "./ProjectCard";

export default function Main() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const mockProjects = [
      {
        id: "1",
        title: "AI 기반 스마트 농업 솔루션",
        description:
          "인공지능과 IoT를 활용하여 농작물의 생장 환경을 자동으로 최적화하는 혁신적인 농업 기술을 개발합니다.",
        goalAmount: 50,
        fundedAmount: 32.5,
        percent: 65,
        deadline: Date.now() / 1000 + 15 * 24 * 60 * 60,
        image:
          "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&h=350&fit=crop",
        backerCount: 156,
        category: "Technology",
      },
      {
        id: "2",
        title: "친환경 해양 정화 드론",
        description:
          "바다의 플라스틱 쓰레기를 자동으로 수거하는 AI 드론 시스템으로 해양 환경을 보호합니다.",
        goalAmount: 75,
        fundedAmount: 68.2,
        percent: 91,
        deadline: Date.now() / 1000 + 8 * 24 * 60 * 60,
        image:
          "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&h=350&fit=crop",
        backerCount: 243,
        category: "Environment",
      },
      {
        id: "3",
        title: "블록체인 교육 플랫폼",
        description:
          "누구나 쉽게 배울 수 있는 인터랙티브 블록체인 교육 콘텐츠와 실습 환경을 제공합니다.",
        goalAmount: 30,
        fundedAmount: 12.8,
        percent: 43,
        deadline: Date.now() / 1000 + 22 * 24 * 60 * 60,
        image:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=350&fit=crop",
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
     <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] via-[#eef5ff] to-[#eef5ff] py-4 px-4">

      {/* Hero Section */}
      <Hero onGetStarted={handleGetStarted} />

      {/* ------------------ 인기 프로젝트 섹션 ------------------ */}
      <div className="max-w-7xl mx-auto px-6 py-20">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#2563eb]">인기 프로젝트</h2>
            <p className="text-[#6d6d80] mt-2">
              커뮤니티에서 가장 주목받는 혁신적인 프로젝트들을 확인해보세요
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleViewAllProjects}
            className="
              group rounded-full px-6 py-2
              border-[#bfd3ff] text-[#2563eb]
              hover:bg-[#e8f0ff]
            "
          >
            모든 프로젝트 보기
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition" />
          </Button>
        </div>

        {/* 프로젝트 카드 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              {...p}
              onClick={() => handleProjectClick(p.id)}
            />
          ))}
        </div>
      </div>

      {/* ------------------ Why DFund ------------------ */}
      <div className="max-w-7xl mx-auto px-6 mt-28">
        <h2 className="text-3xl font-bold text-[#2563eb] text-center">
          왜 D-Fund를 선택해야 할까요?
        </h2>
        <p className="text-[#6d6d80] text-center mt-3 mb-14">
          블록체인 기술로 구현된 차세대 크라우드펀딩 플랫폼
        </p>

        {/* 3개 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <WhyCard
            icon={<Shield className="text-white w-7 h-7" />}
            title="안전한 스마트 컨트랙트"
            desc="이더리움 블록체인 기반 스마트 컨트랙트로 안전하고 투명한 펀딩을 보장합니다."
            bg="#2563eb"
          />

          <WhyCard
            icon={<Zap className="text-white w-7 h-7" />}
            title="즉각적인 정산"
            desc="목표 달성 시 자동으로 펀딩 금액이 정산되어 프로젝트를 바로 시작할 수 있습니다."
            bg="#22c55e"
          />

          <WhyCard
            icon={<Globe className="text-white w-7 h-7" />}
            title="글로벌 접근성"
            desc="전 세계 어디서나 24/7 접근 가능하며, 국경 없는 펀딩을 실현합니다."
            bg="#2563eb"
          />
        </div>
      </div>

      {/* ------------------ CTA ------------------ */}
      <div className="max-w-7xl mx-auto px-3 mt-28 mb-28">

        <div
          className="
            rounded-3xl p-20 
            bg-white
            text-center
            shadow-[0_4px_30px_rgba(0,0,0,0.08)]
            border border-gray-200
          "
        >
          {/* 제목 */}
          <h3 className="text-5xl md:text-3xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3a6ff0] to-[#27d3a9]">
            혁신적인 아이디어가 있으신가요? <br />
            당신의 창작에 <span className="text-[#2563eb]">Web3</span>를 더하세요.
          </h3>

          {/* 설명 */}
          <p className="text-gray-600 max-w-2xl mx-auto mb-10 mt-6 text-lg">
            D-Fund에서 프로젝트를 시작하고, 전 세계 커뮤니티의 지원을 받아보세요.
            <br />
            블록체인 기술로 투명하고 안전한 펀딩이 가능합니다.
          </p>

          {/* 버튼 영역 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            
            {/* 파란 버튼 */}
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="
                px-8 py-3 
                bg-[#2563eb] hover:bg-[#1e40af] 
                text-white rounded-full 
                shadow-md hover:shadow-lg
                transition
              "
            >
              프로젝트 시작하기 →
            </Button>

            {/* 테두리 버튼 */}
            <Button
              variant="outline"
              size="lg"
              className="
                px-8 py-3 
                rounded-full
                border-gray-300 text-gray-700 
                hover:bg-gray-100 shadow-sm
                transition
              "
            >
              자세히 알아보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ WhyCard Component ------------------ */
function WhyCard({ icon, title, desc, bg }) {
  return (
    <div
      className="
        bg-white rounded-3xl p-10 shadow-md 
        border border-[#e5e8ef] text-center
      "
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
        style={{ backgroundColor: bg }}
      >
        {icon}
      </div>

      <h4 className="text-lg font-bold mt-6">{title}</h4>
      <p className="text-sm text-[#686c7a] mt-3 leading-relaxed">{desc}</p>
    </div>
  );
}
