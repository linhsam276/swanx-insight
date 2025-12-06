import React, { useState } from 'react';
import { 
  Clock, Activity, PieChart, Flame, ChevronLeft, ChevronRight, 
  Plus, X, CheckSquare, Edit3, RotateCcw, Target, Save
} from 'lucide-react';
import { Task, Project, Habit, ReflectionLog, ReflectionContent } from '@/types/lifeos';
import { getTodayStr } from '@/data/mockData';

interface ReflectTabProps {
  tasks: Task[];
  projects: Project[];
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  deleteHabit: (id: string) => void;
  reflections: ReflectionLog[];
  setReflections: React.Dispatch<React.SetStateAction<ReflectionLog[]>>;
  setIsHabitModalOpen: (open: boolean) => void;
}

const getDaysArray = (y: number, m: number) => {
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const days: (number | null)[] = [];
  let startDay = firstDay.getDay() - 1;
  if (startDay === -1) startDay = 6;
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
  return days;
};

export const ReflectTab: React.FC<ReflectTabProps> = ({
  tasks, projects, habits, setHabits, deleteHabit, 
  reflections, setReflections, setIsHabitModalOpen
}) => {
  const todayStr = getTodayStr();
  const [currentReviewDate, setCurrentReviewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reflectionForm, setReflectionForm] = useState<ReflectionContent>({
    wellDone: '', kaizen: '', observer: '', analyzer: ''
  });
  const [isHabitEditMode, setIsHabitEditMode] = useState(false);

  // Stats calculations
  const totalTask = tasks.length;
  const completed = tasks.filter(t => t.status === 'DONE').length;
  const percent = totalTask > 0 ? Math.round((completed / totalTask) * 100) : 0;
  
  const workTimeTodayMins = tasks
    .filter(t => t.date === todayStr)
    .reduce((acc, t) => acc + t.actualMinutes, 0);
  const workTimeTodayHrs = (workTimeTodayMins / 60).toFixed(1);

  // Heatmap data
  const heatmapData: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.status === 'DONE') {
      heatmapData[t.date] = (heatmapData[t.date] || 0) + 1;
    }
  });

  const heatmapGrid = Array.from({ length: 84 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = heatmapData[dateStr] || 0;
    let color = 'bg-muted';
    if (count > 0) color = 'bg-success/30';
    if (count > 2) color = 'bg-success/60';
    if (count > 5) color = 'bg-success';
    return { date: dateStr, color, count };
  });

  const toggleHabit = (habitId: string) => {
    if (isHabitEditMode) return;
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const isDone = h.completedDates.includes(todayStr);
      const newDates = isDone 
        ? h.completedDates.filter(d => d !== todayStr)
        : [...h.completedDates, todayStr];
      return { ...h, completedDates: newDates };
    }));
  };

  const updateHabitTitle = (habitId: string, newTitle: string) => {
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, title: newTitle } : h
    ));
  };

  const year = currentReviewDate.getFullYear();
  const month = currentReviewDate.getMonth();
  const calendarDays = getDaysArray(year, month);

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(dateStr);
    const existing = reflections.find(r => r.date === dateStr);
    setReflectionForm(existing?.content || { wellDone: '', kaizen: '', observer: '', analyzer: '' });
  };

  const saveReflection = () => {
    const newLog: ReflectionLog = {
      id: Date.now().toString(),
      date: selectedDate,
      content: reflectionForm
    };
    setReflections(prev => [...prev.filter(r => r.date !== selectedDate), newLog]);
  };

  const habitsDoneCount = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const habitsProgress = habits.length > 0 ? Math.round((habitsDoneCount / habits.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 md:gap-6 p-4 md:p-6 animate-fade-in overflow-hidden">
      {/* LEFT COLUMN: STATS */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-6 lg:h-full lg:overflow-y-auto lg:pr-2 scrollbar-thin">
        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 shrink-0">
          <div className="card-stat-dark flex flex-col justify-between min-h-[100px] md:h-32">
            <div className="flex items-center gap-2 text-sidebar-muted text-[10px] md:text-xs font-bold uppercase mb-2">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              Work Time
            </div>
            <div className="text-2xl md:text-3xl font-display font-bold text-sidebar-foreground">
              {workTimeTodayHrs}
              <span className="text-sm text-sidebar-muted font-normal ml-1">h</span>
            </div>
          </div>
          
          <div className="card-stat flex flex-col justify-between min-h-[100px] md:h-32">
            <div className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase mb-2">
              Completion
            </div>
            <div className="text-2xl md:text-3xl font-display font-bold text-success">
              {percent}%
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-auto">
              <div 
                className="bg-success h-full transition-all duration-500" 
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Project Time */}
        <div className="card-stat flex flex-col min-h-[180px] md:min-h-[200px] shrink-0">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center text-sm">
            <PieChart className="w-4 h-4 mr-2 text-primary" />
            Project Time
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {projects.map(p => {
              const projectColor = p.color.includes('blue') ? 'bg-area-work' 
                : p.color.includes('emerald') ? 'bg-success' 
                : p.color.includes('rose') ? 'bg-area-relationship'
                : 'bg-primary';
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-foreground truncate max-w-[150px]">{p.title}</span>
                    <span className="text-muted-foreground">{p.totalActualHours.toFixed(1)}h</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${projectColor} transition-all duration-500`} 
                      style={{ width: `${Math.min(p.totalActualHours, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heatmap */}
        <div className="card-stat flex flex-col shrink-0">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center text-sm">
            <Activity className="w-4 h-4 mr-2 text-primary" />
            Productivity Heatmap
          </h3>
          <div className="flex gap-0.5 flex-wrap content-start">
            {heatmapGrid.map((cell, i) => (
              <div 
                key={i} 
                className={`heatmap-cell ${cell.color}`} 
                title={`${cell.date}: ${cell.count} completed`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-success/30" />
              <div className="w-3 h-3 rounded-sm bg-success/60" />
              <div className="w-3 h-3 rounded-sm bg-success" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-6 lg:h-full lg:overflow-y-auto lg:pr-2 scrollbar-thin">
        {/* Calendar + Habits Row */}
        <div className="flex flex-col md:flex-row gap-4 shrink-0">
          {/* Mini Calendar */}
          <div className="flex-1 card-stat flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <button 
                onClick={() => setCurrentReviewDate(new Date(year, month - 1))} 
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="font-display font-bold text-sm text-foreground">
                {currentReviewDate.toLocaleString('vi-VN', { month: 'short', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentReviewDate(new Date(year, month + 1))} 
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-[9px] font-bold text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasReflection = reflections.some(r => r.date === dateStr);
                
                return (
                  <button
                    key={i}
                    onClick={() => handleDateClick(day)}
                    className={`
                      w-7 h-7 md:w-8 md:h-8 text-xs rounded-lg font-medium transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${isToday && !isSelected ? 'bg-accent/20 text-accent font-bold' : ''}
                      ${!isSelected && !isToday ? 'hover:bg-muted text-foreground' : ''}
                      ${hasReflection && !isSelected ? 'ring-2 ring-warning/50' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habits */}
          <div className="flex-1 card-stat flex flex-col max-h-[250px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-bold text-foreground flex items-center text-sm">
                <Flame className="w-4 h-4 mr-2 text-warning" />
                Habits
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHabitEditMode(!isHabitEditMode)}
                  className={`p-1.5 rounded-lg transition-colors ${isHabitEditMode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsHabitModalOpen(true)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{habitsDoneCount}/{habits.length} hoàn thành</span>
                <span>{habitsProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all duration-500" 
                  style={{ width: `${habitsProgress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
              {habits.map(h => {
                const isDone = h.completedDates.includes(todayStr);
                return (
                  <div 
                    key={h.id} 
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/50 group hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isHabitEditMode ? (
                        <input
                          type="text"
                          className="flex-1 bg-transparent border-b border-border text-sm font-medium focus:outline-none focus:border-primary"
                          value={h.title}
                          onChange={e => updateHabitTitle(h.id, e.target.value)}
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => toggleHabit(h.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isDone 
                                ? 'bg-success border-success text-success-foreground' 
                                : 'border-border bg-card hover:border-success'
                            }`}
                          >
                            {isDone && <CheckSquare className="w-3 h-3" />}
                          </button>
                          <span className={`text-sm truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {h.title}
                          </span>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteHabit(h.id)} 
                      className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reflection Journal */}
        <div className="flex-1 card-stat flex flex-col min-h-[280px]">
          <h2 className="text-sm font-display font-bold text-foreground mb-3 flex justify-between items-center">
            <span>
              Nhật ký {selectedDate.split('-').reverse().join('/')}
            </span>
            <button 
              onClick={saveReflection}
              className="text-xs bg-warning text-warning-foreground px-3 py-1.5 rounded-lg hover:bg-warning/90 transition-colors flex items-center gap-1 font-semibold"
            >
              <Save className="w-3 h-3" /> Lưu
            </button>
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
            {/* Kaizen Section */}
            <div className="bg-warning/10 p-4 rounded-xl border border-warning/20">
              <h3 className="font-display font-bold text-warning mb-3 flex items-center text-xs">
                <RotateCcw className="w-3 h-3 mr-1.5" /> KAIZEN
              </h3>
              <textarea
                className="w-full p-2.5 bg-card rounded-lg text-xs mb-2 border border-border focus:ring-2 focus:ring-warning/30 focus:border-warning resize-none"
                rows={2}
                placeholder="3 điều làm tốt hôm nay..."
                value={reflectionForm.wellDone}
                onChange={e => setReflectionForm({ ...reflectionForm, wellDone: e.target.value })}
              />
              <textarea
                className="w-full p-2.5 bg-card rounded-lg text-xs border border-border focus:ring-2 focus:ring-warning/30 focus:border-warning resize-none"
                rows={2}
                placeholder="1 điều cần cải thiện..."
                value={reflectionForm.kaizen}
                onChange={e => setReflectionForm({ ...reflectionForm, kaizen: e.target.value })}
              />
            </div>

            {/* Plan Section */}
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
              <h3 className="font-display font-bold text-primary mb-3 flex items-center text-xs">
                <Target className="w-3 h-3 mr-1.5" /> PLAN
              </h3>
              <textarea
                className="w-full p-2.5 bg-card rounded-lg text-xs mb-2 border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                rows={2}
                placeholder="Quan sát hôm nay..."
                value={reflectionForm.observer}
                onChange={e => setReflectionForm({ ...reflectionForm, observer: e.target.value })}
              />
              <textarea
                className="w-full p-2.5 bg-card rounded-lg text-xs border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                rows={2}
                placeholder="Phân tích & kế hoạch..."
                value={reflectionForm.analyzer}
                onChange={e => setReflectionForm({ ...reflectionForm, analyzer: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
