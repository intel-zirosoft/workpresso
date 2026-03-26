"use client";

import { Sparkles, Plus } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Greeting Header */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-text-muted font-headings font-medium mb-1">Good morning, User!</p>
          <h1 className="text-4xl font-headings font-bold text-text tracking-tight">
            당신의 하루를 부드럽게 시작하세요.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-primary text-white px-6 py-3 rounded-pill font-headings font-bold shadow-soft hover:shadow-float transition-all flex items-center gap-2">
            <Plus size={20} /> 새 작업 추가
          </button>
        </div>
      </header>

      {/* Content Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Dashboard Area (70%) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Priority Task Placeholder */}
          <section className="bg-surface rounded-lg p-10 shadow-soft border border-background/50 min-h-[300px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl">☕️</div>
              <p className="text-text-muted font-headings font-medium">최우선 순위 작업을 준비 중입니다.</p>
            </div>
          </section>

          {/* Agenda Placeholder */}
          <section className="bg-surface rounded-lg p-8 shadow-soft border border-background/50 min-h-[400px]">
            <h3 className="text-xl font-headings font-bold text-text mb-6">오늘의 일정</h3>
            <div className="flex flex-col items-center justify-center h-[300px] text-muted space-y-4">
              <Sparkles size={32} className="opacity-20 text-primary" />
              <p className="font-headings font-medium text-text-muted">일정 로직을 구현해 주세요.</p>
            </div>
          </section>
        </div>

        {/* Right Sidebar Widgets (30%) */}
        <div className="space-y-8">
          {/* Team Pulse Placeholder */}
          <section className="bg-surface rounded-lg p-8 shadow-soft border border-background/50 min-h-[350px]">
            <h3 className="text-lg font-headings font-bold text-text mb-6">팀 상태</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-background/30 border border-transparent hover:border-background transition-all">
                  <div className="w-10 h-10 rounded-full bg-secondary/30" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-muted/20 rounded" />
                    <div className="h-2 w-12 bg-muted/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity / Quote Placeholder */}
          <section className="bg-success/10 rounded-lg p-8 shadow-sm border border-success/10 min-h-[200px] flex flex-col justify-center italic">
            <p className="text-success text-sm font-medium leading-relaxed">
              "부드러운 대화가 단단한 마음을 녹입니다."
            </p>
          </section>
        </div>
      </div>

      {/* AI Floating Button (Fixed Position is handled by relative/z-index or absolute) */}
      <button className="fixed right-10 bottom-10 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-float hover:scale-110 transition-all z-50">
        <Sparkles size={28} />
      </button>
    </div>
  );
}
