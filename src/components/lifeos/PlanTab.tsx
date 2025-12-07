import React, { useState, useRef } from 'react';
import { Task, Project } from '@/types/lifeos';
import { 
  Clock, GripVertical, Plus, Calendar, ChevronLeft, ChevronRight,
  Layers, AlertCircle, Check
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PlanTabProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setIsAddTaskModalOpen: (open: boolean) => void;
  setNewTaskData: (data: Partial<Task>) => void;
}

// Timeline hours from 04:00 to 24:00
const TIMELINE_HOURS = Array.from({ length: 21 }, (_, i) => i + 4);
const HOUR_HEIGHT = 60; // pixels per hour

export const PlanTab: React.FC<PlanTabProps> = ({
  tasks,
  projects,
  setTasks,
  setIsAddTaskModalOpen,
  setNewTaskData
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Get tasks for selected date
  const scheduledTasks = tasks.filter(t => t.date === dateStr && t.startTime);
  const flexibleTasks = tasks.filter(t => t.date === dateStr && !t.startTime);
  const unscheduledTasks = tasks.filter(t => !t.date || t.date !== dateStr);

  const getProject = (projectId: string) => projects.find(p => p.id === projectId);

  // Convert time string to hour number
  const timeToHour = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  // Convert hour number to time string
  const hourToTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over timeline
  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop;
    const hour = Math.floor(y / HOUR_HEIGHT) + 4;
    const clampedHour = Math.max(4, Math.min(23, hour));
    setDragOverHour(clampedHour);
  };

  // Handle drop on timeline
  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask || dragOverHour === null) return;

    const startTime = hourToTime(dragOverHour);
    const durationHours = draggedTask.estimateMinutes / 60;
    const endHour = Math.min(24, dragOverHour + durationHours);
    const endTime = hourToTime(endHour);

    setTasks(prev => prev.map(t => 
      t.id === draggedTask.id 
        ? { ...t, date: dateStr, startTime, endTime, isFixed: true }
        : t
    ));

    setDraggedTask(null);
    setDragOverHour(null);
  };

  // Handle drag to flexible area
  const handleFlexibleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask) return;

    setTasks(prev => prev.map(t => 
      t.id === draggedTask.id 
        ? { ...t, date: dateStr, startTime: undefined, endTime: undefined, isFixed: false }
        : t
    ));

    setDraggedTask(null);
  };

  // Remove task from schedule
  const handleRemoveFromSchedule = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, startTime: undefined, endTime: undefined, isFixed: false }
        : t
    ));
  };

  // Toggle task completion
  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' }
        : t
    ));
  };

  // Render scheduled task on timeline
  const renderScheduledTask = (task: Task) => {
    if (!task.startTime) return null;
    
    const startHour = timeToHour(task.startTime);
    const durationHours = task.estimateMinutes / 60;
    const top = (startHour - 4) * HOUR_HEIGHT;
    const height = Math.max(40, durationHours * HOUR_HEIGHT - 4);
    const project = getProject(task.projectId);

    return (
      <div
        key={task.id}
        className="absolute left-16 right-2 rounded-lg p-2 cursor-move group transition-all hover:shadow-lg"
        style={{
          top: `${top}px`,
          height: `${height}px`,
          backgroundColor: project?.bg || 'hsl(var(--muted))',
          borderLeft: `3px solid ${project?.color || 'hsl(var(--primary))'}`
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
      >
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              <span 
                className={`text-xs font-semibold truncate ${task.status === 'DONE' ? 'line-through opacity-60' : ''}`}
                style={{ color: project?.color }}
              >
                {task.title}
              </span>
            </div>
            {height > 50 && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{task.startTime} - {task.endTime}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => toggleTaskStatus(task.id)}
              className={`p-1 rounded-full transition-colors ${
                task.status === 'DONE' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-background/80 hover:bg-green-500 hover:text-white'
              }`}
            >
              <Check className="w-3 h-3" />
            </button>
            <button 
              onClick={() => handleRemoveFromSchedule(task.id)}
              className="p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <AlertCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Task card for unscheduled/flexible tasks
  const TaskCard = ({ task, isDraggable = true }: { task: Task; isDraggable?: boolean }) => {
    const project = getProject(task.projectId);
    
    return (
      <div
        className={`p-3 rounded-xl border border-border bg-card group transition-all hover:shadow-md ${
          isDraggable ? 'cursor-move' : ''
        } ${task.status === 'DONE' ? 'opacity-60' : ''}`}
        draggable={isDraggable}
        onDragStart={(e) => isDraggable && handleDragStart(e, task)}
      >
        <div className="flex items-start gap-2">
          {isDraggable && (
            <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project?.color || 'hsl(var(--primary))' }}
              />
              <span className={`text-sm font-medium truncate ${task.status === 'DONE' ? 'line-through' : ''}`}>
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{task.estimateMinutes} phút</span>
              {project && (
                <>
                  <span>•</span>
                  <span className="truncate">{project.title}</span>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={() => toggleTaskStatus(task.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              task.status === 'DONE' 
                ? 'bg-green-500 text-white' 
                : 'bg-muted hover:bg-green-500 hover:text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Timeline */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Date Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <button 
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-display font-bold">
              {format(selectedDate, 'EEEE, dd/MM', { locale: vi })}
            </span>
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                Hôm nay
              </span>
            )}
          </div>
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-y-auto relative"
          onDragOver={handleTimelineDragOver}
          onDrop={handleTimelineDrop}
          onDragLeave={() => setDragOverHour(null)}
        >
          <div className="relative" style={{ height: `${TIMELINE_HOURS.length * HOUR_HEIGHT}px` }}>
            {/* Hour lines */}
            {TIMELINE_HOURS.map((hour) => (
              <div 
                key={hour}
                className="absolute left-0 right-0 border-t border-border/50"
                style={{ top: `${(hour - 4) * HOUR_HEIGHT}px` }}
              >
                <span className="absolute left-3 -top-2.5 text-xs text-muted-foreground font-medium bg-background px-1">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {/* Current time indicator */}
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
              <div 
                className="absolute left-12 right-0 h-0.5 bg-destructive z-10"
                style={{ 
                  top: `${(new Date().getHours() + new Date().getMinutes() / 60 - 4) * HOUR_HEIGHT}px` 
                }}
              >
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
              </div>
            )}

            {/* Drop indicator */}
            {dragOverHour !== null && (
              <div 
                className="absolute left-14 right-2 h-12 bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none z-20"
                style={{ top: `${(dragOverHour - 4) * HOUR_HEIGHT}px` }}
              />
            )}

            {/* Scheduled tasks */}
            {scheduledTasks.map(renderScheduledTask)}
          </div>
        </div>
      </div>

      {/* Right Panel - Task Lists */}
      <div className="w-full lg:w-80 flex flex-col bg-muted/30 overflow-hidden">
        {/* Flexible Tasks */}
        <div 
          className="flex-1 flex flex-col overflow-hidden border-b border-border"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFlexibleDrop}
        >
          <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
            <h3 className="font-display font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Việc linh hoạt
            </h3>
            <span className="text-xs text-muted-foreground">
              {flexibleTasks.length} việc
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {flexibleTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Kéo thả task vào đây để thêm việc linh hoạt
              </div>
            ) : (
              flexibleTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>

        {/* Unscheduled Tasks */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
            <h3 className="font-display font-bold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Chưa lên lịch
            </h3>
            <button 
              onClick={() => {
                setNewTaskData({ date: dateStr });
                setIsAddTaskModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {unscheduledTasks.filter(t => t.status !== 'DONE').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Tất cả công việc đã được lên lịch
              </div>
            ) : (
              unscheduledTasks
                .filter(t => t.status !== 'DONE')
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
