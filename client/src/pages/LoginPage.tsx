import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import ErrorToast from "../components/ErrorToast";

import {
  isAuthenticated,
  login,
} from "../services/authService";

/*
 * =========================================================
 * LOGIN PAGE
 * =========================================================
 */

function LoginPage() {
  const navigate =
    useNavigate();

  /*
   * =========================================================
   * FORM STATE
   * =========================================================
   */

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
   * =========================================================
   * AUTH REDIRECT
   * =========================================================
   */

  if (isAuthenticated()) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login({
        email:
          email.trim(),

        password,
      });

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main
      className="relative min-h-screen overflow-hidden text-[var(--text-primary)]"
      style={{
        backgroundColor:
          "#1b1b2b",

        backgroundImage: `
          linear-gradient(
            rgba(201,224,235,.020) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(201,224,235,.020) 1px,
            transparent 1px
          ),
          radial-gradient(
            ellipse at 12% 10%,
            rgba(115,146,181,.18),
            transparent 34rem
          ),
          radial-gradient(
            ellipse at 84% 16%,
            rgba(131,80,196,.18),
            transparent 34rem
          ),
          linear-gradient(
            135deg,
            #1b1b2b 0%,
            #1f1e32 48%,
            #1b1b2b 100%
          )
        `,

        backgroundSize:
          "56px 56px, 56px 56px, auto, auto, auto",
      }}
    >
      {error && (
        <ErrorToast
          message={
            error
          }
          onClose={() =>
            setError("")
          }
        />
      )}

      {/*
       * =========================================================
       * PAGE SHELL
       * =========================================================
       */}

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1480px] lg:grid-cols-[minmax(0,.92fr)_minmax(500px,.78fr)]">
        {/*
         * =========================================================
         * BRAND / CONTEXT PANEL
         * =========================================================
         */}

        <section className="hidden min-h-screen border-r border-[rgb(96_105_144_/_0.16)] px-8 py-10 lg:flex lg:flex-col xl:px-12">
          <Link
            to="/"
            className="group inline-flex w-fit items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-1 rounded-full bg-[var(--deep-lilac)]/25 blur-lg transition-colors group-hover:bg-[var(--lilac-400)]/35" />

              <BrandIcon />
            </div>

            <div>
              <p className="db-display-title text-[1.35rem] leading-none">
                DevBoard
              </p>

              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--denim-300)]">
                Project workspace
              </p>
            </div>
          </Link>

          <div className="my-auto max-w-[620px] py-16">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgb(131_80_196_/_0.28)] bg-[rgb(131_80_196_/_0.10)] px-3.5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lilac-300)]" />

              <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[var(--lilac-200)]">
                Secure workspace access
              </span>
            </div>

            <h1 className="db-display-title mt-7 text-[3.4rem] leading-[0.98] xl:text-[4rem]">
              Return to your
              <br />

              <span className="bg-[linear-gradient(90deg,#c9e0eb,#9cb7d3,#b596e1)] bg-clip-text text-transparent">
                project workspace.
              </span>
            </h1>

            <p className="mt-6 max-w-[560px] text-sm leading-7 text-[var(--text-muted)]">
              Sign in to continue managing projects, assigned tasks,
              deadlines and Kanban progress from your existing DevBoard
              account.
            </p>

            <div className="mt-9 grid max-w-[560px] gap-3 sm:grid-cols-2">
              <ContextCard
                icon={
                  <FolderIcon />
                }
                title="Projects"
                description="Keep project work and related tasks grouped together."
              />

              <ContextCard
                icon={
                  <BoardIcon />
                }
                title="Kanban"
                description="Continue tracking work across every workflow stage."
              />

              <ContextCard
                icon={
                  <TaskIcon />
                }
                title="My Tasks"
                description="Return to work already assigned to your account."
              />

              <ContextCard
                icon={
                  <ChartIcon />
                }
                title="Dashboard"
                description="Review current progress and upcoming work."
              />
            </div>
          </div>

          <p className="text-[8px] font-semibold text-[var(--text-faint)]">
            DevBoard · Project and task management workspace
          </p>
        </section>

        {/*
         * =========================================================
         * LOGIN FORM PANEL
         * =========================================================
         */}

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-[470px]">
            {/*
             * =========================================================
             * MOBILE BRAND
             * =========================================================
             */}

            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-3 lg:hidden"
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="absolute inset-1 rounded-full bg-[var(--deep-lilac)]/25 blur-lg" />

                <BrandIcon />
              </div>

              <div>
                <p className="db-display-title text-[1.3rem] leading-none">
                  DevBoard
                </p>

                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--denim-300)]">
                  Project workspace
                </p>
              </div>
            </Link>

            {/*
             * =========================================================
             * LOGIN CARD
             * =========================================================
             */}

            <div className="relative overflow-hidden rounded-[24px] border border-[rgb(115_146_181_/_0.24)] bg-[#1b1d2c]/95 shadow-[0_30px_90px_-32px_rgba(0,0,0,.90)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[var(--deep-lilac)]/15 blur-3xl" />

              <div className="relative p-5 sm:p-7">
                {/*
                 * =========================================================
                 * FORM HEADER
                 * =========================================================
                 */}

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
                    Welcome back
                  </p>

                  <h2 className="db-display-title mt-2 text-[2rem] leading-none sm:text-[2.2rem]">
                    Log in
                  </h2>

                  <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">
                    Enter the email and password connected to your account.
                  </p>
                </div>

                {/*
                 * =========================================================
                 * LOGIN FORM
                 * =========================================================
                 */}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="mt-7 space-y-5"
                >
                  {/*
                   * =========================================================
                   * EMAIL
                   * =========================================================
                   */}

                  <FieldLabel
                    htmlFor="email"
                    label="Email"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--denim-300)]">
                        <MailIcon />
                      </span>

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={
                          email
                        }
                        onChange={(
                          event,
                        ) =>
                          setEmail(
                            event.target
                              .value,
                          )
                        }
                        placeholder="you@example.com"
                        className="input-style"
                        style={{
                          paddingLeft:
                            "3rem",
                        }}
                      />
                    </div>
                  </FieldLabel>

                  {/*
                   * =========================================================
                   * PASSWORD
                   * =========================================================
                   */}

                  <FieldLabel
                    htmlFor="password"
                    label="Password"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--denim-300)]">
                        <LockIcon />
                      </span>

                      <input
                        id="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="current-password"
                        required
                        minLength={8}
                        value={
                          password
                        }
                        onChange={(
                          event,
                        ) =>
                          setPassword(
                            event.target
                              .value,
                          )
                        }
                        placeholder="••••••••"
                        className="input-style"
                        style={{
                          paddingLeft:
                            "3rem",
                          paddingRight:
                            "3rem",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) =>
                              !current,
                          )
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-faint)] transition-all hover:bg-[var(--surface-blue-soft)] hover:text-[var(--pale-sky)]"
                      >
                        {showPassword ? (
                          <EyeOffIcon />
                        ) : (
                          <EyeIcon />
                        )}
                      </button>
                    </div>
                  </FieldLabel>

                  {/*
                   * =========================================================
                   * SUBMIT
                   * =========================================================
                   */}

                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 text-xs font-black text-[var(--sky-50)] shadow-[0_18px_36px_-20px_rgba(109,54,222,.78)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45"
                  >
                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Signing in...
                      </>
                    ) : (
                      <>
                        Log in

                        <ArrowRightIcon />
                      </>
                    )}
                  </button>
                </form>

                {/*
                 * =========================================================
                 * REGISTER LINK
                 * =========================================================
                 */}

                <div className="mt-6 border-t border-[rgb(96_105_144_/_0.16)] pt-5 text-center">
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="font-black text-[var(--lilac-200)] transition-colors hover:text-[var(--pale-sky)]"
                    >
                      Create account
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/*
             * =========================================================
             * BACK HOME
             * =========================================================
             */}

            <div className="mt-5 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[9px] font-bold text-[var(--text-faint)] transition-colors hover:text-[var(--text-secondary)]"
              >
                <ArrowLeftIcon />

                Back to DevBoard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/*
 * =========================================================
 * FIELD LABEL
 * =========================================================
 */

