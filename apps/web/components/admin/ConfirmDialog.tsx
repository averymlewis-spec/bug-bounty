import { ReactNode } from "react";

/**
 * Confirmation dialog that requires a text match before the destructive
 * action is enabled, preventing accidental clicks.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireText = "",
  onClose,
  onConfirm
}: {
  open: boolean;
  title: string;
  message?: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  requireText?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  let inputOk = true;
  if (requireText) {
    const input = document.getElementById("confirm-input") as HTMLInputElement | null;
    inputOk = input ? input.value === requireText : false;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="confirm-backdrop"
      onClick={onClose}
    >
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && inputOk) {
            onConfirm();
            onClose();
          }
        }}
      >
        <h3 id="confirm-title">{title}</h3>
        {message && <p className="confirm-msg">{message}</p>}
        {requireText ? (
          <input
            id="confirm-input"
            type="text"
            placeholder={`Type "${requireText}" to confirm`}
            className="confirm-input"
            onKeyUp={() => {
              const input = document.getElementById(
                "confirm-input"
              ) as HTMLInputElement;
              inputOk = input ? input.value === requireText : false;
            }}
          />
        ) : null}
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!inputOk}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
