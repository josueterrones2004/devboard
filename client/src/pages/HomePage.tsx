import {
  type ReactNode,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  isAuthenticated,
} from "../services/authService";

/*
 * =========================================================
 * HOME PAGE
 * =========================================================
 */

function HomePage() {
  const authenticated =
    isAuthenticated();

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main
      className="min-h-screen overflow-hidden text-[var(--text-primary)]"
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
            ellipse at 18% 3%,
            rgba(115,146,181,.20),
            transparent 36rem
          ),
          radial-gradient(
            ellipse at 82% 10%,
            rgba(131,80,196,.20),
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
      {/*
       * =========================================================
       * NAVBAR
       * =========================================================
       */}

      <header className="relative z-20 border-b border-[rgb(96_105_144_/_0.18)] bg-[#171824]/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] w-full max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <div className="absolute inset-1 rounded-full bg-[var(--deep-lilac)]/25 blur-lg transition-colors group-hover:bg-[var(--lilac-400)]/35" />

              <BrandIcon />
            </div>

            <div className="min-w-0">
              <p className="db-display-title truncate text-[1.35rem] leading-none">
                DevBoard
              </p>

              <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--denim-300)]">
                Project workspace
              </p>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-2">
            {authenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-4 text-[10px] font-black text-[var(--sky-50)] shadow-[0_14px_30px_-20px_rgba(109,54,222,.70)] transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                Open dashboard

                <ArrowRightIcon />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden h-10 items-center justify-center rounded-xl border border-transparent px-4 text-[10px] font-black text-[var(--text-secondary)] transition-all hover:border-[rgb(115_146_181_/_0.24)] hover:bg-[var(--surface-blue-soft)] hover:text-[var(--pale-sky)] sm:inline-flex"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-4 text-[10px] font-black text-[var(--sky-50)] shadow-[0_14px_30px_-20px_rgba(109,54,222,.70)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  Create account

                  <ArrowRightIcon />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/*
       * =========================================================
       * HERO
       * =========================================================
       */}

      <section className="relative z-10">
        <div className="mx-auto grid w-full max-w-[1480px] items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,.88fr)_minmax(560px,1.12fr)] lg:px-8 lg:py-20 xl:gap-16">
          {/*
           * =========================================================
           * HERO COPY
           * =========================================================
           */}

          <div className="max-w-[640px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgb(131_80_196_/_0.28)] bg-[rgb(131_80_196_/_0.10)] px-3.5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lilac-300)] shadow-[0_0_10px_var(--shadow-purple)]" />

              <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[var(--lilac-200)]">
                Project & task management
              </span>
            </div>

            <h1 className="db-display-title mt-7 text-[3.25rem] leading-[0.96] sm:text-[4rem] lg:text-[4.6rem]">
              Projects, tasks
              <br />

              <span className="bg-[linear-gradient(90deg,#c9e0eb,#9cb7d3,#b596e1)] bg-clip-text text-transparent">
                and team work
              </span>

              <br />
              in one workspace.
            </h1>

            <p className="mt-6 max-w-[580px] text-sm leading-7 text-[var(--text-muted)] sm:text-[15px]">
              DevBoard centralizes project planning, task assignments,
              priorities, deadlines and progress in a single workspace
              built around a Kanban workflow.
            </p>

            {/*
             * =========================================================
             * HERO ACTIONS
             * =========================================================
             */}

            <div className="mt-8 flex flex-wrap gap-3">
              {authenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 text-xs font-black text-[var(--sky-50)] shadow-[0_18px_36px_-20px_rgba(109,54,222,.78)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  Go to dashboard

                  <ArrowRightIcon />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 text-xs font-black text-[var(--sky-50)] shadow-[0_18px_36px_-20px_rgba(109,54,222,.78)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Create account

                    <ArrowRightIcon />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-[rgb(115_146_181_/_0.28)] bg-[#202235]/75 px-5 text-xs font-black text-[var(--text-secondary)] transition-all hover:border-[rgb(115_146_181_/_0.44)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            {/*
             * =========================================================
             * WORKSPACE CAPABILITIES
             * =========================================================
             */}

            <div className="mt-9 flex flex-wrap gap-2">
              <CapabilityChip
                icon={
                  <BoardSmallIcon />
                }
                label="Kanban workflow"
              />

              <CapabilityChip
                icon={
                  <UsersSmallIcon />
                }
                label="Task assignments"
              />

              <CapabilityChip
                icon={
                  <ProgressSmallIcon />
                }
                label="Project progress"
              />
            </div>
          </div>

          {/*
           * =========================================================
           * WORKSPACE PREVIEW
           * =========================================================
           */}

          <WorkspacePreview />
        </div>
      </section>

      {/*
       * =========================================================
       * FEATURE SECTION
       * =========================================================
       */}

      <section className="relative z-10 border-t border-[rgb(96_105_144_/_0.16)] bg-[#181925]/72 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-[680px]">
            <p className="text-[8px] font-black uppercase tracking-[0.19em] text-[var(--lilac-300)]">
              Workspace tools
            </p>

            <h2 className="db-display-title mt-3 text-[2.35rem] leading-none sm:text-[2.7rem]">
              Everything needed to manage project work.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              Each part of DevBoard focuses on a specific part of the
              project workflow without splitting the work across
              disconnected screens or tools.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={
                <FolderIcon />
              }
              title="Projects"
              description="Create projects, track their state and keep related tasks grouped together."
              tone="purple"
            />

            <FeatureCard
              icon={
                <BoardIcon />
              }
              title="Kanban board"
              description="Move work between To do, In progress and Done with persistent drag and drop."
              tone="blue"
            />

            <FeatureCard
              icon={
                <TaskIcon />
              }
              title="Task details"
              description="Keep priorities, deadlines, labels and assignees attached to each task."
              tone="purple"
            />

            <FeatureCard
              icon={
                <ChartIcon />
              }
              title="Workspace overview"
              description="Use the dashboard to see project progress, open work and upcoming deadlines."
              tone="blue"
            />
          </div>
        </div>
      </section>

      {/*
       * =========================================================
       * WORKFLOW SECTION
       * =========================================================
       */}

      <section className="relative z-10 border-t border-[rgb(96_105_144_/_0.14)]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.19em] text-[var(--denim-300)]">
              Project workflow
            </p>

            <h2 className="db-display-title mt-3 text-[2.25rem] leading-[1.05] sm:text-[2.6rem]">
              From project creation to completed work.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
              Projects hold the work, tasks define what needs to be
              done, and the board shows where every assigned task is
              in the workflow.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <WorkflowStep
              number="01"
              title="Create a project"
              description="Define the workspace where related tasks belong."
            />

            <WorkflowStep
              number="02"
              title="Assign tasks"
              description="Add priority, due date, labels and an assignee."
            />

            <WorkflowStep
              number="03"
              title="Track progress"
              description="Move tasks through the board as work advances."
            />
          </div>
        </div>
      </section>

      {/*
       * =========================================================
       * FOOTER
       * =========================================================
       */}

      <footer className="relative z-10 border-t border-[rgb(96_105_144_/_0.16)] bg-[#171824]/72">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 px-4 py-7 text-[9px] font-semibold text-[var(--text-faint)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-[var(--denim-300)]">
              <BrandMiniIcon />
            </span>

            <span className="font-black text-[var(--text-secondary)]">
              DevBoard
            </span>
          </div>

          <p>
            Project and task management workspace
          </p>
        </div>
      </footer>
    </main>
  );
}

/*
 * =========================================================
 * WORKSPACE PREVIEW
 * =========================================================
 */

function WorkspacePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div className="absolute inset-x-[8%] bottom-[-7%] top-[20%] rounded-[2rem] bg-[rgb(131_80_196_/_0.18)] blur-[70px]" />

      <div className="relative overflow-hidden rounded-[24px] border border-[rgb(115_146_181_/_0.22)] bg-[#1a1c2a] shadow-[0_34px_90px_-34px_rgba(0,0,0,.88)]">
        {/*
         * =========================================================
         * PREVIEW TOPBAR
         * =========================================================
         */}

        <div className="flex h-12 items-center border-b border-[rgb(96_105_144_/_0.18)] bg-[#202235]/80 px-3 sm:px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--lilac-300)]/65" />
            <span className="h-2 w-2 rounded-full bg-[var(--denim-300)]/65" />
            <span className="h-2 w-2 rounded-full bg-[var(--pale-sky)]/55" />
          </div>

          <div className="mx-auto flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.14em] text-[var(--text-faint)]">
            <BrandMiniIcon />
            DevBoard workspace
          </div>

          <span className="w-[34px]" />
        </div>

        {/*
         * =========================================================
         * PREVIEW SHELL
         * =========================================================
         */}

        <div className="grid min-h-[450px] grid-cols-[116px_minmax(0,1fr)] sm:grid-cols-[138px_minmax(0,1fr)]">
          {/*
           * =========================================================
           * PREVIEW SIDEBAR
           * =========================================================
           */}

          <div className="border-r border-[rgb(96_105_144_/_0.16)] bg-[#1d1f2e] p-2.5 sm:p-3">
            <div className="mb-5 flex items-center gap-2 px-1">
              <span className="text-[var(--lilac-300)]">
                <BrandMiniIcon />
              </span>

              <span className="text-[8px] font-black text-[var(--pale-sky)]">
                DevBoard
              </span>
            </div>

            <PreviewNavItem
              active
              icon={
                <DashboardSmallIcon />
              }
              label="Dashboard"
            />

            <PreviewNavItem
              icon={
                <FolderSmallIcon />
              }
              label="Projects"
            />

            <PreviewNavItem
              icon={
                <CheckSquareSmallIcon />
              }
              label="My Tasks"
            />
          </div>

          {/*
           * =========================================================
           * PREVIEW CONTENT
           * =========================================================
           */}

          <div className="min-w-0 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[6px] font-black uppercase tracking-[0.15em] text-[var(--lilac-300)]">
                  Active project
                </p>

                <h3 className="db-display-title mt-1 truncate text-[1.05rem] sm:text-[1.25rem]">
                  DevBoard Platform
                </h3>

                <p className="mt-1 text-[7px] text-[var(--text-faint)]">
                  7 tasks · 4 completed
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-[rgb(131_80_196_/_0.28)] bg-[rgb(131_80_196_/_0.12)] px-2 py-1 text-[6px] font-black uppercase tracking-[0.10em] text-[var(--lilac-200)]">
                Active
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <PreviewMetric
                label="Progress"
                value="57%"
              />

              <PreviewMetric
                label="Open"
                value="3"
              />

              <PreviewMetric
                label="Done"
                value="4"
              />
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgb(201_224_235_/_0.06)]">
              <div className="h-full w-[57%] rounded-full bg-[linear-gradient(90deg,#7392b5,#8350c4)]" />
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <PreviewColumn
                title="To do"
                count={2}
                tone="purple"
              >
                <PreviewTask
                  title="Create auth flow"
                  priority="High"
                  tone="purple"
                />

                <PreviewTask
                  title="Responsive QA"
                  priority="Medium"
                  tone="blue"
                />
              </PreviewColumn>

              <PreviewColumn
                title="In progress"
                count={1}
                tone="blue"
              >
                <PreviewTask
                  title="Project permissions"
                  priority="High"
                  tone="purple"
                />
              </PreviewColumn>

              <PreviewColumn
                title="Done"
                count={4}
                tone="sky"
              >
                <PreviewTask
                  title="Dashboard layout"
                  priority="Medium"
                  tone="blue"
                />

                <PreviewTask
                  title="Task board"
                  priority="Low"
                  tone="sky"
                />
              </PreviewColumn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * PREVIEW NAV ITEM
 * =========================================================
 */

function PreviewNavItem({
  active = false,
  icon,
  label,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      className={`mb-1.5 flex items-center gap-2 rounded-lg border px-2 py-2 text-[7px] font-bold ${
        active
          ? "border-[rgb(131_80_196_/_0.32)] bg-[linear-gradient(135deg,rgba(131,80,196,.30),rgba(109,54,222,.15))] text-[var(--sky-100)]"
          : "border-transparent text-[var(--text-faint)]"
      }`}
    >
      <span
        className={
          active
            ? "text-[var(--lilac-200)]"
            : "text-[var(--denim-300)]"
        }
      >
        {icon}
      </span>

      <span className="truncate">
        {label}
      </span>
    </div>
  );
}

/*
 * =========================================================
 * PREVIEW METRIC
 * =========================================================
 */

function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[rgb(96_105_144_/_0.18)] bg-[#202235]/75 p-2">
      <p className="text-[5px] font-black uppercase tracking-[0.11em] text-[var(--text-faint)]">
        {label}
      </p>

      <p className="mt-1 text-[9px] font-black text-[var(--pale-sky)]">
        {value}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PREVIEW COLUMN
 * =========================================================
 */

function PreviewColumn({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone:
    | "purple"
    | "blue"
    | "sky";
  children: ReactNode;
}) {
  const styles = {
    purple:
      "border-[rgb(131_80_196_/_0.24)] bg-[#242138]",

    blue:
      "border-[rgb(115_146_181_/_0.26)] bg-[#222a3d]",

    sky:
      "border-[rgb(185_228_248_/_0.18)] bg-[#22313a]",
  };

  return (
    <div
      className={`min-w-0 rounded-xl border p-2 ${styles[tone]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[6px] font-black text-[var(--pale-sky)]">
          {title}
        </p>

        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(201_224_235_/_0.06)] px-1 text-[5px] font-black text-[var(--denim-300)]">
          {count}
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * PREVIEW TASK
 * =========================================================
 */

function PreviewTask({
  title,
  priority,
  tone,
}: {
  title: string;
  priority: string;
  tone:
    | "purple"
    | "blue"
    | "sky";
}) {
  const styles = {
    purple:
      "text-[var(--lilac-200)]",

    blue:
      "text-[var(--denim-300)]",

    sky:
      "text-[#b9e4f8]",
  };

  return (
    <div className="rounded-lg border border-[rgb(96_105_144_/_0.18)] bg-[#1e2030] p-2">
      <p
        className={`text-[5px] font-black uppercase tracking-[0.08em] ${styles[tone]}`}
      >
        {priority}
      </p>

      <p className="mt-1.5 line-clamp-2 text-[6px] font-bold leading-3 text-[var(--text-secondary)]">
        {title}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * CAPABILITY CHIP
 * =========================================================
 */

function CapabilityChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[rgb(96_105_144_/_0.22)] bg-[#202235]/60 px-3 py-2 text-[8px] font-bold text-[var(--text-secondary)] backdrop-blur-sm">
      <span className="text-[var(--denim-300)]">
        {icon}
      </span>

      {label}
    </div>
  );
}

/*
 * =========================================================
 * FEATURE CARD
 * =========================================================
 */

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone:
    | "purple"
    | "blue";
}) {
  const iconStyle =
    tone === "purple"
      ? "border-[rgb(131_80_196_/_0.28)] bg-[rgb(131_80_196_/_0.12)] text-[var(--lilac-200)]"
      : "border-[rgb(115_146_181_/_0.28)] bg-[rgb(115_146_181_/_0.12)] text-[var(--denim-300)]";

  return (
    <article className="group rounded-[18px] border border-[rgb(96_105_144_/_0.24)] bg-[#202235]/72 p-5 transition-all hover:-translate-y-1 hover:border-[rgb(115_146_181_/_0.38)] hover:bg-[#24263a]">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconStyle}`}
      >
        {icon}
      </div>

      <h3 className="db-display-title mt-5 text-[1.12rem]">
        {title}
      </h3>

      <p className="mt-2 text-[10px] leading-5 text-[var(--text-muted)]">
        {description}
      </p>
    </article>
  );
}

/*
 * =========================================================
 * WORKFLOW STEP
 * =========================================================
 */

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[18px] border border-[rgb(96_105_144_/_0.24)] bg-[#202235]/68 p-5">
      <span className="absolute right-4 top-3 db-display-title text-[2rem] text-[rgb(201_224_235_/_0.05)]">
        {number}
      </span>

      <div className="relative">
        <span className="text-[7px] font-black uppercase tracking-[0.16em] text-[var(--lilac-300)]">
          Step {number}
        </span>

        <h3 className="db-display-title mt-3 text-[1.05rem]">
          {title}
        </h3>

        <p className="mt-2 text-[9px] leading-5 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
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

function BrandMiniIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M12 2c.9 6.3 3.7 9.1 10 10-6.3.9-9.1 3.7-10 10-.9-6.3-3.7-9.1-10-10 6.3-.9 9.1-3.7 10-10Z"
        fill="currentColor"
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

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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

function BoardSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M4 5h5v14H4V5Zm7 0h4v9h-4V5Zm6 0h3v12h-3V5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="16"
        cy="9"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M4 19c.4-3.4 2.2-5 5-5s4.6 1.6 5 5M14 14.5c2.7 0 4.4 1.3 4.8 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgressSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M4 17V7M10 17v-4M16 17V9M22 17V5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="4"
        width="6"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FolderSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3 w-3"
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

function CheckSquareSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3 w-3"
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
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default HomePage;