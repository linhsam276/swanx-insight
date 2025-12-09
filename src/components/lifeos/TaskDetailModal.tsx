import React, { useState, useEffect } from 'react';
import { Task, Project, PriorityLevel } from '@/types/lifeos';
import { 
  Clock, Calendar, Pin, AlertCircle, Play, Trash2, 
  Check, Flag, X, Pencil
} from 'lucide-react';
import { Modal } from './Modal';

interface TaskDetailModalProps {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200'
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  projects,
  onClose,
  onUpdate,
  onDelete,
  onToggleStatus
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        date: task.date,
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        dueTime: task.dueTime || '',
        estimateMinutes: task.estimateMinutes,
        priority: task.priority,
        isFixed: task.isFixed,
        projectId: task.projectId
      });
      setIsEditing(false);
    }
  }, [task]);

  if (!task) return null;

  const project = projects.find(p => p.id === task.projectId);

  const handleSave = () => {
    onUpdate(task.id, editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa task này?')) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={!!task} onClose={onClose}>
      <div className="space-y-4">
        {/* Header with Project Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {project && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${project.bg} ${project.color} mb-2`}>
                {project.title}
              </span>
            )}
            
            {isEditing ? (
              <input
                type="text"
                className="w-full text-lg font-bold bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={editData.title || ''}
                onChange={e => setEditData({ ...editData, title: e.target.value })}
              />
            ) : (
              <h2 className={`text-lg font-bold ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h2>
            )}
          </div>
          
          {/* Status checkbox */}
          <button
            onClick={() => onToggleStatus(task.id)}
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              task.status === 'DONE'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-border hover:border-primary'
            }`}
          >
            {task.status === 'DONE' && <Check className="w-4 h-4" />}
          </button>
        </div>

        {/* Description */}
        {isEditing ? (
          <textarea
            className="w-full p-3 border border-border rounded-xl text-sm bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
            placeholder="Mô tả task..."
            value={editData.description || ''}
            onChange={e => setEditData({ ...editData, description: e.target.value })}
          />
        ) : task.description ? (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            {task.description}
          </p>
        ) : null}

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div className="bg-muted/50 rounded-xl p-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Calendar className="w-3 h-3" />
              Ngày
            </label>
            {isEditing ? (
              <input
                type="date"
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={editData.date || ''}
                onChange={e => setEditData({ ...editData, date: e.target.value })}
              />
            ) : (
              <span className="text-sm font-medium">{task.date || 'Chưa có'}</span>
            )}
          </div>

          {/* Pinned Status */}
          <div className="bg-muted/50 rounded-xl p-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Pin className="w-3 h-3" />
              Ghim cố định
            </label>
            {isEditing ? (
              <button
                onClick={() => setEditData({ ...editData, isFixed: !editData.isFixed })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  editData.isFixed 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {editData.isFixed ? 'Có' : 'Không'}
              </button>
            ) : (
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${task.isFixed ? 'text-primary' : 'text-muted-foreground'}`}>
                {task.isFixed ? (
                  <>
                    <Pin className="w-3.5 h-3.5" />
                    Có
                  </>
                ) : 'Không'}
              </span>
            )}
          </div>
        </div>

        {/* Time Block */}
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
          <label className="text-[10px] font-semibold text-primary uppercase tracking-wide flex items-center gap-1 mb-2">
            <Play className="w-3 h-3" />
            Khung giờ làm việc
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={editData.startTime || ''}
                onChange={e => setEditData({ ...editData, startTime: e.target.value })}
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="time"
                className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={editData.endTime || ''}
                onChange={e => setEditData({ ...editData, endTime: e.target.value })}
              />
            </div>
          ) : (
            <span className="text-sm font-medium">
              {task.startTime && task.endTime 
                ? `${task.startTime} - ${task.endTime}` 
                : 'Chưa đặt lịch'}
            </span>
          )}
        </div>

        {/* Due Time */}
        <div className="bg-warning/5 rounded-xl p-3 border border-warning/10">
          <label className="text-[10px] font-semibold text-warning uppercase tracking-wide flex items-center gap-1 mb-2">
            <AlertCircle className="w-3 h-3" />
            Deadline
          </label>
          {isEditing ? (
            <input
              type="time"
              className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={editData.dueTime || ''}
              onChange={e => setEditData({ ...editData, dueTime: e.target.value })}
            />
          ) : (
            <span className="text-sm font-medium">
              {task.dueTime || 'Không có deadline'}
            </span>
          )}
        </div>

        {/* Estimate & Priority */}
        <div className="grid grid-cols-2 gap-3">
          {/* Estimate */}
          <div className="bg-muted/50 rounded-xl p-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Clock className="w-3 h-3" />
              Ước tính
            </label>
            {isEditing ? (
              <input
                type="number"
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={editData.estimateMinutes || 0}
                onChange={e => setEditData({ ...editData, estimateMinutes: parseInt(e.target.value) || 0 })}
              />
            ) : (
              <span className="text-sm font-medium">
                {task.estimateMinutes} phút (thực tế: {task.actualMinutes}p)
              </span>
            )}
          </div>

          {/* Priority */}
          <div className="bg-muted/50 rounded-xl p-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Flag className="w-3 h-3" />
              Độ ưu tiên
            </label>
            {isEditing ? (
              <div className="flex gap-1">
                {(['high', 'medium', 'low'] as PriorityLevel[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setEditData({ ...editData, priority: p })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                      editData.priority === p 
                        ? PRIORITY_STYLES[p] 
                        : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    {p === 'high' ? 'Cao' : p === 'medium' ? 'TB' : 'Thấp'}
                  </button>
                ))}
              </div>
            ) : (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${task.priority ? PRIORITY_STYLES[task.priority] : 'bg-muted text-muted-foreground border-border'}`}>
                {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : task.priority === 'low' ? 'Thấp' : 'Chưa đặt'}
              </span>
            )}
          </div>
        </div>

        {/* Project Selection (Edit Mode) */}
        {isEditing && (
          <div className="bg-muted/50 rounded-xl p-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Dự án
            </label>
            <select
              className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={editData.projectId || ''}
              onChange={e => setEditData({ ...editData, projectId: e.target.value })}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
