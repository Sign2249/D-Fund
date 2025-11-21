import { Zap, Shield, Globe, Sparkles } from "lucide-react";
import React from "react";

export default function ServiceIntro() {
  return (
    <div className="w-full pb-32 bg-gradient-to-b from-[#f5f8ff] via-[#eef5ff] to-[#f7fbff]">

      {/* --- Hero Section --- */}
      <section className="relative py-32 text-center bg-[url('/src/assets/hero-blockchain.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3a6ff0] to-[#27d3a9]">
            D-Fund Service Overview
          </h1>
          <p className="mt-5 text-xl text-white">
            당신의 아이디어가 블록체인 위에서 실현되는 순간.
          </p>
        </div>
      </section>

      {/* --- Section 2: 소개 --- */}
      <section className="max-w-6xl mx-auto mt-24 px-6">
        <div className="p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <h2 className="text-4xl font-bold flex items-center gap-3 mb-4 text-black-500">
            <Shield className="text-blue-300" />
            탈중앙화 크라우드펀딩 플랫폼
          </h2>

          <p className="text-lg text-black-300 leading-relaxed mt-4">
            D-Fund는 이더리움 기반의 DAO형 크라우드펀딩 플랫폼입니다.<br />
            창작자가 후원을 받고 후원자는 리워드를 받는 구조는 유지하면서,<br />
            모든 거래가 블록체인에 기록됩니다.
          </p>

          {/* 3개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <CardSmall number="100%" label="투명한 자금 흐름" color="text-blue-500" />
            <CardSmall number="DAO" label="투표 기반 자금 집행" color="text-cyan-500" />
            <CardSmall number="NFT" label="투표권 기반 후원 참여" color="text-purple-500" />
          </div>
        </div>
      </section>

      {/* --- Section 3: 성장 지표 --- */}
      <section className="max-w-6xl mx-auto mt-24 px-6">
        <h2 className="text-4xl font-bold text-black-100 mb-10 flex items-center gap-3">
          <Globe className="text-cyan-300" />
          D-Fund의 잠재력
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard number="1,077만 명" label="한국의 가상자산 이용자" />
          <StatCard number="0%" label="중앙 기관 수수료" />
          <StatCard number="∞" label="확장 가능한 DAO 구조" />
        </div>
      </section>

      {/* --- Section 4: 장점 --- */}
      <section className="max-w-6xl mx-auto mt-28 px-6">
        <h2 className="text-4xl font-bold text-black-100 mb-16 flex items-center gap-3">
          <Sparkles className="text-pink-300" />
          왜 D-Fund인가?
        </h2>

        <div className="space-y-14">
          <InfoBlock
            number="01."
            title="누구나 시작 가능한 Web3 펀딩"
            text="누구든 쉽게 프로젝트를 등록하고 스마트 계약이 자금을 직접 관리합니다."
          />
          <InfoBlock
            number="02."
            title="DAO 투표 기반 자금 집행"
            text="NFT Voting Power로 후원자는 프로젝트 단계별 자금 집행을 투표합니다."
          />
          <InfoBlock
            number="03."
            title="전문가 리뷰 기반 신뢰 강화"
            text="전문 리뷰어 + 평판 시스템으로 책임감 있고 투명한 검증이 이루어집니다."
          />
        </div>
      </section>

      {/* --- Section 5: 가능 프로젝트 --- */}
      <section className="max-w-6xl mx-auto mt-28 px-6">
        <h2 className="text-4xl font-bold text-black-100 mb-10">
          D-Fund로 실현할 수 있는 프로젝트
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ProjectCard title="인디 게임" text="DAO 기반으로 커뮤니티와 함께 성장하는 게임 프로젝트." />
          <ProjectCard title="창작 예술" text="NFT 리워드를 통한 새로운 창작 생태계." />
          <ProjectCard title="오픈소스 개발" text="기여도 기반 보상을 제공하는 새로운 개발 펀딩 모델." />
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="text-center mt-32">
        <h2 className="text-5xl md:text-6xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3a6ff0] to-[#27d3a9]">
          당신의 창작에 Web3를 더하세요.
        </h2>
      </section>
    </div>
  );
}

/* ---------------- Components ---------------- */

function CardSmall({ number, label, color }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg text-center">
      <div className={`text-4xl font-extrabold ${color}`}>{number}</div>
      <p className="text-black-400 mt-2">{label}</p>
    </div>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-lg text-center">
      <h3 className="text-4xl font-bold text-black-100">{number}</h3>
      <p className="text-black-400 mt-2">{label}</p>
    </div>
  );
}

function InfoBlock({ number, title, text }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
      <h3 className="text-2xl font-semibold text-black-100">
        <span className="text-blue-300 mr-2">{number}</span>
        {title}
      </h3>
      <p className="text-black-300 mt-3">{text}</p>
    </div>
  );
}

function ProjectCard({ title, text }) {
  return (
    <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg">
      <h3 className="font-semibold text-xl text-black-100">{title}</h3>
      <p className="text-black-400 mt-3">{text}</p>
    </div>
  );
}
