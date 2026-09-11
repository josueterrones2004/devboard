import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getProjects,
  type Project,
  type ProjectIcon,
} from "../services/projectService";

import {
  getMyTasks,
  getProjectTasks,
  type MyTask,
  type Task,
} from "../services/taskService";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ProjectTasksMap = Record<
  string,
  Task[]
>;

type MetricTone =
  | "lilac"
  | "denim"
  | "sky"
  | "violet";

/*
 * =========================================================
 * DASHBOARD PAGE
 * =========================================================
 */

function DashboardPage() {
  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    myTasks,
    setMyTasks,
  ] = useState<MyTask[]>([]);

  const [
    projectTasks,
    setProjectTasks,
  ] = useState<ProjectTasksMap>(
    {},
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * =========================================================
   * INITIAL DATA
   * =========================================================
   */

  useEffect(() => {
    let active = true;

    const loadDashboard =
      async () => {
        setLoading(true);
        setError("");

        try {
          const projectResponse =
            await getProjects();

          const currentProjects =
            projectResponse.projects;

          const [
            taskResponse,
            projectTaskEntries,
          ] = await Promise.all([
            getMyTasks(),

            Promise.all(
              currentProjects.map(
                async (
                  project,
                ) => {
                  try {
                    const response =
                      await getProjectTasks(
                        project._id,
                      );

                    return [
                      project._id,
                      response.tasks,
                    ] as const;
                  } catch {
                    return [
                      project._id,
                      [],
                    ] as const;
                  }
                },
              ),
            ),
          ]);

          if (!active) {
            return;
          }

          setProjects(
            currentProjects,
          );

          setMyTasks(
            taskResponse.tasks,
          );

          setProjectTasks(
            Object.fromEntries(
              projectTaskEntries,
            ),
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load dashboard",
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  /*
   * =========================================================
   * WORKSPACE DATA
   * =========================================================
   */

  const workspaceTasks =
    useMemo(
      () =>
        Object.values(
          projectTasks,
        ).flat(),
      [projectTasks],
    );

  const openTasks =
    workspaceTasks.filter(
      (task) =>
        task.status !== "done",
    );

  const completedTasks =
    workspaceTasks.filter(
      (task) =>
        task.status === "done",
    );

  const totalTasks =
    workspaceTasks.length;

  const completionRate =
    totalTasks > 0
      ? Math.round(
          (completedTasks.length /
            totalTasks) *
            100,
        )
      : 0;

  /*
   * =========================================================
   * TODAY DATA
   * =========================================================
   */

  const todayTasks =
    myTasks.filter(
      (task) =>
        task.status !== "done" &&
        task.dueDate &&
        isToday(
          task.dueDate,
        ),
    );

  const highPriorityToday =
    todayTasks.filter(
      (task) =>
        task.priority === "high",
    ).length;

  const dueThisWeek =
    myTasks.filter(
      (task) =>
        task.status !== "done" &&
        task.dueDate &&
        isWithinNextDays(
          task.dueDate,
          7,
        ),
    ).length;

  /*
   * =========================================================
   * PROJECT DATA
   * =========================================================
   */

  const activeProjects =
    projects.filter(
      (project) =>
        project.status === "active",
    ).length;

  /*
   * =========================================================
   * COMPLETED THIS MONTH
   * =========================================================
   */

  const completedThisMonth =
    workspaceTasks.filter(
      (task) =>
        task.status === "done" &&
        isThisMonth(
          task.updatedAt,
        ),
    ).length;

  /*
   * =========================================================
   * RECENT PROJECTS
   * =========================================================
   */

  const recentProjects =
    useMemo(
      () =>
        [...projects]
          .sort(
            (a, b) =>
              new Date(
                b.updatedAt,
              ).getTime() -
              new Date(
                a.updatedAt,
              ).getTime(),
          )
          .slice(0, 5),
      [projects],
    );

  const featuredProject =
    recentProjects[0] ?? null;

  const secondaryProjects =
    recentProjects.slice(1);

  /*
   * =========================================================
   * UPCOMING TASKS
   * =========================================================
   */

  const upcomingTasks =
    useMemo(
      () =>
        [...myTasks]
          .filter(
            (task) =>
              task.status !==
                "done" &&
              task.dueDate,
          )
          .sort(
            (a, b) =>
              new Date(
                a.dueDate!,
              ).getTime() -
              new Date(
                b.dueDate!,
              ).getTime(),
          )
          .slice(0, 5),
      [myTasks],
    );

  /*
   * =========================================================
   * COMPLETION SERIES
   * =========================================================
   */

  const completionSeries =
    useMemo(
      () =>
        buildCompletionSeries(
          workspaceTasks,
        ),
      [workspaceTasks],
    );

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[620px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--lilac-300)]" />

          Loading workspace...
        </div>
      </div>
    );
  }

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
          "#1d1c2c",

        backgroundImage: `
          linear-gradient(
            rgba(201, 224, 235, 0.035) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(201, 224, 235, 0.035) 1px,
            transparent 1px
          ),
          radial-gradient(
            ellipse at 42% -8%,
            rgba(115, 146, 181, 0.19),
            transparent 34rem
          ),
          radial-gradient(
            ellipse at 86% 2%,
            rgba(131, 80, 196, 0.17),
            transparent 31rem
          ),
          linear-gradient(
            135deg,
            #1d1c2c 0%,
            #211f35 48%,
            #1d1c2c 100%
          )
        `,

        backgroundSize:
          "46px 46px, 46px 46px, auto, auto, auto",
      }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        {/*
         * =========================================================
         * ERROR
         * =========================================================
         */}

        {error && (
          <div className="mb-5 rounded-2xl border border-[var(--border-purple)] bg-[var(--accent-soft)] px-5 py-4 text-sm font-semibold text-[var(--text-primary)]">
            {error}
          </div>
        )}

        {/*
         * =========================================================
         * TOP ROW
         * =========================================================
         */}

        <section className="grid items-stretch gap-4 xl:grid-cols-[1.62fr_0.94fr]">
          {/*
           * =========================================================
           * TODAY OVERVIEW
           * =========================================================
           */}

          <div
            className="relative min-h-[230px] overflow-hidden rounded-[22px] border border-[rgb(131_80_196_/_0.48)] px-7 py-6 shadow-[0_24px_65px_-40px_rgba(91,42,189,.45)]"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at 88% 42%,
                  rgba(109, 54, 222, 0.22),
                  transparent 17rem
                ),
                radial-gradient(
                  circle at 52% 120%,
                  rgba(115, 146, 181, 0.10),
                  transparent 22rem
                ),
                linear-gradient(
                  120deg,
                  #211c35 0%,
                  #25203e 44%,
                  #2e264f 78%,
                  #332651 100%
                )
              `,
            }}
          >
            {/*
             * =========================================================
             * TODAY GRID
             * =========================================================
             */}

            <div
              className="pointer-events-none absolute inset-0 opacity-55"
              style={{
                backgroundImage: `
                  linear-gradient(
                    rgba(201,224,235,.04) 1px,
                    transparent 1px
                  ),
                  linear-gradient(
                    90deg,
                    rgba(201,224,235,.04) 1px,
                    transparent 1px
                  )
                `,

                backgroundSize:
                  "34px 34px",

                maskImage:
                  "linear-gradient(90deg, black, rgba(0,0,0,.70), transparent)",
              }}
            />

            {/*
             * =========================================================
             * TODAY DECORATION
             * =========================================================
             */}

            <div className="pointer-events-none absolute right-6 top-5 hidden h-24 w-24 sm:block">
              <div className="absolute right-0 top-0 h-14 w-14 rounded-[16px] border border-[rgb(201_224_235_/_0.08)] bg-[rgb(201_224_235_/_0.05)]" />

              <div className="absolute bottom-0 left-0 h-12 w-12 rounded-[14px] border border-[rgb(131_80_196_/_0.20)] bg-[rgb(109_54_222_/_0.12)]" />
            </div>

            {/*
             * =========================================================
             * TODAY CONTENT
             * =========================================================
             */}

            <div className="relative z-[2] grid min-h-[180px] gap-7 lg:grid-cols-[minmax(0,1fr)_285px] lg:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.21em] text-[var(--lilac-200)]">
                  Today overview
                </p>

                <h2 className="db-display-title mt-3 text-[2.15rem] leading-[1.06] sm:text-[2.4rem]">
                  {todayTasks.length >
                  0
                    ? `You have ${todayTasks.length} ${
                        todayTasks.length ===
                        1
                          ? "task"
                          : "tasks"
                      } planned today.`
                    : "You have no tasks due today."}
                </h2>

                <p className="mt-2 text-sm font-medium text-[var(--sky-150)]">
                  {highPriorityToday >
                  0
                    ? `${highPriorityToday} ${
                        highPriorityToday ===
                        1
                          ? "is"
                          : "are"
                      } high priority.`
                    : `${dueThisWeek} ${
                        dueThisWeek ===
                        1
                          ? "task is"
                          : "tasks are"
                      } due this week.`}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to={
                      featuredProject
                        ? `/projects/${featuredProject._id}`
                        : "/projects"
                    }
                    className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-[rgb(177_138_235_/_0.55)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 text-xs font-black text-[var(--sky-50)] shadow-[0_16px_32px_-18px_rgba(109,54,222,.75)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    <FolderOpenIcon />

                    View project
                  </Link>

                  <Link
                    to="/my-tasks"
                    className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-[rgb(151_172_219_/_0.28)] bg-[rgb(22_21_38_/_0.48)] px-5 text-xs font-black text-[var(--pale-sky)] transition-colors hover:bg-[rgb(76_81_112_/_0.35)]"
                  >
                    <TaskListIcon />

                    View my tasks
                  </Link>
                </div>
              </div>

              {/*
               * =========================================================
               * TODAY STATS
               * =========================================================
               */}

              <div className="border-t border-[rgb(201_224_235_/_0.11)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <OverviewStat
                  icon={
                    <BoltIcon />
                  }
                  value={
                    highPriorityToday
                  }
                  label="high priority"
                  detail={`out of ${todayTasks.length} today`}
                  tone="lilac"
                />

                <OverviewStat
                  icon={
                    <ClockIcon />
                  }
                  value={
                    dueThisWeek
                  }
                  label="due this week"
                  detail="across your tasks"
                  tone="denim"
                />

                <OverviewStat
                  icon={
                    <FolderIcon />
                  }
                  value={
                    activeProjects
                  }
                  label="active projects"
                  detail="in your workspace"
                  tone="sky"
                />
              </div>
            </div>
          </div>

          {/*
           * =========================================================
           * WORKSPACE PROGRESS
           * =========================================================
           */}

          <div
            className="relative min-h-[230px] overflow-hidden rounded-[22px] border border-[rgb(201_224_235_/_0.72)] p-6 text-[#161526] shadow-[0_24px_65px_-40px_rgba(115,146,181,.42)]"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at 90% 0%,
                  rgba(255,255,255,.88),
                  transparent 13rem
                ),
                linear-gradient(
                  135deg,
                  #c9e0eb 0%,
                  #c3ebfb 48%,
                  #b9e4f8 100%
                )
              `,
            }}
          >
            <div className="relative z-[1] flex min-h-[182px] flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[#6834d3]">
                  Workspace progress
                </p>

                <span className="rounded-lg bg-[rgb(104_52_211_/_0.10)] px-2.5 py-1.5 text-[8px] font-black text-[#5c2abd]">
                  {
                    openTasks.length
                  }{" "}
                  remaining
                </span>
              </div>

              <div>
                <div className="flex items-end justify-between gap-5">
                  <p className="font-[var(--font-display)] text-[4.65rem] font-bold leading-[0.82] tracking-[-0.075em]">
                    {completionRate}%
                  </p>

                  <div className="mb-1 text-right">
                    <p className="text-lg font-black text-[#6834d3]">
                      {
                        completedTasks.length
                      }
                      /
                      {
                        totalTasks
                      }
                    </p>

                    <p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-[#4f6074]">
                      Tasks
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-[10px] overflow-hidden rounded-full bg-[rgb(115_146_181_/_0.24)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#5c2abd,#6834d3,#8350c4)] shadow-[0_0_18px_rgba(104,52,211,.28)] transition-all"
                    style={{
                      width: `${completionRate}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-5 text-[10px] font-bold">
                  <span>
                    {
                      completedTasks.length
                    }{" "}
                    of{" "}
                    {totalTasks} tasks
                    completed
                  </span>

                  <span className="text-[#4f6074]">
                    {
                      openTasks.length
                    }{" "}
                    open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
         * =========================================================
         * METRICS
         * =========================================================
         */}

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Today focus"
            value={
              todayTasks.length
            }
            description="tasks planned today"
            href="/my-tasks"
            tone="lilac"
            icon={
              <CalendarIcon />
            }
          />

          <MetricCard
            label="Open tasks"
            value={
              openTasks.length
            }
            description="across all projects"
            href="/my-tasks"
            tone="denim"
            icon={
              <DocumentIcon />
            }
          />

          <MetricCard
            label="Completed"
            value={
              completedThisMonth
            }
            description="this month"
            href="/my-tasks"
            tone="sky"
            icon={
              <CheckIcon />
            }
          />

          <MetricCard
            label="Projects"
            value={
              projects.length
            }
            description={`${activeProjects} active projects`}
            href="/projects"
            tone="violet"
            icon={
              <FolderIcon />
            }
          />
        </section>

        {/*
         * =========================================================
         * MAIN DASHBOARD
         * =========================================================
         */}

        <section className="mt-5 grid items-start gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          {/*
           * =========================================================
           * RECENT PROJECTS
           * =========================================================
           */}

          <div className="overflow-hidden rounded-[22px] border border-[rgb(96_105_144_/_0.34)] bg-[#1f2132] shadow-[0_24px_65px_-48px_rgba(0,0,0,.70)]">
            <DashboardSectionHeader
              title="Recent projects"
              href="/projects"
              tone="purple"
            />

            {featuredProject ? (
              <>
                <FeaturedProjectCard
                  project={
                    featuredProject
                  }
                  tasks={
                    projectTasks[
                      featuredProject
                        ._id
                    ] ?? []
                  }
                />

                {secondaryProjects.length >
                  0 && (
                  <div className="grid gap-px border-t border-[rgb(96_105_144_/_0.18)] bg-[rgb(96_105_144_/_0.18)] sm:grid-cols-2">
                    {secondaryProjects.map(
                      (
                        project,
                      ) => (
                        <CompactProjectCard
                          key={
                            project._id
                          }
                          project={
                            project
                          }
                          tasks={
                            projectTasks[
                              project._id
                            ] ?? []
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No projects yet"
                text="Create your first project to see it here."
              />
            )}
          </div>

          {/*
           * =========================================================
           * RIGHT COLUMN
           * =========================================================
           */}

          <div className="space-y-4">
            {/*
             * =========================================================
             * UPCOMING TASKS
             * =========================================================
             */}

            <div className="overflow-hidden rounded-[22px] border border-[rgb(96_105_144_/_0.34)] bg-[#1f2132] shadow-[0_24px_65px_-48px_rgba(0,0,0,.70)]">
              <DashboardSectionHeader
                title="Upcoming tasks"
                href="/my-tasks"
                tone="sky"
              />

              <div className="space-y-2.5 p-4">
                {upcomingTasks.length >
                0 ? (
                  upcomingTasks.map(
                    (
                      task,
                      index,
                    ) => (
                      <UpcomingTaskRow
                        key={
                          task._id
                        }
                        task={task}
                        featured={
                          index === 0
                        }
                      />
                    ),
                  )
                ) : (
                  <EmptyState
                    title="No upcoming tasks"
                    text="There are no pending deadlines."
                  />
                )}
              </div>
            </div>

            {/*
             * =========================================================
             * TASK COMPLETION
             * =========================================================
             */}

            <div className="rounded-[22px] border border-[rgb(96_105_144_/_0.34)] bg-[#1f2132] p-5 shadow-[0_24px_65px_-48px_rgba(0,0,0,.70)]">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
                    Task completion
                  </p>

                  <h3 className="db-display-title mt-1 text-[1.4rem]">
                    Last 7 days
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-[var(--pale-sky)]">
                    {
                      completedTasks.length
                    }
                  </p>

                  <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Completed
                  </p>
                </div>
              </div>

              <CompletionChart
                data={
                  completionSeries
                }
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * OVERVIEW STAT
 * =========================================================
 */

function OverviewStat({
  icon,
  value,
  label,
  detail,
  tone,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  detail: string;
  tone:
    | "lilac"
    | "denim"
    | "sky";
}) {
  const styles = {
    lilac: {
      box:
        "bg-[rgb(109_54_222_/_0.18)] border-[rgb(177_138_235_/_0.18)]",

      icon:
        "text-[var(--lilac-200)]",
    },

    denim: {
      box:
        "bg-[rgb(76_81_112_/_0.48)] border-[rgb(151_172_219_/_0.18)]",

      icon:
        "text-[var(--denim-300)]",
    },

    sky: {
      box:
        "bg-[rgb(96_101_140_/_0.38)] border-[rgb(201_224_235_/_0.14)]",

      icon:
        "text-[var(--sky-200)]",
    },
  };

  const style =
    styles[tone];

  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.box} ${style.icon}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-black text-[var(--pale-sky)]">
          {value} {label}
        </p>

        <p className="mt-0.5 text-[9px] font-medium text-[var(--text-muted)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * METRIC CARD
 * =========================================================
 */

function MetricCard({
  label,
  value,
  description,
  href,
  tone,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  tone: MetricTone;
  icon: ReactNode;
}) {
  const styles: Record<
    MetricTone,
    {
      card: string;
      icon: string;
      value: string;
    }
  > = {
    lilac: {
      card:
        "border-[rgb(131_80_196_/_0.36)] bg-[linear-gradient(135deg,#1f2132,#29223b)]",

      icon:
        "bg-[#4a2d75] text-[var(--lilac-200)]",

      value:
        "text-[var(--pale-sky)]",
    },

    denim: {
      card:
        "border-[rgb(115_146_181_/_0.42)] bg-[linear-gradient(135deg,#26344b,#252b3c)]",

      icon:
        "bg-[#365478] text-[#b9e4f8]",

      value:
        "text-[#b9e4f8]",
    },

    sky: {
      card:
        "border-[rgb(105_145_165_/_0.42)] bg-[linear-gradient(135deg,#304f65,#253842)]",

      icon:
        "bg-[#346371] text-[#a0e1f4]",

      value:
        "text-[#a0e1f4]",
    },

    violet: {
      card:
        "border-[rgb(131_80_196_/_0.34)] bg-[linear-gradient(135deg,#251f35,#312441)]",

      icon:
        "bg-[#4a2d75] text-[var(--lilac-200)]",

      value:
        "text-[var(--pale-sky)]",
    },
  };

  const style =
    styles[tone];

  return (
    <Link
      to={href}
      className={`group flex min-h-[102px] items-center gap-4 rounded-[18px] border p-4 shadow-[0_18px_45px_-38px_rgba(0,0,0,.70)] transition-all hover:-translate-y-0.5 hover:brightness-110 ${style.card}`}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-[var(--font-display)] text-base font-bold text-[var(--pale-sky)]">
          {label}
        </p>

        <p
          className={`mt-0.5 text-3xl font-black leading-none tracking-[-0.05em] ${style.value}`}
        >
          {value}
        </p>

        <p className="mt-1 text-[10px] font-medium text-[var(--text-muted)]">
          {description}
        </p>
      </div>

      <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--denim-300)] transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/*
 * =========================================================
 * SECTION HEADER
 * =========================================================
 */

function DashboardSectionHeader({
  title,
  href,
  tone,
}: {
  title: string;
  href: string;
  tone:
    | "purple"
    | "sky";
}) {
  return (
    <div className="flex h-[58px] items-center justify-between gap-4 border-b border-[rgb(96_105_144_/_0.18)] px-5">
      <h3 className="db-display-title text-[1.5rem]">
        {title}
      </h3>

      <Link
        to={href}
        className={`group flex items-center gap-2 text-[10px] font-bold transition-colors ${
          tone === "purple"
            ? "text-[var(--lilac-300)] hover:text-[var(--pale-sky)]"
            : "text-[var(--denim-300)] hover:text-[var(--pale-sky)]"
        }`}
      >
        View all

        <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/*
 * =========================================================
 * FEATURED PROJECT
 * =========================================================
 */

function FeaturedProjectCard({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const progress =
    getTaskProgress(tasks);

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group relative grid gap-5 overflow-hidden bg-[linear-gradient(135deg,#2e264f,#25263a)] p-5 transition-all hover:brightness-110 lg:grid-cols-[104px_minmax(0,1fr)_170px]"
    >
      <ProjectGlyph
        project={
          project
        }
        large
      />

      <div className="min-w-0 self-center">
        <div className="flex items-center gap-2.5">
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
            Featured project
          </p>

          <ProjectStatusBadge
            status={
              project.status
            }
          />
        </div>

        <h4 className="db-display-title mt-2 truncate text-[1.65rem]">
          {project.name}
        </h4>

        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
          {project.description ||
            "No description."}
        </p>

        <div className="mt-3 flex gap-5 text-[9px] font-semibold text-[var(--denim-300)]">
          <span>
            {
              project.members.length
            }{" "}
            {project.members.length ===
            1
              ? "member"
              : "members"}
          </span>

          <span>
            Updated{" "}
            {formatDate(
              project.updatedAt,
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-center border-t border-[rgb(96_105_144_/_0.18)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div className="flex items-end justify-between">
          <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Progress
          </span>

          <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--pale-sky)]">
            {progress}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#35374c]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7392b5,#8350c4,#c6a8ee)]"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-3 flex justify-between text-[8px] text-[var(--text-faint)]">
          <span>
            {
              tasks.filter(
                (task) =>
                  task.status ===
                  "done",
              ).length
            }{" "}
            done
          </span>

          <span>
            {tasks.length} total
          </span>
        </div>
      </div>
    </Link>
  );
}

/*
 * =========================================================
 * COMPACT PROJECT
 * =========================================================
 */

function CompactProjectCard({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const progress =
    getTaskProgress(tasks);

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group flex min-h-[118px] gap-4 bg-[#1f2132] p-4 transition-colors hover:bg-[#292a3d]"
    >
      <ProjectGlyph
        project={
          project
        }
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h4 className="min-w-0 truncate font-[var(--font-display)] text-base font-bold text-[var(--pale-sky)]">
            {project.name}
          </h4>

          <div className="flex shrink-0 items-center gap-2">
            <ProjectStatusBadge
              status={
                project.status
              }
            />

            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--denim-300)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-[rgb(201_224_235_/_0.07)] group-hover:text-[var(--pale-sky)]">
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </div>
        </div>

        <p className="mt-1 truncate text-[9px] text-[var(--text-muted)]">
          {project.description ||
            "No description."}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#35374c]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7392b5,#8350c4)]"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="text-[8px] font-black text-[var(--denim-300)]">
            {progress}%
          </span>
        </div>

        <p className="mt-2 text-[8px] text-[var(--text-faint)]">
          Updated{" "}
          {formatDate(
            project.updatedAt,
          )}
        </p>
      </div>
    </Link>
  );
}

/*
 * =========================================================
 * PROJECT GLYPH
 * =========================================================
 */

function ProjectGlyph({
  project,
  large = false,
}: {
  project: Project;
  large?: boolean;
}) {
  const variant =
    getGlyphVariant(
      project.name,
    );

  const gradients = [
    "linear-gradient(135deg,#8350c4,#6d36de,#402b47)",
    "linear-gradient(135deg,#7392b5,#506e91,#402b47)",
    "linear-gradient(135deg,#8350c4,#7392b5,#402b47)",
    "linear-gradient(135deg,#c9e0eb,#7392b5,#402b47)",
    "linear-gradient(135deg,#765d7e,#8350c4,#6d36de)",
  ];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden text-[var(--sky-50)] shadow-[0_18px_40px_-28px_rgba(109,54,222,.60)] ${
        large
          ? "h-[104px] w-[104px] rounded-[20px]"
          : "h-14 w-14 rounded-[14px]"
      }`}
      style={{
        background:
          gradients[variant],

        boxShadow: `
          inset 0 0 0 1px rgba(201,224,235,0.12),
          0 18px 40px -28px rgba(109,54,222,0.60)
        `,
      }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/15 blur-xl" />

      <div
        className={
          large
            ? "relative h-11 w-11"
            : "relative h-6 w-6"
        }
      >
        <ProjectGlyphIcon
          icon={
            project.icon ??
            "folder"
          }
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * PROJECT GLYPH ICON
 * =========================================================
 */

function ProjectGlyphIcon({
  icon,
}: {
  icon: ProjectIcon;
}) {
  if (
    icon ===
    "code"
  ) {
    return (
      <ProjectSvgIcon>
        <path
          d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "terminal"
  ) {
    return (
      <ProjectSvgIcon>
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="m7 9 3 3-3 3M12.5 15H17"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "database"
  ) {
    return (
      <ProjectSvgIcon>
        <ellipse
          cx="12"
          cy="6"
          rx="7"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "server"
  ) {
    return (
      <ProjectSvgIcon>
        <rect
          x="4"
          y="4"
          width="16"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="4"
          y="14"
          width="16"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M8 7h.01M8 17h.01M12 7h5M12 17h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "globe"
  ) {
    return (
      <ProjectSvgIcon>
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M3.5 12h17M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3C9.6 5.5 8.4 8.5 8.4 12s1.2 6.5 3.6 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "layers"
  ) {
    return (
      <ProjectSvgIcon>
        <path
          d="m12 4 8 4-8 4-8-4 8-4Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />

        <path
          d="m4 12 8 4 8-4M4 16l8 4 8-4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "package"
  ) {
    return (
      <ProjectSvgIcon>
        <path
          d="m4 8 8-4 8 4-8 4-8-4Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />

        <path
          d="M4 8v8l8 4 8-4V8M12 12v8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "cpu"
  ) {
    return (
      <ProjectSvgIcon>
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <rect
          x="10"
          y="10"
          width="4"
          height="4"
          rx=".7"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </ProjectSvgIcon>
    );
  }

  if (
    icon ===
    "rocket"
  ) {
    return (
      <ProjectSvgIcon>
        <path
          d="M14.5 4.5c2.2-1.4 4.6-1.5 5-1.1.4.4.3 2.8-1.1 5L13 13.8 8.2 9l6.3-4.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />

        <path
          d="M8.5 9H5l-2 4 5 1M13 13.5V17l-4 2-1-5M15.5 7.5h.01"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ProjectSvgIcon>
    );
  }

  return (
    <ProjectSvgIcon>
      <path
        d="M4 7.5h6l2-2h8v13H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </ProjectSvgIcon>
  );
}

/*
 * =========================================================
 * PROJECT SVG ICON
 * =========================================================
 */

function ProjectSvgIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/*
 * =========================================================
 * PROJECT STATUS
 * =========================================================
 */

function ProjectStatusBadge({
  status,
}: {
  status: Project["status"];
}) {
  const styles: Record<
    Project["status"],
    string
  > = {
    planning:
      "border-[rgb(115_146_181_/_0.30)] bg-[rgb(115_146_181_/_0.14)] text-[var(--denim-300)]",

    active:
      "border-[rgb(131_80_196_/_0.35)] bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-200)]",

    completed:
      "border-[rgb(201_224_235_/_0.25)] bg-[rgb(201_224_235_/_0.11)] text-[var(--sky-200)]",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.11em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/*
 * =========================================================
 * UPCOMING TASK
 * =========================================================
 */

function UpcomingTaskRow({
  task,
  featured,
}: {
  task: MyTask;
  featured: boolean;
}) {
  return (
    <Link
      to={`/projects/${task.project._id}`}
      className={`group grid overflow-hidden rounded-[16px] border transition-all hover:-translate-y-0.5 ${
        featured
          ? "grid-cols-[86px_minmax(0,1fr)] border-[rgb(131_80_196_/_0.38)] bg-[#2c2e4a]"
          : "grid-cols-[76px_minmax(0,1fr)] border-[rgb(96_105_144_/_0.24)] bg-[#25283b] hover:border-[rgb(131_80_196_/_0.35)]"
      }`}
    >
      <TaskDate
        date={
          task.dueDate!
        }
        featured={
          featured
        }
      />

      <div className="flex min-w-0 items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <PriorityBadge
            priority={
              task.priority
            }
          />

          <h4 className="mt-2 truncate font-[var(--font-display)] text-base font-bold text-[var(--pale-sky)]">
            {task.title}
          </h4>

          <div className="mt-1.5 flex flex-wrap gap-4 text-[9px] font-medium text-[var(--text-muted)]">
            <span>
              {
                task.project.name
              }
            </span>

            <span>
              Due{" "}
              {formatDate(
                task.dueDate!,
              )}
            </span>
          </div>
        </div>

        <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--denim-300)] transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

/*
 * =========================================================
 * TASK DATE
 * =========================================================
 */

function TaskDate({
  date,
  featured,
}: {
  date: string;
  featured: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center ${
        featured
          ? "bg-[#b9e4f8] text-[#161526]"
          : "bg-[#304f65] text-[var(--sky-50)]"
      }`}
    >
      {featured && (
        <div className="absolute inset-x-0 top-0 h-1 bg-[#6834d3]" />
      )}

      <p className="text-[8px] font-black uppercase tracking-[0.16em]">
        {formatMonth(
          date,
        )}
      </p>

      <p className="mt-1 text-[2.1rem] font-black leading-none tracking-[-0.07em]">
        {formatDay(
          date,
        )}
      </p>

      <p className="mt-1 text-[7px] font-black uppercase tracking-[0.14em] opacity-65">
        {formatWeekday(
          date,
        )}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PRIORITY
 * =========================================================
 */

function PriorityBadge({
  priority,
}: {
  priority:
    | "low"
    | "medium"
    | "high";
}) {
  const styles = {
    low:
      "bg-[rgb(115_146_181_/_0.15)] text-[var(--denim-300)]",

    medium:
      "bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-200)]",

    high:
      "bg-[rgb(109_54_222_/_0.22)] text-[var(--lilac-200)]",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.11em] ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

/*
 * =========================================================
 * COMPLETION CHART
 * =========================================================
 */

function CompletionChart({
  data,
}: {
  data: {
    label: string;
    value: number;
  }[];
}) {
  const maximum =
    Math.max(
      1,
      ...data.map(
        (item) =>
          item.value,
      ),
    );

  const colors = [
    "#6834d3",
    "#7392b5",
    "#8350c4",
    "#97acdb",
    "#5c2abd",
    "#7392b5",
    "#b9e4f8",
  ];

  return (
    <div className="mt-5">
      <div className="grid h-[105px] grid-cols-7 items-end gap-3 border-b border-[rgb(96_105_144_/_0.18)] px-1 pb-2">
        {data.map(
          (
            item,
            index,
          ) => {
            const height =
              item.value === 0
                ? 7
                : Math.max(
                    18,
                    Math.round(
                      (item.value /
                        maximum) *
                        85,
                    ),
                  );

            return (
              <div
                key={`${item.label}-${index}`}
                className="flex h-full items-end justify-center"
              >
                <div
                  className="w-full max-w-8 rounded-t-md"
                  style={{
                    height,

                    background:
                      colors[
                        index
                      ],
                  }}
                />
              </div>
            );
          },
        )}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-3 text-center">
        {data.map(
          (
            item,
            index,
          ) => (
            <div
              key={`${item.label}-${index}-label`}
            >
              <p className="text-[7px] font-black uppercase text-[var(--text-faint)]">
                {item.label}
              </p>

              <p className="mt-1 text-[8px] font-black text-[var(--sky-200)]">
                {item.value}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * EMPTY STATE
 * =========================================================
 */

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-300)]">
        <FolderIcon />
      </div>

      <p className="mt-4 text-sm font-black text-[var(--pale-sky)]">
        {title}
      </p>

      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {text}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PROJECT HELPERS
 * =========================================================
 */

function getTaskProgress(
  tasks: Task[],
) {
  if (tasks.length === 0) {
    return 0;
  }

  const completed =
    tasks.filter(
      (task) =>
        task.status === "done",
    ).length;

  return Math.round(
    (completed /
      tasks.length) *
      100,
  );
}

function getGlyphVariant(
  value: string,
) {
  let total = 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    total +=
      value.charCodeAt(
        index,
      );
  }

  return total % 5;
}

/*
 * =========================================================
 * COMPLETION SERIES
 * =========================================================
 */

function buildCompletionSeries(
  tasks: Task[],
) {
  const result: {
    label: string;
    value: number;
  }[] = [];

  const today =
    new Date();

  for (
    let offset = 6;
    offset >= 0;
    offset -= 1
  ) {
    const start =
      new Date(today);

    start.setHours(
      0,
      0,
      0,
      0,
    );

    start.setDate(
      start.getDate() -
        offset,
    );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() +
        1,
    );

    const value =
      tasks.filter(
        (task) => {
          if (
            task.status !==
            "done"
          ) {
            return false;
          }

          const updated =
            new Date(
              task.updatedAt,
            );

          return (
            updated >= start &&
            updated < end
          );
        },
      ).length;

    result.push({
      label:
        new Intl.DateTimeFormat(
          "en-US",
          {
            weekday:
              "short",
          },
        )
          .format(start)
          .slice(0, 3),

      value,
    });
  }

  return result;
}

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

function isToday(
  value: string,
) {
  const date =
    new Date(value);

  const today =
    new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );
}

function isThisMonth(
  value: string,
) {
  const date =
    new Date(value);

  const today =
    new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth()
  );
}

function isWithinNextDays(
  value: string,
  days: number,
) {
  const date =
    new Date(value);

  const start =
    new Date();

  start.setHours(
    0,
    0,
    0,
    0,
  );

  const end =
    new Date(start);

  end.setDate(
    end.getDate() +
      days,
  );

  return (
    date >= start &&
    date < end
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function formatMonth(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
    },
  )
    .format(
      new Date(value),
    )
    .toUpperCase();
}

function formatDay(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      day: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function formatWeekday(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "short",
    },
  )
    .format(
      new Date(value),
    )
    .toUpperCase();
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function FolderOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M3.5 7.5h6l2-2h8v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4.5 10h16l-2.2 8.5H2.8L4.5 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TaskListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 7h9M10 12h9M10 17h9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="m4.5 7 1 1 2-2M4.5 12l1 1 2-2M4.5 17l1 1 2-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
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
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M7 3v3M17 3v3M4 9h16M5 5h14v15H5V5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M7 3h7l4 4v14H7V3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3v5h4M10 12h5M10 16h5"
        stroke="currentColor"
        strokeWidth="1.7"
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
      className="h-6 w-6"
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
        d="m8.5 12 2.3 2.4 4.8-5"
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
      className="h-6 w-6"
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

function ChevronRightIcon({
  className,
}: {
  className: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={
        className
      }
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default DashboardPage;