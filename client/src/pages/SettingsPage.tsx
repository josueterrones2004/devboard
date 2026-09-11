import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getMe,
  logout,
  updateProfile,
} from "../services/authService";

/*
 * =========================================================
 * SETTINGS PAGE
 * =========================================================
 */

function SettingsPage() {
  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  const navigate =
    useNavigate();

  /*
   * =========================================================
   * PROFILE STATE
   * =========================================================
   */

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    originalName,
    setOriginalName,
  ] = useState("");

  const [
    originalEmail,
    setOriginalEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /*
   * =========================================================
   * LOAD PROFILE
   * =========================================================
   */

  useEffect(() => {
    let active = true;

    const loadProfile =
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await getMe();

          if (!active) {
            return;
          }

          setName(
            response.user.name,
          );

          setEmail(
            response.user.email,
          );

          setOriginalName(
            response.user.name,
          );

          setOriginalEmail(
            response.user.email,
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load profile",
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  /*
   * =========================================================
   * PROFILE STATUS
   * =========================================================
   */

  const hasChanges =
    useMemo(
      () =>
        name.trim() !==
          originalName.trim() ||
        email.trim() !==
          originalEmail.trim(),
      [
        name,
        email,
        originalName,
        originalEmail,
      ],
    );

  const initials =
    useMemo(
      () =>
        getInitials(
          name ||
            originalName ||
            "User",
        ),
      [
        name,
        originalName,
      ],
    );

  /*
   * =========================================================
   * SAVE PROFILE
   * =========================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!hasChanges) {
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response =
        await updateProfile({
          name:
            name.trim(),
          email:
            email.trim(),
        });

      setName(
        response.user.name,
      );

      setEmail(
        response.user.email,
      );

      setOriginalName(
        response.user.name,
      );

      setOriginalEmail(
        response.user.email,
      );

      setSuccess(
        "Profile updated successfully.",
      );

      window.setTimeout(
        () => {
          setSuccess("");
        },
        3200,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * RESET FORM
   * =========================================================
   */

  const handleReset = () => {
    setName(
      originalName,
    );

    setEmail(
      originalEmail,
    );

    setError("");
    setSuccess("");
  };

  /*
   * =========================================================
   * SIGN OUT
   * =========================================================
   */

  const handleLogout = () => {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className="min-h-[calc(100vh-86px)]"
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
            ellipse at 34% -8%,
            rgba(115,146,181,.20),
            transparent 35rem
          ),
          radial-gradient(
            ellipse at 86% 0%,
            rgba(131,80,196,.16),
            transparent 31rem
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
      <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        {/*
         * =========================================================
         * PAGE HEADER
         * =========================================================
         */}

        <section>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--lilac-300)]">
            Account
          </p>

          <h2 className="db-display-title mt-2 text-[2.6rem] leading-none sm:text-[2.9rem]">
            Settings
          </h2>

          <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
            Manage your profile and current DevBoard session.
          </p>
        </section>

        {/*
         * =========================================================
         * PROFILE OVERVIEW
         * =========================================================
         */}

        <section
          className="relative mt-6 overflow-hidden rounded-[22px] border border-[rgb(131_80_196_/_0.34)]"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 88% 15%,
                rgba(131,80,196,.22),
                transparent 18rem
              ),
              linear-gradient(
                120deg,
                #242138 0%,
                #28233f 48%,
                #30264b 100%
              )
            `,
          }}
        >
          {/*
           * =========================================================
           * PROFILE GRID BACKGROUND
           * =========================================================
           */}

          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(
                  rgba(201,224,235,.035) 1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  rgba(201,224,235,.035) 1px,
                  transparent 1px
                )
              `,

              backgroundSize:
                "36px 36px",

              maskImage:
                "linear-gradient(90deg, transparent 15%, black 100%)",
            }}
          />

          <div className="relative z-[1] flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              {/*
               * =========================================================
               * PROFILE AVATAR
               * =========================================================
               */}

              <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-[rgb(201_224_235_/_0.18)] bg-[linear-gradient(135deg,#7392b5,#8350c4,#563264)] shadow-[0_18px_42px_-26px_rgba(109,54,222,.85)]">
                <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/15 blur-xl" />

                <span className="relative text-lg font-black text-[var(--sky-50)]">
                  {initials}
                </span>
              </div>

              {/*
               * =========================================================
               * PROFILE IDENTITY
               * =========================================================
               */}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="db-display-title truncate text-[1.55rem]">
                    {name ||
                      "DevBoard user"}
                  </h3>

                  <span className="rounded-full border border-[rgb(131_80_196_/_0.32)] bg-[rgb(131_80_196_/_0.16)] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-[var(--lilac-200)]">
                    Personal account
                  </span>
                </div>

                <p className="mt-1.5 truncate text-xs font-semibold text-[var(--denim-300)]">
                  {email ||
                    "No email"}
                </p>

                <p className="mt-2 text-[9px] font-medium text-[var(--text-faint)]">
                  Your account information is used across your DevBoard workspace.
                </p>
              </div>
            </div>

            {/*
             * =========================================================
             * ACCOUNT STATUS
             * =========================================================
             */}

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[rgb(201_224_235_/_0.09)] bg-[#202235]/60 px-4 py-3 backdrop-blur-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(185_228_248_/_0.10)] text-[#b9e4f8]">
                <ShieldIcon />
              </span>

              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  Account status
                </p>

                <p className="mt-1 text-[10px] font-black text-[var(--sky-200)]">
                  Active
                </p>
              </div>
            </div>
          </div>
        </section>

        {/*
         * =========================================================
         * SETTINGS GRID
         * =========================================================
         */}

        <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
          {/*
           * =========================================================
           * PROFILE SETTINGS
           * =========================================================
           */}

          <div className="overflow-hidden rounded-[20px] border border-[rgb(96_105_144_/_0.34)] bg-[#1f2132] shadow-[0_22px_60px_-48px_rgba(0,0,0,.75)]">
            {/*
             * =========================================================
             * PROFILE SETTINGS HEADER
             * =========================================================
             */}

            <div className="flex items-center gap-4 border-b border-[rgb(96_105_144_/_0.18)] px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(115_146_181_/_0.22)] bg-[rgb(115_146_181_/_0.12)] text-[var(--sky-200)]">
                <UserIcon />
              </span>

              <div>
                <h3 className="db-display-title text-[1.25rem]">
                  Profile information
                </h3>

                <p className="mt-1 text-[9px] font-medium text-[var(--text-faint)]">
                  Update the information associated with your account.
                </p>
              </div>
            </div>

            {/*
             * =========================================================
             * PROFILE FORM
             * =========================================================
             */}

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center p-6">
                <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)]">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--lilac-300)]" />

                  Loading profile...
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="p-5 sm:p-6"
              >
                {/*
                 * =========================================================
                 * FORM MESSAGES
                 * =========================================================
                 */}

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-[rgb(212_77_92_/_0.30)] bg-[rgb(212_77_92_/_0.10)] px-4 py-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[rgb(212_77_92_/_0.14)] text-[var(--lilac-200)]">
                      !
                    </span>

                    <p className="text-[10px] font-bold leading-5 text-[var(--lilac-200)]">
                      {error}
                    </p>
                  </div>
                )}

                {success && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-[rgb(185_228_248_/_0.22)] bg-[rgb(185_228_248_/_0.08)] px-4 py-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[rgb(185_228_248_/_0.12)] text-[#b9e4f8]">
                      <CheckIcon />
                    </span>

                    <p className="text-[10px] font-bold leading-5 text-[#b9e4f8]">
                      {success}
                    </p>
                  </div>
                )}

                {/*
                 * =========================================================
                 * PROFILE FIELDS
                 * =========================================================
                 */}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Full name
                      </span>

                      <span className="text-[7px] font-semibold text-[var(--text-faint)]">
                        Public identity
                      </span>
                    </div>

                    <div className="relative mt-2">
                      <span
                        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--denim-300)] transition-opacity ${
                          name.trim()
                            ? "opacity-0"
                            : "opacity-100"
                        }`}
                      >
                        <UserSmallIcon />
                      </span>

                      <input
                        required
                        value={
                          name
                        }
                        onChange={(
                          event,
                        ) => {
                          setName(
                            event.target
                              .value,
                          );

                          setError(
                            "",
                          );

                          setSuccess(
                            "",
                          );
                        }}
                        className="input-style pl-11"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Email address
                      </span>

                      <span className="text-[7px] font-semibold text-[var(--text-faint)]">
                        Account email
                      </span>
                    </div>

                    <div className="relative mt-2">
                      <span
                        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--denim-300)] transition-opacity ${
                          email.trim()
                            ? "opacity-0"
                            : "opacity-100"
                        }`}
                      >
                        <MailIcon />
                      </span>

                      <input
                        required
                        type="email"
                        value={
                          email
                        }
                        onChange={(
                          event,
                        ) => {
                          setEmail(
                            event.target
                              .value,
                          );

                          setError(
                            "",
                          );

                          setSuccess(
                            "",
                          );
                        }}
                        className="input-style pl-11"
                      />
                    </div>
                  </label>
                </div>

                {/*
                 * =========================================================
                 * FORM ACTIONS
                 * =========================================================
                 */}

                <div className="mt-7 flex flex-col gap-3 border-t border-[rgb(96_105_144_/_0.16)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[var(--text-faint)]">
                      Changes
                    </p>

                    <p
                      className={`mt-1 text-[9px] font-semibold ${
                        hasChanges
                          ? "text-[var(--lilac-200)]"
                          : "text-[var(--text-faint)]"
                      }`}
                    >
                      {hasChanges
                        ? "You have unsaved changes."
                        : "Your profile is up to date."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={
                        handleReset
                      }
                      disabled={
                        saving ||
                        !hasChanges
                      }
                      className="rounded-xl border border-[rgb(96_105_144_/_0.30)] bg-[#25283b] px-4 py-3 text-[10px] font-black text-[var(--text-secondary)] transition-all hover:border-[rgb(115_146_181_/_0.42)] hover:bg-[#292c41] hover:text-[var(--pale-sky)] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !hasChanges
                      }
                      className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 py-3 text-[10px] font-black text-[var(--sky-50)] shadow-[0_14px_30px_-18px_rgba(109,54,222,.75)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
                    >
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon />

                          Save changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/*
           * =========================================================
           * ACCOUNT SIDEBAR
           * =========================================================
           */}

          <div className="space-y-5">
            {/*
             * =========================================================
             * ACCOUNT DETAILS
             * =========================================================
             */}

            <section className="overflow-hidden rounded-[20px] border border-[rgb(96_105_144_/_0.34)] bg-[#1f2132]">
              <div className="border-b border-[rgb(96_105_144_/_0.18)] px-5 py-4">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[var(--denim-300)]">
                  Account
                </p>

                <h3 className="db-display-title mt-1 text-[1.15rem]">
                  Account details
                </h3>
              </div>

              <div className="divide-y divide-[rgb(96_105_144_/_0.14)]">
                <AccountDetailRow
                  icon={
                    <UserSmallIcon />
                  }
                  label="Profile"
                  value={
                    name ||
                    "Not available"
                  }
                />

                <AccountDetailRow
                  icon={
                    <MailIcon />
                  }
                  label="Email"
                  value={
                    email ||
                    "Not available"
                  }
                />

                <AccountDetailRow
                  icon={
                    <WorkspaceIcon />
                  }
                  label="Workspace"
                  value="Personal"
                />
              </div>
            </section>

            {/*
             * =========================================================
             * SESSION
             * =========================================================
             */}

            <section className="overflow-hidden rounded-[20px] border border-[rgb(212_77_92_/_0.20)] bg-[#1f2132]">
              <div className="border-b border-[rgb(212_77_92_/_0.14)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(212_77_92_/_0.18)] bg-[rgb(212_77_92_/_0.09)] text-[var(--lilac-200)]">
                    <SessionIcon />
                  </span>

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)]">
                      Session
                    </p>

                    <h3 className="db-display-title mt-1 text-[1.1rem]">
                      Current session
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[10px] leading-5 text-[var(--text-muted)]">
                  Signing out will end the current DevBoard session on this browser.
                </p>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgb(212_77_92_/_0.26)] bg-[rgb(212_77_92_/_0.09)] px-4 py-3 text-[10px] font-black text-[var(--lilac-200)] transition-all hover:border-[rgb(212_77_92_/_0.38)] hover:bg-[rgb(212_77_92_/_0.14)]"
                >
                  <LogoutIcon />

                  Sign out
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * ACCOUNT DETAIL ROW
 * =========================================================
 */

function AccountDetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(115_146_181_/_0.10)] text-[var(--denim-300)]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[var(--text-faint)]">
          {label}
        </p>

        <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-secondary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * SETTINGS HELPERS
 * =========================================================
 */

function getInitials(
  value: string,
) {
  return value
    .trim()
    .split(/\s+/)
    .slice(
      0,
      2,
    )
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase(),
    )
    .join("");
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M4.5 20c.7-4.2 3.2-6.5 7.5-6.5s6.8 2.3 7.5 6.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M6 19c.5-3.2 2.5-5 6-5s5.5 1.8 6 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 4h12l2 2v14H5V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 4v6h8V4M8 20v-6h8v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M12 3 19 6v5c0 4.6-2.5 8-7 10-4.5-2-7-5.4-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WorkspaceIcon() {
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

function SessionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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

export default SettingsPage;