import React, { useState } from 'react';
import { Sidebar } from '@/components/lifeos/Sidebar';
import { Header } from '@/components/lifeos/Header';
import { ReflectTab } from '@/components/lifeos/ReflectTab';
import { FocusTab } from '@/components/lifeos/FocusTab';
import { PlanTab } from '@/components/lifeos/PlanTab';
import { TasksTab } from '@/components/lifeos/TasksTab';
import { CalendarTab } from '@/components/lifeos/CalendarTab';
import { Modal } from '@/components/lifeos/Modal';
import { 
  TabType, Task, Project, Habit, ReflectionLog 
} from '@/types/lifeos';
import { 
  INITIAL_TASKS, INITIAL_PROJECTS, INITIAL_HABITS 
} from '@/data/mockData';
import { Construction, Layers } from 'lucide-react';

const LifeOS: React.FC = () => {
  // Core State
  const [activeTab, setActiveTab] = useState<TabType>('REFLECT');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [reflections, setReflections] = useState<ReflectionLog[]>([]);

  // Modal States
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({});

  // Handlers
  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const handleAddHabit = () => {
    if (!newHabitTitle.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newHabitTitle.trim(),
      streak: 0,
      completedDates: []
    };
    setHabits([...habits, newHabit]);
    setNewHabitTitle('');
    setIsHabitModalOpen(false);
  };

  const handleAddTask = () => {
    if (!newTaskData.title?.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      projectId: newTaskData.projectId || projects[0]?.id || '',
      title: newTaskData.title.trim(),
      description: newTaskData.description || '',
      status: 'TODO',
      estimateMinutes: newTaskData.estimateMinutes || 30,
      actualMinutes: 0,
      isFixed: newTaskData.isFixed || false,
      date: newTaskData.date || '',
      order: tasks.length,
      priority: newTaskData.priority || 'medium'
    };
    setTasks([...tasks, newTask]);
    setNewTaskData({});
    setIsAddTaskModalOpen(false);
  };

  // Placeholder for other tabs
  const PlaceholderTab = ({ name }: { name: string }) => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Construction className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {name} - Đang phát triển
        </h2>
        <p className="text-muted-foreground text-sm">
          Tab này sẽ được xây dựng tiếp theo
        </p>
      </div>
    </div>
  );

  // Focus tab is fullscreen
  if (activeTab === 'FOCUS') {
    return (
      <>
        <FocusTab
          tasks={tasks}
          projects={projects}
          setTasks={setTasks}
          onBack={() => setActiveTab('REFLECT')}
          setIsAddTaskModalOpen={setIsAddTaskModalOpen}
          setNewTaskData={setNewTaskData}
        />
        
        {/* Add Task Modal */}
        <Modal 
          isOpen={isAddTaskModalOpen} 
          onClose={() => setIsAddTaskModalOpen(false)} 
          title="Thêm công việc mới"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Tên công việc
              </label>
              <input
                type="text"
                className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                placeholder="VD: Viết báo cáo..."
                value={newTaskData.title || ''}
                onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Mô tả
              </label>
              <textarea
                className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none bg-card"
                rows={2}
                placeholder="Ghi chú thêm..."
                value={newTaskData.description || ''}
                onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Dự án
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <select
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-card"
                    value={newTaskData.projectId || projects[0]?.id}
                    onChange={e => setNewTaskData({ ...newTaskData, projectId: e.target.value })}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Dự kiến (phút)
                </label>
                <input
                  type="number"
                  className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                  value={newTaskData.estimateMinutes || 30}
                  onChange={e => setNewTaskData({ ...newTaskData, estimateMinutes: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <button
              onClick={handleAddTask}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Thêm Task
            </button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Header */}
        <Header activeTab={activeTab} />

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'REFLECT' && (
            <ReflectTab
              tasks={tasks}
              projects={projects}
              habits={habits}
              setHabits={setHabits}
              deleteHabit={deleteHabit}
              reflections={reflections}
              setReflections={setReflections}
              setIsHabitModalOpen={setIsHabitModalOpen}
            />
          )}
          {activeTab === 'PLAN' && (
            <PlanTab
              tasks={tasks}
              projects={projects}
              setTasks={setTasks}
              setIsAddTaskModalOpen={setIsAddTaskModalOpen}
              setNewTaskData={setNewTaskData}
            />
          )}
          {activeTab === 'TASKS' && (
            <TasksTab
              tasks={tasks}
              projects={projects}
              setTasks={setTasks}
              setProjects={setProjects}
              setIsAddTaskModalOpen={setIsAddTaskModalOpen}
              setNewTaskData={setNewTaskData}
            />
          )}
          {activeTab === 'CALENDAR' && (
            <CalendarTab
              tasks={tasks}
              projects={projects}
              setTasks={setTasks}
              setIsAddTaskModalOpen={setIsAddTaskModalOpen}
              setNewTaskData={setNewTaskData}
            />
          )}
        </div>
      </main>

      {/* Add Habit Modal */}
      <Modal 
        isOpen={isHabitModalOpen} 
        onClose={() => setIsHabitModalOpen(false)} 
        title="Thêm thói quen mới"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Tên thói quen
            </label>
            <input
              type="text"
              className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
              placeholder="VD: Uống 2 lít nước..."
              value={newHabitTitle}
              onChange={e => setNewHabitTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
            />
          </div>
          <button
            onClick={handleAddHabit}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Thêm Thói Quen
          </button>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal 
        isOpen={isAddTaskModalOpen} 
        onClose={() => setIsAddTaskModalOpen(false)} 
        title="Thêm công việc mới"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Tên công việc
            </label>
            <input
              type="text"
              className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
              placeholder="VD: Viết báo cáo..."
              value={newTaskData.title || ''}
              onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Mô tả
            </label>
            <textarea
              className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none bg-card"
              rows={2}
              placeholder="Ghi chú thêm..."
              value={newTaskData.description || ''}
              onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Dự án
              </label>
              <select
                className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-card"
                value={newTaskData.projectId || projects[0]?.id}
                onChange={e => setNewTaskData({ ...newTaskData, projectId: e.target.value })}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Dự kiến (phút)
              </label>
              <input
                type="number"
                className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                value={newTaskData.estimateMinutes || 30}
                onChange={e => setNewTaskData({ ...newTaskData, estimateMinutes: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>
          <button
            onClick={handleAddTask}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Thêm Task
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LifeOS;
