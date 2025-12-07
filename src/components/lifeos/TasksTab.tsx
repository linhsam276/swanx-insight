import React, { useState } from 'react';
import { Task, Project, TaskFilterType, AreaType } from '@/types/lifeos';
import { 
  Clock, Plus, FolderPlus, Pencil, Check, X, Trash2,
  Flag, Layers, ChevronDown, ChevronRight
} from 'lucide-react';
import { Modal } from './Modal';

interface TasksTabProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setIsAddTaskModalOpen: (open: boolean) => void;
  setNewTaskData: (data: Partial<Task>) => void;
}

const AREA_COLORS: Record<Exclude<AreaType, 'ALL'>, { color: string; bg: string }> = {
  WORK: { color: 'text-blue-600', bg: 'bg-blue-100' },
  RELATIONSHIP: { color: 'text-rose-600', bg: 'bg-rose-100' },
  SELF: { color: 'text-emerald-600', bg: 'bg-emerald-100' }
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200'
};

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  projects,
  setTasks,
  setProjects,
  setIsAddTaskModalOpen,
  setNewTaskData
}) => {
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('ONGOING');
  const [areaFilter, setAreaFilter] = useState<AreaType>('ALL');
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  
  // Form states
  const [newProjectData, setNewProjectData] = useState<Partial<Project>>({
    title: '',
    area: 'WORK'
  });

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'ONGOING' && t.status === 'DONE') return false;
    if (taskFilter === 'COMPLETED' && t.status !== 'DONE') return false;
    return true;
  });

  // Filter projects by area
  const filteredProjects = projects.filter(p => {
    if (areaFilter === 'ALL') return true;
    return p.area === areaFilter;
  });

  // Group tasks by project
  const groupedByProject = filteredProjects.map(project => ({
    ...project,
    tasks: filteredTasks.filter(t => t.projectId === project.id)
  })).filter(group => group.tasks.length > 0 || taskFilter === 'ONGOING');

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' }
        : t
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTaskForEdit(null);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));
  };

  const handleAddProject = () => {
    if (!newProjectData.title?.trim()) return;
    const area = newProjectData.area || 'WORK';
    const areaStyle = AREA_COLORS[area];
    
    const newProject: Project = {
      id: Date.now().toString(),
      title: newProjectData.title.trim(),
      area,
      color: areaStyle.color,
      bg: areaStyle.bg,
      totalActualHours: 0
    };
    
    setProjects([...projects, newProject]);
    setNewProjectData({ title: '', area: 'WORK' });
    setIsAddProjectModalOpen(false);
  };

  const handleUpdateProject = () => {
    if (!editingProject || !editingProject.title?.trim()) return;
    const areaStyle = AREA_COLORS[editingProject.area];
    
    setProjects(prev => prev.map(p => 
      p.id === editingProject.id 
        ? { ...editingProject, color: areaStyle.color, bg: areaStyle.bg }
        : p
    ));
    setIsEditProjectModalOpen(false);
    setEditingProject(null);
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    setIsEditProjectModalOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {(['ONGOING', 'COMPLETED', 'ALL'] as TaskFilterType[]).map(filter => (
            <button
              key={filter}
              onClick={() => setTaskFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                taskFilter === filter 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter === 'ONGOING' ? 'Đang làm' : filter === 'COMPLETED' ? 'Hoàn thành' : 'Tất cả'}
            </button>
          ))}
        </div>

        {/* Area Filter & Add Project */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
            {(['ALL', 'WORK', 'RELATIONSHIP', 'SELF'] as AreaType[]).map(area => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  areaFilter === area 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {area === 'ALL' ? 'Tất cả' : area === 'WORK' ? 'Công việc' : area === 'RELATIONSHIP' ? 'Quan hệ' : 'Bản thân'}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setIsAddProjectModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm Dự Án</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {groupedByProject.map(group => (
          <div 
            key={group.id}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Project Header */}
            <div 
              className={`p-4 ${group.bg} flex items-center justify-between group cursor-pointer`}
              onClick={() => toggleProjectCollapse(group.id)}
            >
              <div className="flex items-center gap-2">
                {collapsedProjects.has(group.id) ? (
                  <ChevronRight className={`w-4 h-4 ${group.color}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${group.color}`} />
                )}
                <h3 className={`font-display font-bold ${group.color}`}>
                  {group.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(group);
                    setIsEditProjectModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-background/50 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <span className={`text-xs font-semibold ${group.color} bg-background/50 px-2 py-0.5 rounded-full`}>
                  {group.tasks.length}
                </span>
              </div>
            </div>

            {/* Tasks List */}
            {!collapsedProjects.has(group.id) && (
              <div className="p-3 space-y-2">
                {group.tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskForEdit(task)}
                    className={`bg-background p-3 rounded-xl border border-border hover:shadow-md transition-all cursor-pointer group ${
                      task.status === 'DONE' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(task.id);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          task.status === 'DONE'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {task.status === 'DONE' && <Check className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${task.status === 'DONE' ? 'line-through' : ''}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Est: {task.estimateMinutes}m / Act: {task.actualMinutes}m
                          </span>
                          {task.priority && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_STYLES[task.priority]}`}>
                              {task.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Task Button */}
                <button
                  onClick={() => {
                    setNewTaskData({ projectId: group.id, estimateMinutes: 30 });
                    setIsAddTaskModalOpen(true);
                  }}
                  className="w-full py-2.5 text-xs text-muted-foreground border border-dashed border-border rounded-xl hover:bg-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Task
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {groupedByProject.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Chưa có dự án nào</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tạo dự án đầu tiên để bắt đầu quản lý công việc
            </p>
            <button
              onClick={() => setIsAddProjectModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 inline-flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Thêm Dự Án
            </button>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        title="Thêm dự án mới"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Tên dự án
            </label>
            <input
              type="text"
              className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
              placeholder="VD: Marketing Campaign..."
              value={newProjectData.title || ''}
              onChange={e => setNewProjectData({ ...newProjectData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Lĩnh vực
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['WORK', 'RELATIONSHIP', 'SELF'] as const).map(area => (
                <button
                  key={area}
                  onClick={() => setNewProjectData({ ...newProjectData, area })}
                  className={`p-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    newProjectData.area === area
                      ? `${AREA_COLORS[area].bg} ${AREA_COLORS[area].color} border-current`
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {area === 'WORK' ? 'Công việc' : area === 'RELATIONSHIP' ? 'Quan hệ' : 'Bản thân'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddProject}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Tạo Dự Án
          </button>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectModalOpen}
        onClose={() => { setIsEditProjectModalOpen(false); setEditingProject(null); }}
        title="Chỉnh sửa dự án"
      >
        {editingProject && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Tên dự án
              </label>
              <input
                type="text"
                className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                value={editingProject.title}
                onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Lĩnh vực
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['WORK', 'RELATIONSHIP', 'SELF'] as const).map(area => (
                  <button
                    key={area}
                    onClick={() => setEditingProject({ ...editingProject, area })}
                    className={`p-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      editingProject.area === area
                        ? `${AREA_COLORS[area].bg} ${AREA_COLORS[area].color} border-current`
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {area === 'WORK' ? 'Công việc' : area === 'RELATIONSHIP' ? 'Quan hệ' : 'Bản thân'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => deleteProject(editingProject.id)}
                className="flex-1 py-3 bg-destructive text-destructive-foreground font-bold rounded-xl hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
              <button
                onClick={handleUpdateProject}
                className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!selectedTaskForEdit}
        onClose={() => setSelectedTaskForEdit(null)}
        title="Chi tiết công việc"
      >
        {selectedTaskForEdit && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Tên công việc
              </label>
              <input
                type="text"
                className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                value={selectedTaskForEdit.title}
                onChange={e => setSelectedTaskForEdit({ ...selectedTaskForEdit, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Mô tả
              </label>
              <textarea
                className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none bg-card"
                rows={3}
                value={selectedTaskForEdit.description || ''}
                onChange={e => setSelectedTaskForEdit({ ...selectedTaskForEdit, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Dự kiến (phút)
                </label>
                <input
                  type="number"
                  className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card"
                  value={selectedTaskForEdit.estimateMinutes}
                  onChange={e => setSelectedTaskForEdit({ ...selectedTaskForEdit, estimateMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Ưu tiên
                </label>
                <select
                  className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-card"
                  value={selectedTaskForEdit.priority || 'medium'}
                  onChange={e => setSelectedTaskForEdit({ ...selectedTaskForEdit, priority: e.target.value as any })}
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => deleteTask(selectedTaskForEdit.id)}
                className="flex-1 py-3 bg-destructive text-destructive-foreground font-bold rounded-xl hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
              <button
                onClick={() => {
                  updateTask(selectedTaskForEdit.id, selectedTaskForEdit);
                  setSelectedTaskForEdit(null);
                }}
                className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
