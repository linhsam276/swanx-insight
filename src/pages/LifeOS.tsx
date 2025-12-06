import React, { useState } from 'react';
import { Sidebar } from '@/components/lifeos/Sidebar';
import { Header } from '@/components/lifeos/Header';
import { ReflectTab } from '@/components/lifeos/ReflectTab';
import { Modal } from '@/components/lifeos/Modal';
import { 
  TabType, Task, Project, Habit, ReflectionLog 
} from '@/types/lifeos';
import { 
  INITIAL_TASKS, INITIAL_PROJECTS, INITIAL_HABITS 
} from '@/data/mockData';
import { Construction } from 'lucide-react';

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

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Header */}
        <Header activeTab={activeTab} />

        {/* Tab Content */}
        <div className={`flex-1 overflow-hidden ${activeTab === 'FOCUS' ? 'h-screen' : ''}`}>
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
          {activeTab === 'PLAN' && <PlaceholderTab name="Plan" />}
          {activeTab === 'TASKS' && <PlaceholderTab name="Tasks" />}
          {activeTab === 'FOCUS' && <PlaceholderTab name="Focus" />}
          {activeTab === 'CALENDAR' && <PlaceholderTab name="Calendar" />}
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
              className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
    </div>
  );
};

export default LifeOS;
