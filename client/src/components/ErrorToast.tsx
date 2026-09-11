import {
  useEffect,
  useRef,
} from "react";

import {
  createPortal,
} from "react-dom";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ErrorToastProps = {
  message: string;
  onClose: () => void;
};

/*
 * =========================================================
 * ERROR TOAST
 * =========================================================
 */

function ErrorToast({
  message,
  onClose,
}: ErrorToastProps) {
  const onCloseRef =
    useRef(onClose);

  /*
   * =========================================================
   * KEEP CLOSE HANDLER CURRENT
   * =========================================================
   */

  useEffect(() => {
    onCloseRef.current =
      onClose;
  }, [onClose]);

  /*
   * =========================================================
   * AUTO DISMISS
   * =========================================================
   */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          onCloseRef.current();
        },
        3200,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [message]);

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className="fixed left-1/2 top-4 z-[900] w-[min(calc(100vw-1.5rem),520px)] -translate-x-1/2 sm:top-6"
    >
      <div className="relative overflow-hidden rounded-[16px] border border-[rgb(212_77_92_/_0.30)] bg-[#211b2b]/95 shadow-[0_22px_60px_-24px_rgba(0,0,0,.88)] backdrop-blur-xl">
        {/*
         * =========================================================
         * TOAST ACCENT
         * =========================================================
         */}

        <div className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#d44d5c,#8350c4)]" />

        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[rgb(212_77_92_/_0.12)] blur-3xl" />

        {/*
         * =========================================================
         * TOAST CONTENT
         * =========================================================
         */}

        <div className="relative flex items-start gap-3 px-4 py-3.5 pl-5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgb(212_77_92_/_0.22)] bg-[rgb(212_77_92_/_0.10)] text-[var(--lilac-200)]">
            <ErrorIcon />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-faint)]">
              Something went wrong
            </p>

            <p className="mt-1 text-[11px] font-bold leading-5 text-[var(--pale-sky)]">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close error"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--text-faint)] transition-all hover:border-[rgb(115_146_181_/_0.20)] hover:bg-[var(--surface-blue-soft)] hover:text-[var(--pale-sky)]"
          >
            <CloseIcon />
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

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
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
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ErrorToast;