import { Search, Bell, History, Video, Phone, MoreHorizontal, Plus, Smile, Send, Sparkles, Check, CheckCheck } from "lucide-react";

export default function MessagesPage() {
  const contacts = [
    { name: "줄리안 카사블랑카스", time: "오전 10:24", message: "3분기 웰니스 프로젝트 프레젠테이션...", seed: "Julian", active: true, unread: true },
    { name: "엘레나 피셔", time: "어제", message: "문서 전송: Brand-Guidelines.pdf", seed: "Elena", active: false, unread: false },
    { name: "아리스 쏜", time: "수요일", message: "금요일 오전으로 회의 일정을 변경합시다...", seed: "Aris", active: false, unread: false },
    { name: "디자인 스프린트 팀", time: "월요일", message: "소피아: 최신 와이어프레임 보신 분...", seed: "Team", active: false, unread: false, isGroup: true },
    { name: "사라 젠킨스", time: "10월 12일", message: "빠르게 처리해주셔서 감사합니다!", seed: "Sarah", active: false, unread: false },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-20 h-screen flex flex-col">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="text-[32px] font-headings font-bold text-text mb-1">메시지</h1>
          {/* Tabs */}
          <div className="flex gap-6 font-medium text-sm border-b border-transparent mt-2">
            <button className="text-primary border-b-2 border-primary pb-1 font-bold">대시보드</button>
            <button className="text-muted hover:text-text transition-colors pb-1">분석</button>
            <button className="text-muted hover:text-text transition-colors pb-1">팀</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="text" 
                placeholder="대화 검색..." 
                className="pl-10 pr-4 py-2.5 w-[280px] bg-white rounded-full text-sm focus:outline-none border border-transparent shadow-sm"
              />
            </div>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-muted hover:text-text hover:shadow-soft transition-all"><Bell size={18} /></button>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-muted hover:text-text hover:shadow-soft transition-all"><History size={18} /></button>
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border-2 border-white shadow-sm cursor-pointer shrink-0">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex gap-8 flex-1 min-h-0">
        
        {/* Left Sidebar (Contacts List) */}
        <div className="w-[340px] bg-white rounded-[32px] p-6 shadow-soft flex flex-col shrink-0 flex-1 lg:flex-none">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-headings font-bold text-text">메시지</h2>
            <span className="bg-[#EAF0F6] text-primary text-xs font-bold px-3 py-1 rounded-pill">새 메시지 12개</span>
          </div>

          {/* Active Contacts Avatars */}
          <div className="flex items-center gap-3 mb-8 px-2 overflow-x-auto scrollbar-hide">
            {[1,2,3,4].map((i) => (
              <div key={i} className="relative shrink-0 cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden shadow-sm bg-[#111]">
                  <img src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${i * 10}`} alt="Active Contact" className="w-full h-full object-cover" />
                </div>
                {i === 1 && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-white rounded-full"></div>}
              </div>
            ))}
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4 scrollbar-hide">
            {contacts.map((contact, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-4 p-4 rounded-[20px] cursor-pointer transition-all ${
                  contact.active 
                    ? 'bg-[#F4F7FB] border-l-4 border-primary' 
                    : 'hover:bg-[#FBFDFD] border border-transparent hover:border-[#E5E9F0]'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-[#222] shrink-0">
                  {contact.isGroup ? (
                    <div className="w-full h-full bg-[#E5E9F0] text-primary flex items-center justify-center font-headings font-bold text-lg">D</div>
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${contact.seed}`} alt={contact.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`font-bold text-sm truncate ${contact.active ? 'text-primary' : 'text-text'}`}>{contact.name}</h4>
                    <span className={`text-[10px] whitespace-nowrap ${contact.active ? 'text-primary font-bold' : 'text-muted'}`}>{contact.time}</span>
                  </div>
                  <p className={`text-xs truncate ${contact.active ? 'text-text font-medium border-none' : 'text-muted'}`}>
                    {contact.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane (Chat Window) */}
        <div className="flex-1 bg-white rounded-[32px] shadow-soft flex flex-col overflow-hidden">
          
          {/* Chat Header */}
          <div className="px-8 py-6 border-b border-[#E5E9F0] flex items-center justify-between bg-white shrink-0 z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm bg-black">
                  <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Julian" alt="Julian" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="font-bold text-lg text-text leading-tight">줄리안 카사블랑카스</h2>
                <span className="text-[10px] font-bold text-success tracking-widest uppercase mt-0.5 inline-block">현재 접속 중</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full border border-[#E5E9F0] text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center bg-white"><Video size={18} /></button>
              <button className="w-10 h-10 rounded-full border border-[#E5E9F0] text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center bg-white"><Phone size={18} /></button>
              <button className="w-10 h-10 rounded-full border border-[#E5E9F0] text-muted hover:text-text transition-colors flex items-center justify-center bg-white ml-2"><MoreHorizontal size={18} /></button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-[#FBFDFD]">
            
            {/* Timestamp */}
            <div className="flex justify-center mb-8">
              <span className="bg-[#F4F7FB] text-muted text-[10px] font-bold px-4 py-1.5 rounded-pill tracking-widest uppercase">오늘</span>
            </div>

            {/* Message Received 1 */}
            <div className="flex items-end gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-black shrink-0">
                <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Julian" alt="Julian" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="bg-white border border-[#E5E9F0] text-text rounded-2xl rounded-bl-sm p-4 shadow-sm text-sm leading-relaxed mb-1">
                  안녕하세요! 워크프레소 '에디토리얼 웰니스' 발표 자료 초안을 업로드했습니다. 4번 슬라이드의 컬러 팔레트 좀 봐주시겠어요?
                </div>
                <span className="text-[10px] text-muted font-medium ml-1">오전 10:12</span>
              </div>
            </div>

            {/* Message Sent 1 */}
            <div className="flex flex-col items-end gap-1.5 max-w-[80%] self-end ml-auto">
              <div className="bg-[#EAF0F6] text-primary rounded-2xl rounded-tr-sm p-4 shadow-sm text-sm leading-relaxed">
                물론이죠! 지금 4번 슬라이드를 보고 있습니다. 아이보리 미스트(#FDFBF7) 베이스가 부드러운 세룰리안 포인트와 아주 잘 어울리네요.
              </div>
            </div>
            
            {/* Message Sent 2 */}
            <div className="flex flex-col items-end gap-1.5 max-w-[80%] self-end ml-auto">
              <div className="bg-[#EAF0F6] text-primary rounded-2xl p-4 shadow-sm text-sm leading-relaxed">
                성공 지표 부분에 세이지(#A1C398) 색상을 좀 더 추가하는 게 좋을까요?
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted font-medium mr-1 mt-0.5">
                오전 10:22 <CheckCheck size={14} className="text-primary" />
              </div>
            </div>

            {/* Smart Highlight AI Card Message Received */}
            <div className="flex items-end gap-3 max-w-[85%] mt-6">
              <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-black shrink-0">
                <img src="https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Julian" alt="Julian" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="bg-white border border-[#E5E9F0] rounded-[24px] rounded-bl-sm p-5 shadow-sm mb-1 relative overflow-hidden group">
                  {/* AI Badge */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary">스마트 하이라이트</span>
                  </div>
                  <p className="text-text text-sm leading-relaxed relative z-10">
                    3분기 웰니스 프로젝트 프레젠테이션 검토 준비가 완료되었습니다. 타이포그래피 계층 구조에 대한 의견이 특히 필요한 부분을 강조해두었습니다.
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-[#A1C398] opacity-50"></div>
                </div>
                <span className="text-[10px] text-muted font-medium ml-1">오전 10:24</span>
              </div>
            </div>

          </div>

          {/* Chat Input */}
          <div className="px-6 py-5 bg-white border-t border-[#E5E9F0] shrink-0">
            <div className="bg-[#FBFDFD] border border-[#E5E9F0] rounded-full flex items-center px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <button className="w-10 h-10 rounded-full text-muted hover:text-primary flex items-center justify-center transition-colors"><Plus size={20} /></button>
              <input 
                type="text" 
                placeholder="상대를 배려하는 메시지를 작성하세요..." 
                className="flex-1 bg-transparent px-3 py-2 text-sm text-text focus:outline-none placeholder:text-muted/70"
              />
              <div className="flex items-center gap-1 px-1">
                <button className="w-10 h-10 rounded-full text-muted hover:text-primary flex items-center justify-center transition-colors"><Smile size={20} /></button>
                <button className="w-10 h-10 bg-[#7FA1C3] hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all shadow-soft group">
                  <Send size={16} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] text-muted font-medium tracking-wide">Enter를 눌러 전송, Shift + Enter로 줄바꿈</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
