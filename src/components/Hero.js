import React from "react";
import heroImg from "../assets/hero-blockchain.jpg"; // 이미지 경로 확인 필요
import { Shield, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="w-full bg-gradient-to-b from-[#f5f8ff] via-[#eef5ff] to-[#eef5ff] py-16 mt-0">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* -------- LEFT TEXT -------- */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/40 mb-6">
            <span className="text-sm font-medium text-[#4c4c6d]">
              탈중앙화 · 투명성 · 혁신
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3a6ff0] to-[#27d3a9]">
            DFund
            <br /> <br />
            혁신을 지원하고,
            <br />
            미래를 펀딩하세요
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#6d6d80] mt-6 leading-relaxed">
            D-Fund는 이더리움 기반의 탈중앙화 크라우드펀딩 플랫폼입니다.
            <br />
            블록체인 기술로 투명하고 안전한 펀딩 경험을 제공합니다.
          </p>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            {/* Primary */}
            <a
              href="/register"
              className="px-8 py-3 bg-[#3a6ff0] text-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              프로젝트 시작하기 →
            </a>

            {/* Secondary */}
            <a
              href="/service-intro"
              className="px-8 py-3 bg-white text-[#3a6ff0] rounded-full border border-[#d5dff7] shadow-sm hover:bg-[#f4f7ff] transition-all"
            >
              자세히 알아보기
            </a>
          </div>

          {/* Bottom Stats */}
          <div className="flex gap-10 mt-14">
            <div>
              <div className="text-3xl font-bold text-[#3a6ff0]">24/7</div>
              <div className="text-sm text-[#6d6d80] mt-1">글로벌 접근성</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#27d3a9]">0%</div>
              <div className="text-sm text-[#6d6d80] mt-1">중개 수수료</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#3a6ff0]">100%</div>
              <div className="text-sm text-[#6d6d80] mt-1">투명한 거래</div>
            </div>
          </div>
        </div>

        <div className="relative">
  <img
    src={heroImg}
    alt="블록체인"
    className="w-full rounded-3xl shadow-2xl"
  />

{/* 스마트 컨트랙트 카드 — 훨씬 투명 + 이미지 왼쪽에 걸치게 */}
<div
  className="
    absolute 
    top-12 -left-8    /* 왼쪽으로 살짝 튀어나오게 */
    w-36 h-36 
    rounded-3xl
    bg-white/1     /* 훨씬 투명 */
    backdrop-blur-2xl
    border border-white/15
    shadow-[0_4px_20px_rgba(0,0,0,0.07)]
    flex flex-col items-center justify-center
    animate-float
  "
>
  <Shield className="w-7 h-7 text-[#3a6ff0] mb-3 opacity-90" />
  <div className="text-[15px] font-semibold text-[#f4f3fb]">
    스마트 컨트랙트
  </div>
  <div className="text-[12px] text-[#f4f3fb] mt-1">
    안전한 거래 보장
  </div>
</div>


  {/* 글로벌 커뮤니티 카드 — 훨씬 투명 + 이미지 오른쪽에 걸치게 */}
<div
  className="
    absolute 
    bottom-12 -right-8   /* 오른쪽으로 튀어나오게 */
    w-36 h-36 
    rounded-3xl
    bg-white/1          /* 투명도 낮춤 */
    backdrop-blur-2xl
    border border-white/15
    shadow-[0_4px_20px_rgba(0,0,0,0.07)]
    flex flex-col items-center justify-center
    animate-[float_5s_ease-in-out_infinite]
  "
>
  <Users className="w-7 h-7 text-[#27d3a9] mb-3 opacity-90" />
  <div className="text-[15px] font-semibold text-[#f4f3fb]">
    글로벌 커뮤니티
  </div>
  <div className="text-[12px] text-[#f4f3fb] mt-1">
    전세계 후원자
  </div>
</div>

</div>
      </div>
    </section>
  );
}