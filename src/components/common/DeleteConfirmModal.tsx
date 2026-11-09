import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemTitle?: string;
  description?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemTitle,
  description = 'This action cannot be undone. It will be permanently removed from Soumil\'s Blog.',
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-panel p-6 sm:p-7 rounded-3xl border border-rose-500/30 shadow-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 relative animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 shadow-lg shadow-rose-500/10">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-bold text-white mb-1">{title}</h3>
            {itemTitle && (
              <p className="text-sm font-semibold text-rose-300 line-clamp-1 break-all mb-1">
                "{itemTitle}"
              </p>
            )}
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs font-mono-code mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Permanently deletes content from database</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