function FieldLabel({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={
        htmlFor
      }
      className="block"
    >
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </span>

      {children}
    </label>
  );
}

/*
 * =========================================================
 * CONTEXT CARD
 * =========================================================
 */

function ContextCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[16px] border border-[rgb(96_105_144_/_0.22)] bg-[#202235]/65 p-4 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(115_146_181_/_0.22)] bg-[rgb(115_146_181_/_0.10)] text-[var(--denim-300)]">
        {icon}
      </div>

      <h3 className="db-display-title mt-4 text-[1rem]">
        {title}
      </h3>

      <p className="mt-1.5 text-[9px] leading-4 text-[var(--text-muted)]">
        {description}
      </p>
    </article>
  );
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function BrandIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="relative z-[1] h-9 w-9 text-[var(--lilac-300)]"
      aria-hidden="true"
    >
      <path
        d="M24 3c1.8 12.7 7.3 18.2 20 20-12.7 1.8-18.2 7.3-20 20-1.8-12.7-7.3-18.2-20-20C16.7 21.2 22.2 15.7 24 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m4 4 16 16M10.2 7.2A8.9 8.9 0 0 1 12 7c5.5 0 8.5 5 8.5 5a13.2 13.2 0 0 1-2.5 3M6.2 8.3A13.5 13.5 0 0 0 3.5 12s3 5 8.5 5c.7 0 1.4-.1 2-.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M10 7l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 7.5h6l2-2h8v13H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="4"
        width="6"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="4"
        y="15"
        width="6"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="12"
        width="6"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 19V11M12 19V5M19 19v-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default LoginPage;