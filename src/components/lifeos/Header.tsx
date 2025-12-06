import React from 'react';
import { TabType } from '@/types/lifeos';

interface HeaderProps {
  activeTab: TabType;
}

const TAB_TITLES: Record<Exclude<TabType, 'FOCUS'>, string> = {
  REFLECT: 'Review & Dashboard',
  PLAN: 'Daily Planning',
  TASKS: 'Task Management',
  CALENDAR: 'Schedule',
};

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  if (activeTab === 'FOCUS') return null;

  return (
    <header className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between bg-card border-b border-border flex-shrink-0 z-40">
      <h1 className="text-base md:text-lg font-display font-bold text-foreground tracking-tight">
        {TAB_TITLES[activeTab as Exclude<TabType, 'FOCUS'>]}
      </h1>
      <div className="px-3 py-1.5 bg-muted rounded-full text-xs font-semibold text-muted-foreground">
        {new Date().toLocaleDateString('vi-VN', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })}
      </div>
    </header>
  );
};
