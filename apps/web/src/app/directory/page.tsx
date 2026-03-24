import { Search, Bell, History, Sparkles, MessageSquare, Coffee, Headphones, Leaf, Zap, ZapOff, CheckCircle2, Users } from "lucide-react";

export default function DirectoryPage() {
  const teammates = [
    { name: "사라 첸", role: "리드 디자이너", state: "집중 모드", stateIcon: "🧘‍♀️", color: "bg-[#FFF5EB]", textClass: "text-secondary", seed: "Sarah", activeClass: "bg-success" },
    { name: "마커스 쏜", role: "제품 개발", state: "자리 비움", stateIcon: "🏃‍♂️", color: "bg-[#FFF5EB]", textClass: "text-secondary", seed: "Marcus", activeClass: "bg-[#FFD166]" },
    { name: "아이샤 바르마", role: "UX 전략가", state: "대화 중", stateIcon: "💬", color: "bg-[#F4F7FB]", textClass: "text-primary", seed: "Aisha", activeClass: "bg-success" },
    { name: "레오 브룩스", role: "콘텐츠 리드", state: "딥 워크", stateIcon: "🌊", color: "bg-[#EEF4ED]", textClass: "text-[#6D8A73]", seed: "Leo", activeClass: "bg-success" },
    { name: "줄리아 오티즈", role: "SEO 마케터", state: "오프라인", stateIcon: "🌙", color: "bg-[#F4F7FB]", textClass: "text-muted", seed: "Julia", activeClass: "bg-muted" },
    { name: "이든 헌트", role: "일러스트레이터", state: "집중 모드", stateIcon: "✍️", color: "bg-[#EAF0F6]", textClass: "text-primary", seed: "Ethan", activeClass: "bg-success" },
    { name: "엘레나 로즈", role: "QA 엔지니어", state: "온라인", stateIcon: "✨", color: "bg-[#EEF4ED]", textClass: "text-primary", seed: "Elena", activeClass: "bg-success" },
    { name: "데이비드 김", role: "운영 매니저", state: "식사 중", stateIcon: "🍲", color: "bg-[#FFF5EB]", textClass: "text-secondary", seed: "David", activeClass: "bg-[#FFD166]" },
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto pb-20">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-headings font-bold text-text mb-1">팀원 목록</h1>
          <p className="text-muted font-medium text-sm">현재 집중 중인 24명의 파트너와 함께하세요</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-muted hover:text-text hover:shadow-soft transition-all"><Bell size={18} /></button>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-muted hover:text-text hover:shadow-soft transition-all"><History size={18} /></button>
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border-2 border-white shadow-sm cursor-pointer">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Global Search Bar */}
      <div className="relative mb-12">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="text-primary" size={20} strokeWidth={2.5} />
        </div>
        <input 
          type="text" 
          placeholder="집중 파트너, 역할, 관심사 검색..." 
          className="w-full pl-16 pr-24 py-5 bg-white rounded-full text-[15px] font-medium text-text focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-soft border border-transparent hover:border-[#E5E9F0] transition-all"
        />
        <div className="absolute inset-y-0 right-6 flex items-center">
          <span className="bg-[#F4F7FB] text-muted text-[10px] font-bold px-3 py-1.5 rounded-md tracking-wider">CMD + K</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        
        {teammates.slice(0, 4).map((user, i) => (
          <div key={user.name} className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E5E9F0] flex flex-col items-center hover:shadow-soft hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative">
            {/* Playful float icon mock */}
            {i === 0 && <Sparkles size={16} className="absolute top-6 right-6 text-[#FFD166] opacity-0 group-hover:opacity-100 transition-opacity" />}
            {i === 1 && <Coffee size={16} className="absolute top-6 right-6 text-[#A1887F] opacity-0 group-hover:opacity-100 transition-opacity" />}
            {i === 2 && <Zap size={16} className="absolute top-6 right-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
            {i === 3 && <Headphones size={16} className="absolute top-6 pr-6 text-text opacity-0 group-hover:opacity-100 transition-opacity" />}

            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-[#1A1A1A]">
                <img src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.seed}`} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-white ${user.activeClass}`}></div>
            </div>
            
            <h3 className="font-headings font-bold text-text text-[17px] mb-1 text-center leading-tight whitespace-break-spaces">{user.name.replace(' ', '\n')}</h3>
            <p className="text-[10px] font-bold text-[#A5B4CB] tracking-widest uppercase text-center mb-5">{user.role}</p>
            
            <div className={`mt-auto px-4 py-1.5 rounded-pill flex items-center gap-2 ${user.color} ${user.textClass} text-xs font-bold`}>
              {user.state} {user.stateIcon}
            </div>
          </div>
        ))}

        {/* Focus Partner Recommendation Card */}
        <div className="bg-[#7FA1C3] rounded-[32px] p-6 text-white shadow-soft flex flex-col justify-between group cursor-pointer hover:bg-opacity-90 transition-all row-span-2">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Sparkles size={24} className="text-white" />
            </div>
            <h3 className="font-headings font-extrabold text-xl leading-tight mb-3">집중 파트너<br/>추천</h3>
            <p className="text-xs text-white/80 font-medium leading-relaxed">
              레오(Leo)님과 15분간 가벼운 커피챗이 가능합니다.
            </p>
          </div>
          <button className="w-full bg-white/20 hover:bg-white hover:text-primary transition-colors text-white font-bold py-3 rounded-pill text-sm backdrop-blur-sm mt-8">
            인사하기
          </button>
        </div>

        {teammates.slice(4).map((user, i) => (
          <div key={user.name} className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E5E9F0] flex flex-col items-center hover:shadow-soft hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-[#1A1A1A]">
                <img src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.seed}`} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-white ${user.activeClass}`}></div>
            </div>
            
            <h3 className="font-headings font-bold text-text text-[17px] mb-1 text-center leading-tight whitespace-break-spaces">{user.name.replace(' ', '\n')}</h3>
            <p className="text-[10px] font-bold text-[#A5B4CB] tracking-widest uppercase text-center mb-5">{user.role}</p>
            
            <div className={`mt-auto px-4 py-1.5 rounded-pill flex items-center gap-2 ${user.color} ${user.textClass} text-xs font-bold`}>
              {user.state} {user.stateIcon}
            </div>
          </div>
        ))}

        {/* Add Teammate Card */}
        <div className="bg-transparent border-2 border-dashed border-[#E5E9F0] rounded-[32px] p-6 flex flex-col items-center justify-center hover:border-primary hover:bg-[#F4F7FB] transition-all cursor-pointer text-muted hover:text-primary group min-h-[260px]">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-[15px] text-center">팀원<br/>초대하기</h3>
        </div>

      </div>
      
      {/* Floating Action Button */}
      <button className="fixed right-10 bottom-10 w-14 h-14 bg-white text-primary rounded-full flex items-center justify-center shadow-float hover:scale-110 transition-all z-10 border border-[#E5E9F0]">
        <MessageSquare size={20} />
      </button>

    </div>
  );
}
