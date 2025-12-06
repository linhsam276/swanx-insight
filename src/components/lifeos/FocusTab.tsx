import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, CloudRain, 
  ImageIcon, Clock, Sidebar, X, Plus, ChevronDown,
  Square, CheckSquare, Layers, ArrowLeft, AlertTriangle,
  PlusCircle, Volume2, VolumeX
} from 'lucide-react';
import { Task, Project, TimerMode } from '@/types/lifeos';
import { BACKGROUNDS, getTodayStr } from '@/data/mockData';

interface FocusTabProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onBack: () => void;
  setIsAddTaskModalOpen: (open: boolean) => void;
  setNewTaskData: (data: Partial<Task>) => void;
}

// Rain sound URL
const RAIN_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3';
const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const FocusTab: React.FC<FocusTabProps> = ({
  tasks, projects, setTasks, onBack,
  setIsAddTaskModalOpen, setNewTaskData
}) => {
  const todayStr = getTodayStr();
  
  // Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>('POMODORO');
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  
  // Task State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // UI State
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  
  // Warning State
  const [showWarning, setShowWarning] = useState(false);
  const [overdueTask, setOverdueTask] = useState<Task | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer Circle Config
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / initialTime;
  const strokeDashoffset = circumference * (1 - progress);
  const angle = (1 - progress) * 2 * Math.PI - Math.PI / 2;
  const knobX = 160 + radius * Math.cos(angle);
  const knobY = 160 + radius * Math.sin(angle);

  // Get active task
  const activeTask = tasks.find(t => t.id === activeTaskId);
  
  // Filter tasks
  const todayTasks = tasks.filter(t => 
    t.date === todayStr && t.status !== 'DONE'
  ).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  
  const otherTasks = tasks.filter(t => 
    t.date !== todayStr && t.status !== 'DONE'
  );

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Audio Functions
  const initAudio = () => {
    if (!rainAudioRef.current) {
      rainAudioRef.current = new Audio(RAIN_SOUND_URL);
      rainAudioRef.current.loop = true;
      rainAudioRef.current.volume = 0.5;
    }
    if (!alarmAudioRef.current) {
      alarmAudioRef.current = new Audio(ALARM_SOUND_URL);
      alarmAudioRef.current.volume = 0.7;
    }
  };

  const toggleRainSound = (play: boolean) => {
    if (!rainAudioRef.current) initAudio();
    if (play && rainAudioRef.current) {
      rainAudioRef.current.play().catch(console.error);
    } else if (rainAudioRef.current) {
      rainAudioRef.current.pause();
    }
  };

  const playAlarm = () => {
    if (!alarmAudioRef.current) initAudio();
    alarmAudioRef.current?.play().catch(console.error);
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            playAlarm();
            
            // Update task actual minutes
            if (activeTaskId && timerMode === 'POMODORO') {
              setTasks(prevTasks => prevTasks.map(t => 
                t.id === activeTaskId 
                  ? { ...t, actualMinutes: t.actualMinutes + Math.floor(initialTime / 60) }
                  : t
              ));
            }
            
            // Auto switch to break
            if (timerMode === 'POMODORO') {
              setTimerMode('SHORT_BREAK');
              setInitialTime(5 * 60);
              return 5 * 60;
            } else {
              setTimerMode('POMODORO');
              setInitialTime(25 * 60);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, activeTaskId, timerMode, initialTime]);

  // Sound Effect
  useEffect(() => {
    if (timerActive && isSoundOn) {
      toggleRainSound(true);
    } else {
      toggleRainSound(false);
    }
    return () => toggleRainSound(false);
  }, [timerActive, isSoundOn]);

  // Drag Handler
  const handleCircleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !timerRef.current) return;
    
    const rect = timerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    
    const newProgress = angle / (2 * Math.PI);
    const newTime = Math.round(newProgress * initialTime);
    setTimeLeft(Math.max(0, Math.min(initialTime, newTime)));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleCircleDrag);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchmove', handleCircleDrag);
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleCircleDrag);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchmove', handleCircleDrag);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging]);

  // Task Handlers
  const handleTaskCheck = (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, status: 'DONE' as const } : t
    ));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const handleEarlyFinish = () => {
    if (!activeTaskId) return;
    const elapsedMins = Math.floor((initialTime - timeLeft) / 60);
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === activeTaskId 
        ? { ...t, status: 'DONE' as const, actualMinutes: t.actualMinutes + elapsedMins }
        : t
    ));
    setActiveTaskId(null);
    setTimerActive(false);
    setTimeLeft(initialTime);
  };

  const checkOverdue = (targetId: string) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return tasks.find(t => 
      t.id !== targetId && t.isFixed && t.status !== 'DONE' && 
      t.date === todayStr && t.startTime && t.startTime <= currentTime
    );
  };

  const confirmSelectTask = (taskId: string) => {
    setTimerActive(false);
    setActiveTaskId(taskId);
    setTimerMode('POMODORO');
    setInitialTime(25 * 60);
    setTimeLeft(25 * 60);
    setIsSidebarOpen(false);
    setShowWarning(false);
  };

  const handleSelectTask = (taskId: string) => {
    const overdue = checkOverdue(taskId);
    if (overdue) {
      setOverdueTask(overdue);
      setPendingTaskId(taskId);
      setShowWarning(true);
    } else {
      confirmSelectTask(taskId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && !target.closest('.controls-container')) {
      setIsDragging(true);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-cover bg-center transition-all duration-700"
      style={{ backgroundImage: `url(${BACKGROUNDS[currentBgIndex].url})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-20">
        <button 
          onClick={onBack}
          className="glass-dark p-2.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="glass-dark px-4 py-2 rounded-full">
          <span className="text-xs font-bold tracking-wider text-white uppercase">
            Zen Focus Mode
          </span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="glass-dark p-2.5 rounded-full hover:bg-white/20 transition-colors md:hidden"
        >
          <Sidebar className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Center Timer */}
      <div 
        ref={timerRef}
        className="absolute inset-0 flex flex-col items-center justify-center z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="relative group cursor-grab active:cursor-grabbing">
          {/* Timer Circle */}
          <svg className="w-[280px] h-[280px] md:w-[320px] md:h-[320px] transform pointer-events-none">
            {/* Background Circle */}
            <circle 
              cx="50%" cy="50%" r={radius} 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="8" 
              fill="transparent" 
            />
            {/* Progress Circle */}
            <circle 
              cx="50%" cy="50%" r={radius}
              stroke="white" 
              strokeWidth="8" 
              fill="transparent"
              transform={`rotate(-90 ${280/2} ${280/2})`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            {/* Knob */}
            <circle 
              cx={knobX} cy={knobY} r="12" 
              fill="white" 
              className="shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto drop-shadow-2xl"
            />
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-5xl md:text-7xl font-mono font-bold text-white tracking-tighter drop-shadow-2xl select-none">
              {formatTime(timeLeft)}
            </div>
            <div className="text-white/60 text-xs md:text-sm font-medium uppercase tracking-widest mt-2">
              {timerMode.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div 
          className="controls-container flex items-center gap-4 md:gap-6 mt-8 md:mt-12 z-50"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Reset */}
          <button 
            onClick={() => { setTimeLeft(initialTime); setTimerActive(false); }}
            className="p-3 md:p-4 rounded-full glass-dark text-white hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button 
            onClick={() => {
              if (!timerActive) initAudio();
              setTimerActive(!timerActive);
              if (!timerActive && isSoundOn) toggleRainSound(true);
            }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-sidebar flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
          >
            {timerActive 
              ? <Pause className="w-6 h-6 fill-current" /> 
              : <Play className="w-6 h-6 fill-current ml-1" />
            }
          </button>

          {/* Skip Mode */}
          <button 
            onClick={() => {
              let nextMode: TimerMode = timerMode === 'POMODORO' ? 'SHORT_BREAK' 
                : timerMode === 'SHORT_BREAK' ? 'LONG_BREAK' : 'POMODORO';
              let nextTime = nextMode === 'POMODORO' ? 25 : nextMode === 'SHORT_BREAK' ? 5 : 15;
              setTimerMode(nextMode);
              setInitialTime(nextTime * 60);
              setTimeLeft(nextTime * 60);
              setTimerActive(false);
            }}
            className="p-3 md:p-4 rounded-full glass-dark text-white hover:bg-white/20 transition-colors"
            title="Next Mode"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Task Indicator */}
      <div 
        className="absolute bottom-28 md:bottom-28 left-4 md:left-8 z-50 w-[calc(100%-2rem)] md:w-auto md:max-w-[280px]"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {activeTask ? (
          <div className="glass-dark rounded-xl p-4 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors flex items-center gap-3">
            <div 
              className="shrink-0"
              onClick={(e) => { e.stopPropagation(); handleEarlyFinish(); }}
            >
              <button className="p-2 bg-success/20 text-success rounded-lg border border-success/50 hover:bg-success hover:text-white transition-all">
                <CheckSquare className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Working on</div>
              <h3 className="text-white font-bold text-sm truncate">{activeTask.title}</h3>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-full py-3 bg-white text-sidebar font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 animate-bounce-subtle"
          >
            <Plus className="w-5 h-5" /> Chọn việc để làm
          </button>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 glass-dark px-4 md:px-6 py-3 rounded-full flex items-center gap-6 md:gap-8 z-20">
        {/* Rain Sound */}
        <button 
          onClick={() => setIsSoundOn(!isSoundOn)}
          className={`flex flex-col items-center gap-1 transition-colors ${isSoundOn ? 'text-success' : 'text-white/60 hover:text-white'}`}
        >
          {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="text-[10px]">Rain</span>
        </button>

        {/* Theme */}
        <div className="relative">
          <button 
            onClick={() => { setShowThemeSettings(!showThemeSettings); setShowTimerSettings(false); }}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px]">Theme</span>
          </button>
          {showThemeSettings && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-dark p-2 rounded-xl flex gap-2 w-max animate-fade-in">
              {BACKGROUNDS.map((bg, idx) => (
                <button 
                  key={bg.id}
                  onClick={() => { setCurrentBgIndex(idx); setShowThemeSettings(false); }}
                  className={`w-10 h-10 rounded-lg bg-cover border-2 transition-all ${
                    idx === currentBgIndex ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'
                  }`}
                  style={{ backgroundImage: `url(${bg.url})` }}
                  title={bg.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timer Settings */}
        <div className="relative">
          <button 
            onClick={() => { setShowTimerSettings(!showTimerSettings); setShowThemeSettings(false); }}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">Time</span>
          </button>
          {showTimerSettings && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-dark p-3 rounded-xl flex flex-col gap-1 w-24 animate-fade-in">
              {[15, 25, 45, 60, 90].map(m => (
                <button 
                  key={m}
                  onClick={() => { 
                    setInitialTime(m * 60); 
                    setTimeLeft(m * 60); 
                    setShowTimerSettings(false); 
                  }}
                  className={`text-white text-xs py-1.5 rounded hover:bg-white/10 transition-colors ${
                    initialTime === m * 60 ? 'bg-white/20 font-bold' : ''
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Toggle (Desktop) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="hidden md:block absolute right-6 top-6 glass-dark p-2.5 rounded-lg hover:bg-white/20 transition-colors z-20"
        >
          <Sidebar className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Task Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs md:w-80 bg-card shadow-2xl z-50 animate-slide-in-right flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-display font-bold text-foreground">Task List</h3>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Task Button */}
            <div className="p-4 pb-0">
              <button 
                onClick={() => { 
                  setNewTaskData({ estimateMinutes: 25, isFixed: false }); 
                  setIsAddTaskModalOpen(true); 
                }}
                className="w-full py-2.5 flex items-center justify-center gap-2 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" /> Thêm công việc mới
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {/* Today Section */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                  Hôm nay
                </h4>
                <div className="space-y-2">
                  {todayTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground/50 italic py-2">
                      Chưa có lịch hôm nay
                    </div>
                  )}
                  {todayTasks.map(t => {
                    const isExpanded = expandedTaskId === t.id;
                    const isActive = activeTaskId === t.id;
                    const project = projects.find(p => p.id === t.projectId);
                    const now = new Date();
                    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    const isOverdue = t.isFixed && t.startTime && t.startTime <= currentTime;
                    
                    return (
                      <div 
                        key={t.id}
                        className={`rounded-xl border transition-all ${
                          isOverdue ? 'bg-warning/10 border-warning/30' 
                          : isActive ? 'bg-primary/10 border-primary/30'
                          : isExpanded ? 'bg-muted border-border shadow-md' 
                          : 'bg-card border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div 
                          onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                          className="p-3 cursor-pointer flex items-start gap-3"
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleTaskCheck(t.id); }}
                            className="mt-0.5 group"
                          >
                            <Square className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${isOverdue ? 'text-warning' : 'text-foreground'}`}>
                              {t.title}
                            </div>
                            {t.startTime && (
                              <div className={`text-[10px] font-mono mt-0.5 ${isOverdue ? 'text-warning font-bold' : 'text-muted-foreground'}`}>
                                {t.startTime}
                              </div>
                            )}
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 flex flex-col gap-2 animate-fade-in">
                            <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-1">
                              <div className="flex items-center gap-1">
                                <Layers className="w-3 h-3" /> {project?.title}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Est: {t.estimateMinutes}m
                              </div>
                            </div>
                            <button 
                              onClick={() => handleSelectTask(t.id)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                isActive 
                                  ? 'bg-success text-success-foreground' 
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              }`}
                            >
                              {isActive ? 'Đang làm' : 'Chọn'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Other Section */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider border-t border-border pt-4">
                  Sắp tới / Khác
                </h4>
                <div className="space-y-2">
                  {otherTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground/50 italic py-2">Trống</div>
                  )}
                  {otherTasks.slice(0, 10).map(t => {
                    const isExpanded = expandedTaskId === t.id;
                    return (
                      <div 
                        key={t.id}
                        className="rounded-xl border bg-card border-border hover:border-muted-foreground/30 transition-colors"
                      >
                        <div 
                          onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                          className="p-3 cursor-pointer flex items-start gap-3"
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleTaskCheck(t.id); }}
                            className="mt-0.5 group"
                          >
                            <Square className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
                          </button>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 flex flex-col gap-2 animate-fade-in">
                            <button 
                              onClick={() => handleSelectTask(t.id)}
                              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1"
                            >
                              Chọn
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="flex items-center gap-2 text-warning mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-display font-bold text-lg">Cảnh báo!</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn có lịch <strong className="text-foreground">{overdueTask?.title}</strong> vào lúc{' '}
              <strong className="text-foreground">{overdueTask?.startTime}</strong> chưa hoàn thành. 
              Bạn có chắc muốn làm việc khác?
            </p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setShowWarning(false); setPendingTaskId(null); setOverdueTask(null); }}
                className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl text-sm font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => pendingTaskId && confirmSelectTask(pendingTaskId)}
                className="px-4 py-2.5 bg-warning text-warning-foreground rounded-xl hover:bg-warning/90 text-sm font-bold transition-colors"
              >
                Vẫn làm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
