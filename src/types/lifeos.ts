export type AreaType = 'WORK' | 'RELATIONSHIP' | 'SELF' | 'ALL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'COMPLETING';
export type TabType = 'REFLECT' | 'PLAN' | 'TASKS' | 'FOCUS' | 'CALENDAR';
export type TimerMode = 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';
export type TaskFilterType = 'ALL' | 'ONGOING' | 'COMPLETED';
export type CalendarViewMode = 'MONTH' | 'WEEK';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  title: string;
  area: Exclude<AreaType, 'ALL'>;
  color: string;
  bg: string;
  totalActualHours: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  estimateMinutes: number;
  actualMinutes: number;
  isFixed: boolean;
  startTime?: string;
  endTime?: string;
  dueTime?: string;
  date: string;
  order: number;
  priority?: PriorityLevel;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[];
}

export interface ReflectionContent {
  wellDone: string;
  kaizen: string;
  observer: string;
  analyzer: string;
}

export interface ReflectionLog {
  id: string;
  date: string;
  content: ReflectionContent;
}

export interface Background {
  id: string;
  url: string;
  name: string;
}
