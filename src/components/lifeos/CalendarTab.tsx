import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, 
  Calendar as CalendarIcon, LayoutGrid, Rows3, Check
} from 'lucide-react';
import { Task, Project, CalendarViewMode, AreaType } from '@/types/lifeos';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskDetailModal } from './TaskDetailModal';

interface CalendarTabProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setIsAddTaskModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTaskData: React.Dispatch<React.SetStateAction<Partial<Task>>>;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const AREA_FILTERS: { id: AreaType; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'WORK', label: 'Công việc' },
  { id: 'RELATIONSHIP', label: 'Quan hệ' },
  { id: 'SELF', label: 'Bản thân' }
];

export const CalendarTab: React.FC<CalendarTabProps> = ({
  tasks,
  projects,
  setTasks,
  setIsAddTaskModalOpen,
  setNewTaskData
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH');
  const [areaFilter, setAreaFilter] = useState<AreaType>('ALL');
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  // Get project by ID
  const getProject = (projectId: string) => projects.find(p => p.id === projectId);

  // Filter tasks by area
  const filteredTasks = useMemo(() => {
    if (areaFilter === 'ALL') return tasks;
    return tasks.filter(task => {
      const project = getProject(task.projectId);
      return project?.area === areaFilter;
    });
  }, [tasks, areaFilter, projects]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredTasks.filter(t => t.date === dateStr);
  };

  // Month view days
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Tasks for selected date
  const selectedDateTasks = getTasksForDate(selectedDate);

  // Handle add task for date
  const handleAddTask = (date: Date) => {
    setNewTaskData({ date: format(date, 'yyyy-MM-dd') });
    setIsAddTaskModalOpen(true);
  };

  // Update task
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTaskForDetail(null);
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' }
        : t
    ));
  };

  // Render calendar day cell
  const renderDayCell = (day: Date, isWeekView: boolean = false) => {
    const dayTasks = getTasksForDate(day);
    const isSelected = isSameDay(day, selectedDate);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const today = isToday(day);

    return (
      <div
        key={day.toISOString()}
        onClick={() => setSelectedDate(day)}
        className={`
          ${isWeekView ? 'min-h-[150px]' : 'min-h-[100px]'} 
          p-2 border-r border-b border-border/50 cursor-pointer transition-all duration-200
          ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}
          ${!isCurrentMonth && viewMode === 'MONTH' ? 'opacity-40' : ''}
        `}
      >
        {/* Date Number */}
        <div className="flex items-center justify-between mb-1">
          <span className={`
            w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
            ${today ? 'bg-primary text-primary-foreground' : ''}
            ${isSelected && !today ? 'bg-muted text-foreground' : ''}
          `}>
            {format(day, 'd')}
          </span>
          {dayTasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {dayTasks.length} việc
            </span>
          )}
        </div>

        {/* Tasks Preview */}
        <div className="space-y-1">
          {dayTasks.slice(0, isWeekView ? 4 : 2).map(task => {
            const project = getProject(task.projectId);
            return (
              <div
                key={task.id}
                className={`text-[10px] px-1.5 py-0.5 rounded truncate ${project?.bg || 'bg-muted'} ${project?.color || 'text-foreground'}`}
              >
                {task.title}
              </div>
            );
          })}
          {dayTasks.length > (isWeekView ? 4 : 2) && (
            <div className="text-[10px] text-muted-foreground pl-1">
              +{dayTasks.length - (isWeekView ? 4 : 2)} việc khác
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Mini Calendar & Selected Date Tasks */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-card/50">
        {/* Mini Calendar */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm">
              {format(currentDate, 'MMMM yyyy', { locale: vi })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-[10px] font-medium text-muted-foreground text-center py-1">
                {day}
              </div>
            ))}
            {monthDays.map(day => {
              const dayTasks = getTasksForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square flex items-center justify-center text-[11px] rounded-full relative
                    transition-all duration-200
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${today ? 'bg-primary text-primary-foreground font-bold' : ''}
                    ${isSelected && !today ? 'bg-muted font-medium' : ''}
                    ${!today && !isSelected ? 'hover:bg-muted/50' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {dayTasks.length > 0 && !today && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Area Filter */}
        <div className="p-3 border-b border-border/50">
          <div className="flex flex-wrap gap-1.5">
            {AREA_FILTERS.map(area => (
              <button
                key={area.id}
                onClick={() => setAreaFilter(area.id)}
                className={`
                  px-2.5 py-1 text-xs rounded-full font-medium transition-all duration-200
                  ${areaFilter === area.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                `}
              >
                {area.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-display font-bold text-sm">
                {format(selectedDate, 'EEEE', { locale: vi })}
              </h4>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, 'dd/MM/yyyy')}
              </p>
            </div>
            <button
              onClick={() => handleAddTask(selectedDate)}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Không có công việc</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateTasks.map(task => {
                const project = getProject(task.projectId);
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer ${
                      task.status === 'DONE' ? 'opacity-60' : ''
                    }`}
                    onClick={() => setSelectedTaskForDetail(task)}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(task.id);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          task.status === 'DONE'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {task.status === 'DONE' && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${project?.bg || 'bg-muted'} ${project?.color || ''}`}>
                            {project?.title || 'Dự án'}
                          </span>
                          {task.startTime && task.endTime && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {task.startTime} - {task.endTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-lg">
              {viewMode === 'MONTH' 
                ? format(currentDate, 'MMMM yyyy', { locale: vi })
                : `Tuần ${format(currentDate, 'w')} - ${format(currentDate, 'MMMM yyyy', { locale: vi })}`
              }
            </h2>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('MONTH')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'MONTH' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('WEEK')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'WEEK' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Rows3 className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-muted/30 sticky top-0 z-10">
            {WEEKDAYS.map((day, idx) => (
              <div 
                key={day} 
                className={`py-3 text-center text-xs font-semibold text-muted-foreground border-r border-b border-border/50
                  ${idx === 0 ? 'text-danger' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          {viewMode === 'MONTH' ? (
            <div className="grid grid-cols-7">
              {monthDays.map(day => renderDayCell(day, false))}
            </div>
          ) : (
            <div className="grid grid-cols-7 h-full">
              {weekDays.map(day => renderDayCell(day, true))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskForDetail}
        projects={projects}
        onClose={() => setSelectedTaskForDetail(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onToggleStatus={toggleTaskStatus}
      />
    </div>
  );
};
