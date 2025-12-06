import React from 'react';
import { Brain, AlignLeft, Layers, Target, Calendar, Zap, LogOut } from 'lucide-react';
import { TabType } from '@/types/lifeos';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout?: () => void;
}

const NAV_ITEMS: { id: TabType; icon: React.ElementType; label: string }[] = [
  { id: 'REFLECT', icon: Brain, label: 'Review' },
  { id: 'PLAN', icon: AlignLeft, label: 'Plan' },
  { id: 'TASKS', icon: Layers, label: 'Tasks' },
  { id: 'FOCUS', icon: Target, label: 'Focus' },
  { id: 'CALENDAR', icon: Calendar, label: 'Calendar' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <aside className="w-16 md:w-20 bg-sidebar flex flex-col items-center py-4 md:py-6 gap-4 md:gap-6 z-50 flex-shrink-0 shadow-2xl">
      {/* Logo */}
      <div className="w-9 h-9 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/50 mb-2 md:mb-4">
        <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground fill-current" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 md:gap-4 w-full px-1.5 md:px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon className={`w-5 h-5 md:w-6 md:h-6 mb-0.5 md:mb-1 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
              <span className="text-[8px] md:text-[9px] font-bold tracking-wide uppercase">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Avatar / Logout */}
      <div className="mt-auto flex flex-col items-center gap-3">
        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-2 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/10 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-sidebar-accent/30">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User"
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    </aside>
  );
};
