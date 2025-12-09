import React, { useState, useRef } from 'react';
import { Task, Project, AreaType } from '@/types/lifeos';
import { 
  Clock, GripVertical, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  List, Flag, Check, X
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskDetailModal } from './TaskDetailModal';

interface PlanTabProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setIsAddTaskModalOpen: (open: boolean) => void;
  setNewTaskData: (data: Partial<Task>) => void;
}

// Timeline hours from 04:00 to 24:00
const TIMELINE_HOURS = Array.from({ length: 20 }, (_, i) => i + 4);
const HOUR_HEIGHT = 48; // pixels per hour

export const PlanTab: React.FC<PlanTabProps> = ({
  tasks,
  projects,
  setTasks,
  setIsAddTaskModalOpen,
  setNewTaskData
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [areaFilter, setAreaFilter] = useState<AreaType>('ALL');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Filter projects by area
  const filteredProjects = projects.filter(p => {
    if (areaFilter === 'ALL') return true;
    return p.area === areaFilter;
  });

  // Get tasks for selected date
  const scheduledTasks = tasks.filter(t => t.date === dateStr && t.startTime);
  const flexibleTasks = tasks.filter(t => t.date === dateStr && !t.startTime);
  
  // Get unscheduled tasks (not for today) grouped by project
  const unscheduledTasks = tasks.filter(t => 
    (!t.date || t.date !== dateStr) && t.status !== 'DONE'
  );

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
        ? { ...t, date: '', startTime: undefined, endTime: undefined, isFixed: false }
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

  // Render scheduled task on timeline
  const renderScheduledTask = (task: Task) => {
    if (!task.startTime) return null;
    
    const startHour = timeToHour(task.startTime);
    const durationHours = task.estimateMinutes / 60;
    const top = (startHour - 4) * HOUR_HEIGHT;
    const height = Math.max(36, durationHours * HOUR_HEIGHT - 2);
    const project = getProject(task.projectId);

    return (
      <div
        key={task.id}
        className="absolute left-12 right-1 rounded-lg p-2 cursor-pointer group transition-all hover:shadow-lg border"
        style={{
          top: `${top}px`,
          height: `${height}px`,
          backgroundColor: project?.bg || 'hsl(var(--muted))',
          borderColor: project?.color || 'hsl(var(--border))'
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => setSelectedTaskForDetail(task)}
      >
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span 
                className={`text-xs font-semibold truncate ${task.status === 'DONE' ? 'line-through opacity-60' : ''}`}
                style={{ color: project?.color?.replace('text-', '') }}
              >
                {task.title}
              </span>
            </div>
            {height > 40 && (
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {task.startTime}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRemoveFromSchedule(task.id); }}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-background/50 transition-all"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  };

  // Task card for left panel (by project)
  const ProjectTaskCard = ({ task }: { task: Task }) => {
    const project = getProject(task.projectId);
    
    return (
      <div
        className="p-2.5 rounded-lg bg-card border border-border group cursor-pointer hover:shadow-md transition-all"
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => setSelectedTaskForDetail(task)}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-0.5 opacity-50 group-hover:opacity-100" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate">{task.title}</span>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {task.estimateMinutes}m
              </span>
              {task.dueTime && (
                <span className="flex items-center gap-0.5">
                  <Flag className="w-2.5 h-2.5" />
                  {task.dueTime}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Flexible task card
  const FlexibleTaskCard = ({ task }: { task: Task }) => {
    const project = getProject(task.projectId);
    
    return (
      <div
        className="p-2.5 rounded-lg border border-border group cursor-pointer hover:shadow-md transition-all"
        style={{ backgroundColor: project?.bg || 'hsl(var(--card))' }}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => setSelectedTaskForDetail(task)}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-0.5 opacity-50 group-hover:opacity-100" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate">{task.title}</span>
            {task.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">- {task.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {task.estimateMinutes}m
              </span>
              {task.dueTime && (
                <span className="flex items-center gap-0.5">
                  <Flag className="w-2.5 h-2.5" />
                  {task.dueTime}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
            className="p-1 rounded hover:bg-background/50 transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-muted-foreground hover:text-green-500" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Tasks by Project */}
      <div className="w-full lg:w-64 flex flex-col border-r border-border bg-muted/30 overflow-hidden">
        {/* Area Filter */}
        <div className="p-3 border-b border-border">
          <div className="flex flex-wrap gap-1">
            {(['ALL', 'WORK', 'RELATIONSHIP', 'SELF'] as AreaType[]).map(area => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  areaFilter === area 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Projects with Tasks */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredProjects.map(project => {
            const projectTasks = unscheduledTasks.filter(t => t.projectId === project.id);
            if (projectTasks.length === 0) return null;
            
            return (
              <div key={project.id}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-sm font-bold ${project.color}`}>{project.title}</h4>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {projectTasks.length} tasks
                  </span>
                </div>
                <div className="space-y-1.5">
                  {projectTasks.map(task => (
                    <ProjectTaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredProjects.every(p => unscheduledTasks.filter(t => t.projectId === p.id).length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Không có task chưa lên lịch
            </div>
          )}
        </div>
      </div>

      {/* Center Panel - Timeline */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Date Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <button 
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm">
              {format(selectedDate, 'EEEE, dd/MM', { locale: vi })}
            </span>
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                Hôm nay
              </span>
            )}
          </div>
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Header */}
        <div className="px-4 py-2 border-b border-border bg-muted/50">
          <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            Lịch trình (04:00 - 24:00)
          </h3>
        </div>

        {/* Timeline */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-y-auto relative bg-background"
          onDragOver={handleTimelineDragOver}
          onDrop={handleTimelineDrop}
          onDragLeave={() => setDragOverHour(null)}
        >
          <div className="relative" style={{ height: `${TIMELINE_HOURS.length * HOUR_HEIGHT}px` }}>
            {/* Hour lines */}
            {TIMELINE_HOURS.map((hour) => (
              <div 
                key={hour}
                className="absolute left-0 right-0 border-t border-border/40 hover:bg-muted/30 transition-colors"
                style={{ top: `${(hour - 4) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute left-2 top-1 text-[10px] text-muted-foreground font-medium">
                  {hour}:00
                </span>
              </div>
            ))}

            {/* Current time indicator */}
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
              <div 
                className="absolute left-10 right-0 h-0.5 bg-red-500 z-10"
                style={{ 
                  top: `${(new Date().getHours() + new Date().getMinutes() / 60 - 4) * HOUR_HEIGHT}px` 
                }}
              >
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}

            {/* Drop indicator */}
            {dragOverHour !== null && (
              <div 
                className="absolute left-10 right-1 h-10 bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none z-20 flex items-center justify-center"
                style={{ top: `${(dragOverHour - 4) * HOUR_HEIGHT}px` }}
              >
                <span className="text-xs font-semibold text-primary">{dragOverHour}:00</span>
              </div>
            )}

            {/* Scheduled tasks */}
            {scheduledTasks.map(renderScheduledTask)}
          </div>
        </div>
      </div>

      {/* Right Panel - Flexible Tasks */}
      <div 
        className="w-full lg:w-72 flex flex-col border-l border-border bg-muted/30 overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFlexibleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/50">
          <h3 className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <List className="w-3.5 h-3.5" />
            Việc linh hoạt (Trong ngày)
          </h3>
          <button 
            onClick={() => {
              setNewTaskData({ date: dateStr });
              setIsAddTaskModalOpen(true);
            }}
            className="p-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Flexible Tasks List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {flexibleTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs border-2 border-dashed border-border rounded-lg">
              Kéo thả việc từ danh sách bên trái vào đây
            </div>
          ) : (
            flexibleTasks.map(task => (
              <FlexibleTaskCard key={task.id} task={task} />
            ))
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
