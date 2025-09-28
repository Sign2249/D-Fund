// src/components/Hero.js
import { Button } from "./ui/button";
import { ArrowRight, Zap } from "lucide-react";

export default function Hero({ onGetStarted }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10 py-20">
      <div className="absolute inset-0 bg-grid-white/5 bg-grid-pattern opacity-20" />
      <div className="absolute top-20 left-20 w-16 h-16 border border-primary/30 rotate-45 animate-pulse" />
      <div className="absolute top-40 right-32 w-12 h-12 border border-accent/40 rotate-12 animate-bounce" />
      <div className="absolute bottom-32 left-40 w-8 h-8 bg-primary/20 rotate-45" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono text-primary">
            Decentralized • Trustless • Innovation
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent mb-6">
          Empower Ideas,<br />Fund the Future
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          D-Fund는 이더리움 기반의 탈중앙화 크라우드펀딩 플랫폼입니다.<br />
          혁신적인 프로젝트를 등록하고, 지원을 받아 세상을 변화시키세요!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-full group"
          >
            시작하기
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary/30 text-primary hover:bg-primary/10 px-8 py-3 rounded-full backdrop-blur-sm"
          >
            자세히 알아보기
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">전 세계 접근 가능</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-accent mb-2">0%</div>
            <div className="text-sm text-muted-foreground">중개 수수료</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-chart-4 mb-2">100%</div>
            <div className="text-sm text-muted-foreground">투명한 거래</div>
          </div>
        </div>
      </div>
    </div>
  );
}
