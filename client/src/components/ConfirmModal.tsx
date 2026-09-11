import {
  useEffect,
} from "react";

import {
  createPortal,
} from "react-dom";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/*
 * =========================================================
 * CONFIRM MODAL
 * =========================================================
 */

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  /*
   * =========================================================
   * BODY SCROLL / KEYBOARD
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !loading
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    loading,
    onClose,
  ]);

  /*
   * =========================================================
   * CLOSED STATE
   * =========================================================
   */

  if (!open) {
    return null;
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return createPortal(
    <div
      className="fixed inset-0 z-[800] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6 md:items-center"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="my-auto w-full max-w-md overflow-hidden rounded-[22px] border border-[rgb(115_146_181_/_0.24)] bg-[#1b1d2c] shadow-[0_30px_90px_-30px_rgba(0,0,0,.92)]"
      >
        {/*
         * =========================================================
         * MODAL CONTENT
         * =========================================================
         */}

        <div className="relative overflow-hidden p-5 sm:p-6">
          <div
            className={`pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full blur-3xl ${
              danger
                ? "bg-[rgb(212_77_92_/_0.12)]"
                : "bg-[var(--deep-lilac)]/18"
            }`}
          />

          <div className="relative">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                danger
                  ? "border-[rgb(212_77_92_/_0.22)] bg-[rgb(212_77_92_/_0.09)] text-[var(--lilac-200)]"
                  : "border-[rgb(131_80_196_/_0.28)] bg-[rgb(131_80_196_/_0.12)] text-[var(--lilac-200)]"
              }`}
            >
              {danger ? (
                <TrashIcon />
              ) : (
                <AlertIcon />
              )}
            </div>

            <h2
              id="confirm-modal-title"
              className="db-display-title mt-5 text-[1.45rem]"
            >
              {title}
            </h2>

            <p
              id="confirm-modal-description"
              className="mt-3 text-[11px] leading-6 text-[var(--text-muted)]"
            >
              {description}
            </p>
          </div>
        </div>

        {/*
         * =========================================================
         * MODAL ACTIONS
         * =========================================================
         */}

        <div className="flex flex-col-reverse gap-2 border-t border-[rgb(96_105_144_/_0.16)] bg-[#202235]/45 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              onClose
            }
            className="rounded-xl border border-[rgb(96_105_144_/_0.28)] bg-[#232536] px-5 py-3 text-[10px] font-black text-[var(--text-secondary)] transition-all hover:border-[rgb(115_146_181_/_0.42)] hover:bg-[#292c41] hover:text-[var(--pale-sky)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              onConfirm
            }
            className={`inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-[10px] font-black transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
              danger
                ? "border-[rgb(212_77_92_/_0.30)] bg-[rgb(212_77_92_/_0.14)] text-[var(--lilac-200)] hover:border-[rgb(212_77_92_/_0.42)] hover:bg-[rgb(212_77_92_/_0.20)]"
                : "border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] text-[var(--sky-50)] shadow-[0_14px_30px_-18px_rgba(109,54,222,.72)] hover:-translate-y-0.5 hover:brightness-110"
            }`}
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />

                {danger
                  ? "Deleting..."
                  : "Working..."}
              </>
            ) : (
              <>
                {danger ? (
                  <TrashSmallIcon />
                ) : (
                  <CheckIcon />
                )}

                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 8v5M12 16.5h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="m7 12 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ConfirmModal;