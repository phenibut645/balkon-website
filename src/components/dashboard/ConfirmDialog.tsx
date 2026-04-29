type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="admin-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="admin-dialog-card">
        <h3 className="display-name">{title}</h3>
        <p className="state-text">{message}</p>
        <div className="admin-form-actions">
          <button type="button" className="pagination-btn" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="pagination-btn admin-danger-btn" disabled={busy} onClick={onConfirm}>
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
