"use client";

import { useState } from "react";
import { Search, Bell, PanelRight, Edit2, X, Send, Sparkles } from "lucide-react";

export default function Home() {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 pb-20 relative">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-[32px] font-headings font-bold text-text">대시보드</h1>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="집중할 작업 검색..." 
              className="pl-11 pr-4 py-2.5 w-[300px] bg-white rounded-pill text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
          <button className="text-muted hover:text-text transition-colors"><Bell size={20} /></button>
          <button className="text-muted hover:text-text transition-colors"><PanelRight size={20} /></button>
          <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border-2 border-white shadow-sm cursor-pointer">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Top Priority Section */}
      <section className="bg-white rounded-[32px] p-8 shadow-soft relative overflow-hidden flex justify-between items-center group hover:shadow-float transition-shadow duration-300">
        <div className="max-w-xl z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold text-secondary tracking-widest uppercase bg-[#FFF5EB] px-3 py-1 rounded-pill">최우선 작업</span>
            <span className="text-sm font-medium text-muted">• 예상 소요 시간: 4h</span>
          </div>
          <h2 className="text-[32px] leading-[1.2] font-headings font-bold text-text mb-8">
            팀 주간 회의를 위한 결과물 요약 및 프레젠테이션 준비
          </h2>
          <div className="flex items-center gap-6">
            <button className="bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-pill font-bold shadow-soft transition-all">
              작업 시작하기
            </button>
             <button className="flex items-center gap-2 text-muted hover:text-text transition-colors font-medium">
              <Edit2 size={16} /> 작업 수정
            </button>
          </div>
        </div>
        
        {/* Right side focus image placeholder */}
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-gradient-to-l from-black/80 to-transparent flex justify-end">
          <div className="w-[300px] h-full bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50"></div>
           <div className="absolute inset-y-0 right-10 my-auto w-[250px] h-[250px] bg-black rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
             {/* Using CSS radial gradient to mimic the light burst in the design */}
             <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-80 mix-blend-screen" style={{backgroundSize: '10px 10px', backgroundImage: 'repeating-conic-gradient(from 0deg, white 0deg 10deg, transparent 10deg 20deg)'}}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60"></div>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Agenda & Team Pulse) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Your Agenda */}
          <section className="bg-white rounded-[32px] p-8 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headings font-bold text-text">오늘의 일정</h3>
              <div className="flex bg-[#F4F7FB] rounded-pill p-1">
                 <button className="px-4 py-1.5 bg-white rounded-pill text-xs font-bold text-primary shadow-sm">마감 임박</button>
                 <button className="px-4 py-1.5 text-muted text-xs font-bold hover:text-text transition-colors">나중에</button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Task Item 1 */}
              <div className="flex items-center justify-between p-4 bg-[#FBFDFD] rounded-xl hover:bg-[#F4F7FB] transition-colors group cursor-pointer border border-transparent hover:border-[#E5E9F0]">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center"></div>
                  <div>
                    <h4 className="font-bold text-text text-sm group-hover:text-primary transition-colors">3분기 팀 로드맵 업데이트</h4>
                    <p className="text-xs text-muted mt-0.5 font-medium">마케팅 프로젝트 • <span className="text-text">오후 2:00</span></p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">?</div>
              </div>

              {/* Task Item 2 */}
              <div className="flex items-center justify-between p-4 bg-[#FBFDFD] rounded-xl hover:bg-[#F4F7FB] transition-colors group cursor-pointer border border-transparent hover:border-[#E5E9F0]">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center"></div>
                  <div>
                    <h4 className="font-bold text-text text-sm group-hover:text-primary transition-colors">AI 통합 패턴 연구 및 문서화</h4>
                    <p className="text-xs text-muted mt-0.5 font-medium">개인 학습 • <span className="text-text">오후 4:30</span></p>
                  </div>
                </div>
              </div>

              {/* Task Item 3 */}
              <div className="flex items-center justify-between p-4 bg-[#FBFDFD] rounded-xl hover:bg-[#F4F7FB] transition-colors group cursor-pointer border border-transparent hover:border-[#E5E9F0]">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center"></div>
                  <div>
                    <h4 className="font-bold text-text text-sm group-hover:text-primary transition-colors">엔지니어링 팀과 UI 컴포넌트 정책 동기화</h4>
                    <p className="text-xs text-muted mt-0.5 font-medium">제품 기획 • <span className="text-text">오늘 마감</span></p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Pulse */}
          <section className="bg-white rounded-[32px] p-8 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headings font-bold text-text">팀 상태</h3>
              <button className="text-xs font-bold text-primary hover:underline transition-colors">전체 보기</button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {/* Member 1: Sarah (Focused) */}
              <div className="flex flex-col items-center bg-[#FBFDFD] py-6 px-2 rounded-2xl hover:bg-[#F4F7FB] border border-transparent hover:border-[#E5E9F0] transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 relative shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Sarah" alt="Sarah" className="w-full h-full object-cover bg-secondary" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm"><div className="w-2.5 h-2.5 rounded-full bg-success"></div></div>
                </div>
                <span className="font-bold text-sm text-text">사라</span>
                <span className="text-[11px] font-bold text-primary mt-0.5 tracking-wider">집중 모드</span>
              </div>
              {/* Member 2: Alex (Busy) */}
              <div className="flex flex-col items-center bg-[#FBFDFD] py-6 px-2 rounded-2xl hover:bg-[#F4F7FB] border border-transparent hover:border-[#E5E9F0] transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 relative shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Alex" alt="Alex" className="w-full h-full object-cover bg-[#FFD166]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm"><div className="w-2.5 h-2.5 rounded-full bg-[#EF476F]"></div></div>
                </div>
                <span className="font-bold text-sm text-text">알렉스</span>
                <span className="text-[11px] font-bold text-[#EF476F] mt-0.5 tracking-wider">바쁨</span>
              </div>
              {/* Member 3: Jordan (Break) */}
               <div className="flex flex-col items-center bg-[#FBFDFD] py-6 px-2 rounded-2xl hover:bg-[#F4F7FB] border border-transparent hover:border-[#E5E9F0] transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 relative shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Jordan" alt="Jordan" className="w-full h-full object-cover bg-primary" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm"><div className="w-2.5 h-2.5 rounded-full bg-muted"></div></div>
                </div>
                <span className="font-bold text-sm text-text">조던</span>
                <span className="text-[11px] font-bold text-success mt-0.5 tracking-wider">휴식 중</span>
              </div>
              {/* Member 4: Lina (Remote) */}
              <div className="flex flex-col items-center bg-[#FBFDFD] py-6 px-2 rounded-2xl hover:bg-[#F4F7FB] border border-transparent hover:border-[#E5E9F0] transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 relative shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Lina" alt="Lina" className="w-full h-full object-cover bg-[#06D6A0]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm"><div className="w-2.5 h-2.5 rounded-full bg-secondary"></div></div>
                </div>
                <span className="font-bold text-sm text-text">리나</span>
                <span className="text-[11px] font-bold text-muted mt-0.5 tracking-wider">원격 근무</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Flow, Timeline, Quote) */}
        <div className="space-y-8 flex flex-col h-full">
          
          {/* Your Flow */}
          <section className="bg-white rounded-[32px] p-8 shadow-soft">
            <h3 className="text-xl font-headings font-bold text-text mb-8">나의 업무 흐름</h3>
            <div className="flex items-end justify-between h-[120px] mb-6 gap-3">
              {/* Bar Chart Mockup */}
              <div className="w-1/5 bg-[#F4F7FB] rounded-t-[8px] h-[40%] transition-all hover:bg-primary/20 cursor-pointer"></div>
              <div className="w-1/5 bg-[#F4F7FB] rounded-t-[8px] h-[60%] transition-all hover:bg-primary/20 cursor-pointer"></div>
              <div className="w-1/5 bg-[#F4F7FB] rounded-t-[8px] h-[30%] transition-all hover:bg-primary/20 cursor-pointer"></div>
              <div className="w-1/5 bg-[#F4F7FB] rounded-t-[8px] h-[80%] transition-all hover:bg-primary/20 cursor-pointer"></div>
              <div className="w-1/5 bg-primary rounded-t-[8px] h-[100%] shadow-soft cursor-pointer hover:bg-opacity-90 transition-all relative">
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">최고 몰입</div>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-dashed border-[#E5E9F0] pt-5">
              <div>
                <p className="text-4xl font-headings font-bold text-text mb-1">82%</p>
                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">주간 목표 달성률</p>
              </div>
              <div className="text-right">
                <p className="text-success font-bold text-sm mb-1">↑ 12%</p>
                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">지난주 대비</p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-[32px] p-8 shadow-soft relative overflow-hidden flex-1">
             <h3 className="text-xl font-headings font-bold text-text mb-6">타임라인</h3>
             <div className="relative border-l-2 border-dashed border-[#E5E9F0] ml-2 space-y-8 pb-10">
                {/* Event 1 */}
                <div className="relative pl-6 group cursor-pointer">
                  <div className="absolute w-[14px] h-[14px] bg-primary inset-y-0 my-auto -left-[8px] rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-125"></div>
                  <p className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1 drop-shadow-sm">15분 후</p>
                  <h4 className="font-bold text-text text-sm group-hover:text-primary transition-colors">주간 디자인 리뷰 싱크</h4>
                  <p className="text-xs text-muted mt-0.5 font-medium">Zoom 참석 • 4명</p>
                </div>
                
                 {/* Event 2 */}
                 <div className="relative pl-6 group cursor-pointer">
                  <div className="absolute w-[14px] h-[14px] bg-[#E5E9F0] inset-y-0 my-auto -left-[8px] rounded-full border-[3px] border-white transition-transform group-hover:scale-125 group-hover:bg-muted"></div>
                  <p className="text-[10px] font-bold text-muted tracking-widest uppercase mb-1">오후 2:00</p>
                  <h4 className="font-bold text-text text-sm group-hover:text-primary transition-colors">제품 팀 주간 스탠드업</h4>
                  <p className="text-xs text-muted mt-0.5 font-medium">302호 회의실 (대면)</p>
                </div>

                {/* Event 3 */}
                 <div className="relative pl-6 group cursor-pointer">
                  <div className="absolute w-[14px] h-[14px] bg-[#E5E9F0] inset-y-0 my-auto -left-[8px] rounded-full border-[3px] border-white transition-transform group-hover:scale-125 group-hover:bg-muted"></div>
                  <p className="text-[10px] font-bold text-muted tracking-widest uppercase mb-1">오후 4:30</p>
                  <h4 className="font-bold text-text text-sm group-hover:text-primary transition-colors">집중 모드 (방해 금지)</h4>
                  <p className="text-xs text-muted mt-0.5 font-medium">딥 워크 및 문서 작성</p>
                </div>
             </div>
             
             {/* FAB button mockup */}
             <button 
               onClick={() => setIsAiChatOpen(!isAiChatOpen)}
               className="fixed right-10 bottom-10 w-14 h-14 bg-[#7FA1C3] hover:bg-opacity-90 text-white rounded-full flex items-center justify-center shadow-float hover:scale-110 transition-all z-50 border-2 border-white"
             >
               <span className="text-2xl pt-1 opacity-90">✨</span>
             </button>
             
             {/* AI Chat Overlay Mockup */}
             {isAiChatOpen && (
               <div className="fixed right-10 bottom-[104px] w-[340px] h-[500px] min-w-[300px] min-h-[400px] max-w-[80vw] max-h-[80vh] resize bg-white rounded-2xl shadow-float border border-[#E5E9F0] overflow-hidden flex flex-col z-50">
                  <div className="p-4 border-b border-[#E5E9F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#EAF0F6] rounded-xl flex items-center justify-center text-primary">
                        <span className="text-xl">🤖</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-text text-[15px] flex items-center gap-1.5 leading-tight">Workpresso AI <div className="w-2 h-2 rounded-full bg-success"></div></h3>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-muted mt-0.5">온라인 • 무엇이든 물어보세요</p>
                      </div>
                    </div>
                    <button onClick={() => setIsAiChatOpen(false)} className="text-muted hover:text-text transition-colors"><X size={18} /></button>
                  </div>
                  
                  <div className="p-5 flex-1">
                    <div className="bg-[#FBFDFD] border border-[#E5E9F0] rounded-2xl p-4 text-sm text-text leading-relaxed shadow-sm mb-1.5 rounded-tl-sm word-break">
                      제인 님, 오늘 어떤 도움이 필요하신가요? 일정 관리를 돕거나 최근 대화를 요약해 드릴 수 있습니다.
                    </div>
                    <span className="text-[10px] text-muted font-medium ml-1">방금 전</span>
                    
                    <div className="flex flex-wrap gap-2 mt-6">
                      <button className="bg-[#F4F7FB] hover:bg-[#EAF0F6] text-primary text-[11px] font-bold px-3 py-2 rounded-pill transition-colors shadow-sm">회의 일정 잡기</button>
                      <button className="bg-[#F4F7FB] hover:bg-[#EAF0F6] text-primary text-[11px] font-bold px-3 py-2 rounded-pill transition-colors shadow-sm">작업 요약하기</button>
                      <button className="bg-[#F4F7FB] hover:bg-[#EAF0F6] text-primary text-[11px] font-bold px-3 py-2 rounded-pill transition-colors shadow-sm">답장 초안 작성</button>
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#E5E9F0] bg-white">
                    <div className="relative">
                      <input type="text" placeholder="Workpresso AI에게 질문하기..." className="w-full pl-5 pr-12 py-3 bg-[#FBFDFD] border border-[#E5E9F0] rounded-pill text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm text-text placeholder:text-muted/80" />
                      <button className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-[#7FA1C3] text-white flex items-center justify-center hover:bg-opacity-90 transition-colors shadow-sm"><Send size={13} className="ml-0.5" /></button>
                    </div>
                  </div>
               </div>
             )}

          </section>

          {/* Quote */}
          <section className="bg-[#EEF4ED] rounded-[32px] p-8 shadow-sm">
            <span className="text-[40px] text-success font-headings leading-[0] block h-[20px] mb-2 opacity-50 font-bold">"</span>
            <p className="text-[15px] font-medium text-[#4A5D4E] italic leading-relaxed mb-6 break-keep">
              진정한 집중이란 당신이 하지 않을 일들을 결정하는 문제일 뿐입니다.
            </p>
            <p className="text-[10px] font-bold text-[#6D8A73] tracking-widest uppercase">— 존 카맥 (John Carmack)</p>
          </section>

        </div>
      </div>
    </div>
  );
}
