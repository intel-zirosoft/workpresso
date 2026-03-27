"use client";

import { Sparkles, Plus } from "lucide-react";
import { CalendarView } from "@/app/(schedules)/_components/calendar-view";

export default function HomePage() {
  return (
    <div className="space-y-6 md:space-y-10">
      {/* Greeting Header */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <p className="text-text-muted font-headings font-medium mb-1 text-sm md:text-base">Good morning, User!</p>
          <h1 className="text-2xl md:text-4xl font-headings font-bold text-text tracking-tight">
            당신의 하루를 부드럽게 시작하세요.
          </h1>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="bg-primary text-white px-6 py-3 rounded-pill font-headings font-bold shadow-soft hover:shadow-float transition-all flex items-center justify-center gap-2 w-full md:w-auto">
            <Plus className="w-5 h-5" /> 새 작업 추가
          </button>
        </div>
      </header>

      {/* Content Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Main Dashboard Area (70%) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Priority Task Placeholder */}
          <section className="bg-surface rounded-lg p-6 md:p-10 shadow-soft border border-background/50 min-h-[250px] md:min-h-[300px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-3xl md:text-4xl">☕️</div>
              <p className="text-text-muted font-headings font-medium text-sm md:text-base">최우선 순위 작업을 준비 중입니다.</p>
            </div>
          </section>

          {/* Agenda & Calendar Area */}
          <section className="bg-surface rounded-lg p-8 shadow-soft border border-background/50 min-h-[400px] flex items-center justify-center">
            <CalendarView variant="default" />
          </section>
        </div>

        {/* Right Sidebar Widgets (30%) */}
        <div className="space-y-6 md:space-y-8">
          {/* Team Pulse Placeholder */}
          <section className="bg-surface rounded-lg p-6 md:p-8 shadow-soft border border-background/50 min-h-[300px] md:min-h-[350px]">
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
          <section className="bg-success/10 rounded-lg p-6 md:p-8 shadow-sm border border-success/10 min-h-[150px] md:min-h-[200px] flex flex-col justify-center italic">
            <p className="text-success text-sm font-medium leading-relaxed">
              "부드러운 대화가 단단한 마음을 녹입니다."
            </p>
          </section>
        </div>
      </div>

      {/* AI Floating Button */}
      <button className="fixed right-6 bottom-6 md:right-10 md:bottom-10 w-14 h-14 md:w-16 md:h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-float hover:scale-110 transition-all z-50">
        <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </div>
  );
}
