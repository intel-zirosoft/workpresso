'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, MessageSquare, Users, CheckCircle2, 
  Settings, Plus, HelpCircle, LogOut, Coffee
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: '대시보드', href: '/', icon: Calendar },
    { name: '메시지', href: '/messages', icon: MessageSquare },
    { name: '팀원 목록', href: '/directory', icon: Users },
    { name: '작업', href: '/tasks', icon: CheckCircle2 },
  ];

  return (
    <div className="w-[260px] h-screen bg-surface flex flex-col pt-8 pb-6 px-4 border-r border-[#E5E9F0]">
      {/* Logo Area */}
      <div className="mb-10 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-[12px] text-primary shadow-sm bg-gradient-to-br from-white to-[#F4F7FB] border border-[#E5E9F0]">
            <Coffee size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-headings text-text font-extrabold tracking-tight">WorkPresso</h1>
        </div>
        <p className="text-[10px] text-muted tracking-widest mt-3 font-bold px-1">온전히 집중하는 업무 공간</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all ${
                isActive 
                  ? 'bg-[#EEF4ED] text-primary shadow-sm' 
                  : 'text-text hover:bg-[#F4F7FB] hover:text-primary'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-primary' : 'text-muted'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-4 pt-4 border-t border-transparent">
        <button className="w-full flex items-center justify-center gap-2 bg-[#7FA1C3] hover:bg-opacity-90 text-white py-3.5 rounded-pill font-bold shadow-soft hover:shadow-float transition-all mb-4">
          <Plus size={18} />
          새로운 작업
        </button>
        <div className="space-y-1 px-4 pt-4 border-t border-[#E5E9F0]">
          <button className="flex items-center gap-3 text-sm font-medium text-text hover:text-primary transition-colors py-2">
            <Settings size={18} className="text-muted" />
            환경설정
          </button>
          <button className="flex items-center gap-3 text-sm font-medium text-text hover:text-primary transition-colors py-2">
            <HelpCircle size={18} className="text-muted" />
            도움말
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

