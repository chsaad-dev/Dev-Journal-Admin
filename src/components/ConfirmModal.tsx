interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColorClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColorClass = "bg-error-container text-error hover:bg-error hover:text-on-surface border border-error-container",
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-outline-variant rounded-[var(--radius-card)] p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant text-sm mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmColorClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
