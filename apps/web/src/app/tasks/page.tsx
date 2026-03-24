import { Search, Bell, Plus, MoreHorizontal, CheckCircle2, MessageSquare, CheckSquare } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 pb-20 h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-2 shrink-0">
        <h1 className="text-[32px] font-headings font-bold text-text mb-1">
          마케팅<br />리프레시
        </h1>
        
        <div className="flex items-center gap-8">
          {/* Tabs */}
          <div className="flex gap-6 font-medium text-sm border-b border-transparent">
            <button className="text-primary border-b-2 border-primary pb-1 font-bold">대시보드</button>
            <button className="text-muted hover:text-text transition-colors pb-1">분석</button>
            <button className="text-muted hover:text-text transition-colors pb-1">팀</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="text" 
                placeholder="작업 검색..." 
                className="pl-10 pr-4 py-2 w-[240px] bg-white rounded-pill text-sm focus:outline-none border border-[#E5E9F0] shadow-sm"
              />
            </div>
            <button className="text-muted hover:text-text transition-colors"><Bell size={20} /></button>
            <button className="bg-[#7FA1C3] hover:bg-opacity-90 text-white px-5 py-2.5 rounded-pill font-bold shadow-soft transition-all flex items-center gap-2">
              <Plus size={16} /> 새로운 작업
            </button>
            <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border-2 border-white shadow-sm cursor-pointer shrink-0">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max">
          
          {/* Column 1: To Do */}
          <div className="w-[320px] flex flex-col h-full shrink-0">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-headings font-bold text-text text-lg">할 일</h3>
                <span className="bg-[#EEF4ED] text-[#6D8A73] font-bold text-xs px-2 py-0.5 rounded-full">3</span>
              </div>
              <button className="text-muted hover:text-text"><MoreHorizontal size={20} /></button>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-10 scrollbar-hide">
              {/* Card 1 */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E5E9F0] hover:shadow-soft transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#FFF5EB] text-secondary text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-pill">전략</span>
                </div>
                <h4 className="font-bold text-text text-[15px] leading-snug mb-4 group-hover:text-primary transition-colors">
                  Q4 캠페인 시각 언어 정의
                </h4>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-primary shrink-0"><img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Marcus" alt="user" className="w-full h-full object-cover" /></div>
                      <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-[#E5E9F0] text-[10px] font-bold text-muted shrink-0">+2</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <span className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center text-white text-[8px]">⏱</span>
                    10월 24일
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E5E9F0] hover:shadow-soft transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#EEF4ED] text-[#6D8A73] text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-pill">리서치</span>
                </div>
                <h4 className="font-bold text-text text-[15px] leading-snug mb-4 group-hover:text-primary transition-colors">
                  경쟁사 분석: SaaS 마인드풀니스 앱
                </h4>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-black shrink-0"><img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Julian" alt="user" className="w-full h-full object-cover" /></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <MessageSquare size={13} className="text-muted" /> 5
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Doing */}
          <div className="w-[320px] flex flex-col h-full shrink-0">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-headings font-bold text-text text-lg">진행 중</h3>
                <span className="bg-[#EAF0F6] text-primary font-bold text-xs px-2 py-0.5 rounded-full">2</span>
              </div>
              <button className="text-muted hover:text-text"><MoreHorizontal size={20} /></button>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-10 scrollbar-hide">
              {/* Card 1 */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E5E9F0] hover:shadow-soft transition-all cursor-pointer group">
                {/* Cover Image mockup */}
                <div className="w-full h-28 bg-[#1B2A36] rounded-[12px] mb-4 overflow-hidden relative flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=400&q=80" alt="cover" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                   <h3 className="absolute text-[#FDEBD2] font-headings font-extrabold text-2xl rotate-[-2deg] opacity-80 backdrop-blur-sm px-2 py-1 rounded">JAKK<br/>AUTOMATION</h3>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#EAF0F6] text-primary text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-pill">디자인</span>
                </div>
                <h4 className="font-bold text-text text-[15px] leading-snug mb-4 group-hover:text-primary transition-colors">
                  브랜드 아이덴티티 스타일 가이드 초안 v1
                </h4>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-[#222] shrink-0"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted font-medium">
                    <span className="flex items-center gap-1"><MessageSquare size={13} /> 3</span>
                    <span className="flex items-center gap-1"><CheckSquare size={13} /> 4/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Review */}
          <div className="w-[320px] flex flex-col h-full shrink-0">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-headings font-bold text-text text-lg">리뷰</h3>
                <span className="bg-[#EAF0F6] text-primary font-bold text-xs px-2 py-0.5 rounded-full">1</span>
              </div>
              <button className="text-muted hover:text-text"><MoreHorizontal size={20} /></button>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-10 scrollbar-hide">
              {/* Card 1 */}
              <div className="bg-white p-5 rounded-[24px] shadow-soft border-2 border-transparent hover:border-primary transition-all cursor-pointer group relative">
                <div className="absolute right-4 top-4">
                  <span className="bg-[#FFEBEE] text-[#EF476F] text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-md">긴급</span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#FFF5EB] text-secondary text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-pill">카피라이팅</span>
                </div>
                <h4 className="font-bold text-text text-[15px] leading-snug mb-6 group-hover:text-primary transition-colors pr-10">
                  랜딩 페이지 히어로 섹션 카피
                </h4>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-[#1D3557] shrink-0"><img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Emma" alt="user" className="w-full h-full object-cover" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Done */}
          <div className="w-[320px] flex flex-col h-full shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-headings font-bold text-text text-lg">완료</h3>
                <span className="bg-[#F4F7FB] text-muted font-bold text-xs px-2 py-0.5 rounded-full">84</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-10 scrollbar-hide">
               {/* Completed Task Mockup */}
               <div className="bg-[#FBFDFD] p-5 rounded-[24px] shadow-sm border border-[#E5E9F0] cursor-pointer group">
                <div className="flex items-start justify-between mb-2 opacity-70">
                  <span className="bg-[#EEF4ED] text-[#6D8A73] text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-md">그로스</span>
                </div>
                <h4 className="font-bold text-muted text-sm leading-snug mb-3 line-through">
                  Looker Studio 핵심 지표 대시보드 구축
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <CheckCircle2 size={13} className="text-success" /> 10월 20일 완료
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
