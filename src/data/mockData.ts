import { Project, Task, Habit, Background } from '@/types/lifeos';

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', title: 'LifeOS Development', area: 'WORK', color: 'text-blue-600', bg: 'bg-blue-100', totalActualHours: 120.5 },
  { id: 'p2', title: 'Marketing Campaign', area: 'WORK', color: 'text-indigo-600', bg: 'bg-indigo-100', totalActualHours: 45.2 },
  { id: 'p3', title: 'Rèn luyện Sức khỏe', area: 'SELF', color: 'text-emerald-600', bg: 'bg-emerald-100', totalActualHours: 80 },
  { id: 'p4', title: 'Gia đình & Kết nối', area: 'RELATIONSHIP', color: 'text-rose-600', bg: 'bg-rose-100', totalActualHours: 30 },
];

export const INITIAL_TASKS: Task[] = [
  { 
    id: 't1', projectId: 'p1', title: 'Daily Scrum Meeting', 
    description: 'Họp tiến độ dự án với team Dev', 
    status: 'DONE', estimateMinutes: 30, actualMinutes: 32, 
    isFixed: true, startTime: '09:00', endTime: '09:30', 
    date: todayStr, order: 0, priority: 'high' 
  },
  { 
    id: 't2', projectId: 'p1', title: 'Deep Work: Coding Core', 
    description: 'Viết module Timer và xử lý logic Drag/Drop', 
    status: 'IN_PROGRESS', estimateMinutes: 120, actualMinutes: 45, 
    isFixed: true, startTime: '14:00', endTime: '16:00', 
    date: todayStr, order: 1, priority: 'high' 
  },
  { 
    id: 't3', projectId: 'p2', title: 'Viết content Facebook', 
    description: 'Lên bài cho chiến dịch tháng 12', 
    status: 'TODO', estimateMinutes: 60, actualMinutes: 0, 
    isFixed: false, date: todayStr, dueTime: '18:00', 
    order: 2, priority: 'medium' 
  },
  { 
    id: 't4', projectId: 'p3', title: 'Mua Whey Protein', 
    status: 'TODO', estimateMinutes: 15, actualMinutes: 0, 
    isFixed: false, date: todayStr, order: 3, priority: 'low' 
  },
  { 
    id: 't5', projectId: 'p3', title: 'Lên kế hoạch năm sau', 
    description: 'Chưa có ngày cụ thể', 
    status: 'TODO', estimateMinutes: 60, actualMinutes: 0, 
    isFixed: false, date: '', order: 4, priority: 'medium' 
  },
];

export const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: 'Chạy bộ 30p', streak: 12, completedDates: [yesterdayStr] },
  { id: 'h2', title: 'Đọc sách 20 trang', streak: 5, completedDates: [yesterdayStr, todayStr] },
  { id: 'h3', title: 'Thiền định 10 phút', streak: 8, completedDates: [yesterdayStr] },
];

export const BACKGROUNDS: Background[] = [
  { id: 'nature', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1948&auto=format&fit=crop', name: 'Rừng Xanh' },
  { id: 'golden', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop', name: 'Nắng Chiều' },
  { id: 'rain', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1974&auto=format&fit=crop', name: 'Mưa Rơi' },
  { id: 'fire', url: 'https://images.unsplash.com/photo-1496334699566-b33a5959ee4d?q=80&w=1974&auto=format&fit=crop', name: 'Bếp Lửa' },
  { id: 'lofi', url: 'https://images.unsplash.com/photo-1593642532400-2682810df593?q=80&w=2069&auto=format&fit=crop', name: 'Góc Lofi' },
  { id: 'minimal', url: 'https://images.unsplash.com/photo-1497294815431-9365093b7331?q=80&w=2070&auto=format&fit=crop', name: 'Tối Giản' },
];

export const getTodayStr = () => new Date().toISOString().split('T')[0];
