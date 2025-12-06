import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border/50 animate-scale-in">
        {title ? (
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h3 className="font-display font-bold text-foreground">{title}</h3>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex justify-end p-2">
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
