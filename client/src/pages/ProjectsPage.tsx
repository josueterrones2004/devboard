import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  Link,
} from "react-router-dom";

import ErrorToast from "../components/ErrorToast";

import {
  ApiError,
} from "../services/api";

import {
  createProject,
  getProjects,
  type Project,
  type ProjectIcon,
  type ProjectStatus,
} from "../services/projectService";

import {
  getProjectTasks,
  type Task,
} from "../services/taskService";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type Filter =
  | "all"
  | ProjectStatus;

type SortOption =
  | "updated"
  | "name"
  | "progress";

type ProjectTasksMap = Record<
  string,
  Task[]
>;

type IconOption = {
  label: string;
  value: ProjectIcon;
};

/*
 * =========================================================
 * OPTIONS
 * =========================================================
 */

const filters: {
  label: string;
  value: Filter;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Planning",
    value: "planning",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Completed",
    value: "completed",
  },
];

const sortOptions: {
  label: string;
  value: SortOption;
}[] = [
  {
    label: "Last updated",
    value: "updated",
  },
  {
    label: "Name",
    value: "name",
  },
  {
    label: "Progress",
    value: "progress",
  },
];

const projectStatusOptions: {
  label: string;
  description: string;
  value: ProjectStatus;
}[] = [
  {
    label: "Planning",
    description: "Work is being prepared.",
    value: "planning",
  },
  {
    label: "Active",
    description: "Work is currently underway.",
    value: "active",
  },
  {
    label: "Completed",
    description: "The project is already finished.",
    value: "completed",
  },
];

const projectIconOptions: IconOption[] = [
  {
    label: "Folder",
    value: "folder",
  },
  {
    label: "Code",
    value: "code",
  },
  {
    label: "Terminal",
    value: "terminal",
  },
  {
    label: "Database",
    value: "database",
  },
  {
    label: "Server",
    value: "server",
  },
  {
    label: "Globe",
    value: "globe",
  },
  {
    label: "Layers",
    value: "layers",
  },
  {
    label: "Package",
    value: "package",
  },
  {
    label: "CPU",
    value: "cpu",
  },
  {
    label: "Rocket",
    value: "rocket",
  },
];

/*
 * =========================================================
 * PROJECTS PAGE
 * =========================================================
 */

function ProjectsPage() {
  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    projectTasks,
    setProjectTasks,
  ] = useState<ProjectTasksMap>(
    {},
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<Filter>(
    "all",
  );

  const [
    sort,
    setSort,
  ] = useState<SortOption>(
    "updated",
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  /*
   * =========================================================
   * INITIAL DATA
   * =========================================================
   */

  useEffect(() => {
    let active = true;

    const loadProjects =
      async () => {
        setLoading(true);

        setError("");

        try {
          const response =
            await getProjects();

          const currentProjects =
            response.projects;

          const taskEntries =
            await Promise.all(
              currentProjects.map(
                async (
                  project,
                ) => {
                  try {
                    const taskResponse =
                      await getProjectTasks(
                        project._id,
                      );

                    return [
                      project._id,
                      taskResponse.tasks,
                    ] as const;
                  } catch {
                    return [
                      project._id,
                      [],
                    ] as const;
                  }
                },
              ),
            );

          if (!active) {
            return;
          }

          setProjects(
            currentProjects,
          );

          setProjectTasks(
            Object.fromEntries(
              taskEntries,
            ),
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load projects",
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  /*
   * =========================================================
   * COUNTS
   * =========================================================
   */

  const activeCount =
    projects.filter(
      (project) =>
        project.status ===
        "active",
    ).length;

  const planningCount =
    projects.filter(
      (project) =>
        project.status ===
        "planning",
    ).length;

  const completedCount =
    projects.filter(
      (project) =>
        project.status ===
        "completed",
    ).length;

  /*
   * =========================================================
   * FILTER AND SORT
   * =========================================================
   */

  const filteredProjects =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const result =
        projects.filter(
          (project) => {
            const matchesSearch =
              normalizedSearch
                .length === 0 ||
              project.name
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              project.description
                .toLowerCase()
                .includes(
                  normalizedSearch,
                );

            const matchesFilter =
              activeFilter ===
                "all" ||
              project.status ===
                activeFilter;

            return (
              matchesSearch &&
              matchesFilter
            );
          },
        );

      return [...result].sort(
        (a, b) => {
          if (
            sort ===
            "name"
          ) {
            return a.name.localeCompare(
              b.name,
            );
          }

          if (
            sort ===
            "progress"
          ) {
            return (
              getTaskProgress(
                projectTasks[
                  b._id
                ] ?? [],
              ) -
              getTaskProgress(
                projectTasks[
                  a._id
                ] ?? [],
              )
            );
          }

          return (
            new Date(
              b.updatedAt,
            ).getTime() -
            new Date(
              a.updatedAt,
            ).getTime()
          );
        },
      );
    }, [
      activeFilter,
      projectTasks,
      projects,
      search,
      sort,
    ]);

  const featuredProject =
    useMemo(
      () =>
        [...projects].sort(
          (a, b) =>
            new Date(
              b.updatedAt,
            ).getTime() -
            new Date(
              a.updatedAt,
            ).getTime(),
        )[0] ?? null,
      [projects],
    );

  /*
   * =========================================================
   * CREATE PROJECT
   * =========================================================
   */

  const handleProjectCreated = (
    project: Project,
  ) => {
    setProjects(
      (current) => [
        project,
        ...current,
      ],
    );

    setProjectTasks(
      (current) => ({
        ...current,

        [project._id]:
          [],
      }),
    );

    setCreateModalOpen(
      false,
    );
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <>
      <div
        className="min-h-[calc(100vh-86px)]"
        style={{
          backgroundColor:
            "#1b1b2b",

          backgroundImage: `
            linear-gradient(
              rgba(201,224,235,.018) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(201,224,235,.018) 1px,
              transparent 1px
            ),
            radial-gradient(
              ellipse at 34% -10%,
              rgba(115,146,181,.20),
              transparent 35rem
            ),
            radial-gradient(
              ellipse at 84% 0%,
              rgba(131,80,196,.15),
              transparent 30rem
            ),
            linear-gradient(
              135deg,
              #1b1b2b 0%,
              #1e1e31 48%,
              #1b1b2b 100%
            )
          `,

          backgroundSize:
            "56px 56px, 56px 56px, auto, auto, auto",
        }}
      >
        <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {/*
           * =========================================================
           * PAGE HEADER
           * =========================================================
           */}

          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="db-display-title text-[2.55rem] leading-none sm:text-[2.85rem]">
                Projects
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold text-[var(--text-muted)]">
                <span>
                  {projects.length} total
                </span>

                <span className="h-1 w-1 rounded-full bg-[var(--lilac-300)]" />

                <span>
                  {activeCount} active
                </span>

                <span className="h-1 w-1 rounded-full bg-[var(--denim-300)]" />

                <span>
                  {planningCount} planning
                </span>

                <span className="h-1 w-1 rounded-full bg-[var(--sky-300)]" />

                <span>
                  {completedCount} completed
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setCreateModalOpen(
                  true,
                )
              }
              className="inline-flex h-12 items-center justify-center gap-2.5 self-start rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-6 text-xs font-black text-[var(--sky-50)] shadow-[0_16px_32px_-18px_rgba(109,54,222,.78)] transition-all hover:-translate-y-0.5 hover:brightness-110 sm:self-auto"
            >
              <PlusIcon />

              Create project
            </button>
          </section>

          {/*
           * =========================================================
           * PROJECT TOOLBAR
           * =========================================================
           */}

          <section className="relative z-20 mt-6 rounded-[18px] border border-[rgb(96_105_144_/_0.26)] bg-[#1e2032]/65 p-3 backdrop-blur-sm">
            <div className="grid gap-3 xl:grid-cols-[minmax(300px,1fr)_auto_220px] xl:items-center">
              {/*
               * =========================================================
               * SEARCH
               * =========================================================
               */}

              <div className="relative">
                <SearchIcon />

                <input
                  type="search"
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search projects..."
                  className="h-12 w-full rounded-xl border border-[rgb(115_146_181_/_0.30)] bg-[#202235]/90 pl-12 pr-4 text-sm font-semibold text-[var(--pale-sky)] outline-none transition-all placeholder:text-[var(--text-faint)] hover:border-[rgb(148_174_203_/_0.42)] focus:border-[rgb(177_138_235_/_0.52)] focus:ring-4 focus:ring-[rgb(131_80_196_/_0.10)]"
                />
              </div>

              {/*
               * =========================================================
               * FILTERS
               * =========================================================
               */}

              <div className="flex flex-wrap justify-start gap-2 xl:justify-center">
                {filters.map(
                  (
                    filter,
                  ) => {
                    const active =
                      activeFilter ===
                      filter.value;

                    return (
                      <button
                        key={
                          filter.value
                        }
                        type="button"
                        onClick={() =>
                          setActiveFilter(
                            filter.value,
                          )
                        }
                        className={`h-12 rounded-xl border px-5 text-xs font-bold transition-all ${
                          active
                            ? "border-[rgb(177_138_235_/_0.46)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] text-[var(--sky-50)] shadow-[0_14px_30px_-20px_rgba(109,54,222,.80)]"
                            : "border-[rgb(96_105_144_/_0.28)] bg-[#202235] text-[var(--text-secondary)] hover:border-[rgb(115_146_181_/_0.42)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
                        }`}
                      >
                        {
                          filter.label
                        }
                      </button>
                    );
                  },
                )}
              </div>

              {/*
               * =========================================================
               * SORT
               * =========================================================
               */}

              <SortDropdown
                value={
                  sort
                }
                onChange={
                  setSort
                }
              />
            </div>
          </section>

          {/*
           * =========================================================
           * FEATURED PROJECT
           * =========================================================
           */}

          {!loading &&
            !error &&
            featuredProject && (
              <section className="relative z-0 mt-5">
                <FeaturedProject
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
              </section>
            )}

          {/*
           * =========================================================
           * ALL PROJECTS
           * =========================================================
           */}

          <section className="mt-5 flex items-center justify-between gap-4 px-1">
            <h2 className="db-display-title text-[1.65rem]">
              All projects
            </h2>

            {!loading &&
              !error && (
                <p className="text-[10px] font-bold text-[var(--denim-300)]">
                  {
                    filteredProjects.length
                  }{" "}
                  {filteredProjects.length ===
                  1
                    ? "project"
                    : "projects"}
                </p>
              )}
          </section>

          <section className="mt-3">
            {loading && (
              <div className="flex min-h-[320px] items-center justify-center rounded-[20px] border border-[rgb(96_105_144_/_0.30)] bg-[#1f2132]">
                <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)]">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--lilac-300)]" />

                  Loading projects...
                </div>
              </div>
            )}

            {!loading &&
              error && (
                <div className="rounded-[20px] border border-[rgb(177_138_235_/_0.28)] bg-[rgb(131_80_196_/_0.12)] p-5 text-sm font-semibold text-[var(--lilac-200)]">
                  {error}
                </div>
              )}

            {!loading &&
              !error &&
              filteredProjects.length >
                0 && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map(
                    (
                      project,
                    ) => (
                      <ProjectCard
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

            {!loading &&
              !error &&
              filteredProjects.length ===
                0 && (
                <EmptyProjects
                  hasFilters={
                    search
                      .trim()
                      .length >
                      0 ||
                    activeFilter !==
                      "all"
                  }
                  onReset={() => {
                    setSearch(
                      "",
                    );

                    setActiveFilter(
                      "all",
                    );
                  }}
                  onCreate={() =>
                    setCreateModalOpen(
                      true,
                    )
                  }
                />
              )}
          </section>
        </div>
      </div>

      {/*
       * =========================================================
       * CREATE PROJECT MODAL
       * =========================================================
       */}

      {createModalOpen && (
        <CreateProjectModal
          onClose={() =>
            setCreateModalOpen(
              false,
            )
          }
          onCreated={
            handleProjectCreated
          }
        />
      )}
    </>
  );
}

/*
 * =========================================================
 * SORT DROPDOWN
 * =========================================================
 */

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (
    value: SortOption,
  ) => void;
}) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (
      event: MouseEvent,
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    };

    window.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
  ]);

  const selected =
    sortOptions.find(
      (option) =>
        option.value ===
        value,
    ) ??
    sortOptions[0];

  return (
    <div
      ref={
        containerRef
      }
      className={`relative ${
        open
          ? "z-[70]"
          : "z-0"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className="flex h-12 w-full items-center rounded-xl border border-[rgb(96_105_144_/_0.28)] bg-[#202235] px-4 text-left transition-all hover:border-[rgb(115_146_181_/_0.42)]"
      >
        <SortIcon />

        <div className="ml-3 min-w-0 flex-1">
          <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[var(--text-faint)]">
            Sort by
          </p>

          <p className="mt-0.5 truncate text-xs font-bold text-[var(--pale-sky)]">
            {
              selected.label
            }
          </p>
        </div>

        <ChevronDownIcon
          open={
            open
          }
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-full min-w-[190px] overflow-hidden rounded-xl border border-[rgb(96_105_144_/_0.30)] bg-[#202235] p-1.5 shadow-[0_20px_60px_-25px_rgba(0,0,0,.88)]">
          {sortOptions.map(
            (
              option,
            ) => {
              const active =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  onClick={() => {
                    onChange(
                      option.value,
                    );

                    setOpen(
                      false,
                    );
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[10px] font-bold transition-colors ${
                    active
                      ? "bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-200)]"
                      : "text-[var(--text-secondary)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
                  }`}
                >
                  {
                    option.label
                  }

                  {active && (
                    <CheckIcon />
                  )}
                </button>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * FEATURED PROJECT
 * =========================================================
 */

function FeaturedProject({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const progress =
    getTaskProgress(
      tasks,
    );

  const completed =
    tasks.filter(
      (task) =>
        task.status ===
        "done",
    ).length;

  const inProgress =
    tasks.filter(
      (task) =>
        task.status ===
        "in-progress",
    ).length;

  const overdue =
    tasks.filter(
      (task) =>
        task.status !==
          "done" &&
        task.dueDate &&
        isOverdue(
          task.dueDate,
        ),
    ).length;

  return (
    <Link
      to={`/projects/${project._id}`}
      draggable={false}
      onDragStart={(event) =>
        event.preventDefault()
      }
      className="group relative grid overflow-hidden rounded-[20px] border border-[rgb(131_80_196_/_0.46)] shadow-[0_26px_70px_-46px_rgba(109,54,222,.52)] transition-all hover:-translate-y-0.5 hover:border-[rgb(177_138_235_/_0.54)] lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,.92fr)]"
      style={{
        backgroundImage: `
          radial-gradient(
            circle at 84% 20%,
            rgba(131,80,196,.22),
            transparent 19rem
          ),
          linear-gradient(
            120deg,
            #24203a 0%,
            #292343 44%,
            #312650 100%
          )
        `,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(201,224,235,.033) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(201,224,235,.033) 1px,
              transparent 1px
            )
          `,

          backgroundSize:
            "34px 34px",

          maskImage:
            "linear-gradient(90deg, transparent 28%, black 100%)",
        }}
      />

      {/*
       * =========================================================
       * FEATURED INFO
       * =========================================================
       */}

      <div className="relative z-[1] p-5 sm:p-6">
        <p className="font-[var(--font-display)] text-sm font-bold text-[var(--sky-200)]">
          Featured project
        </p>

        <div className="mt-4 flex gap-5">
          <ProjectGlyph
            name={
              project.name
            }
            icon={
              project.icon
            }
            featured
          />

          <div className="min-w-0 self-center">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="db-display-title truncate text-[1.8rem]">
                {
                  project.name
                }
              </h3>

              <ProjectStatusBadge
                status={
                  project.status
                }
              />
            </div>

            <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 text-[var(--text-secondary)]">
              {project.description ||
                "No description provided."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <MemberStack
                members={
                  project.members
                }
                featured
              />

              <div className="flex items-center gap-2 text-[9px] font-semibold text-[var(--denim-300)]">
                <CalendarIcon />

                Updated{" "}
                {formatDate(
                  project.updatedAt,
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
       * =========================================================
       * FEATURED PROGRESS
       * =========================================================
       */}

      <div className="relative z-[1] flex flex-col justify-center border-t border-[rgb(201_224_235_/_0.10)] p-5 sm:p-6 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Progress
          </p>

          <p className="font-[var(--font-display)] text-[1.4rem] font-bold text-[var(--pale-sky)]">
            {progress}% complete
          </p>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#171827]/80">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7392b5,#8350c4,#6d36de)]"
            style={{
              width:
                `${progress}%`,
            }}
          />
        </div>

        <div className="mt-6 grid grid-cols-4 divide-x divide-[rgb(201_224_235_/_0.12)]">
          <FeaturedStat
            value={
              tasks.length
            }
            label="Total tasks"
          />

          <FeaturedStat
            value={
              completed
            }
            label="Completed"
          />

          <FeaturedStat
            value={
              inProgress
            }
            label="In progress"
          />

          <FeaturedStat
            value={
              overdue
            }
            label="Overdue"
          />
        </div>
      </div>
    </Link>
  );
}

/*
 * =========================================================
 * FEATURED STAT
 * =========================================================
 */

function FeaturedStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <p className="text-xl font-black text-[var(--pale-sky)]">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-semibold text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PROJECT CARD
 * =========================================================
 */

function ProjectCard({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const progress =
    getTaskProgress(
      tasks,
    );

  return (
    <Link
      to={`/projects/${project._id}`}
      draggable={false}
      onDragStart={(event) =>
        event.preventDefault()
      }
      className="group flex min-h-[158px] flex-col rounded-[18px] border border-[rgb(96_105_144_/_0.36)] bg-[#202235] p-4 shadow-[0_20px_52px_-44px_rgba(0,0,0,.72)] transition-all hover:-translate-y-1 hover:border-[rgb(131_80_196_/_0.46)] hover:bg-[#25273b]"
    >
      {/*
       * =========================================================
       * PROJECT HEADER
       * =========================================================
       */}

      <div className="flex gap-4">
        <ProjectGlyph
          name={
            project.name
          }
          icon={
            project.icon
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-[var(--font-display)] text-[1.08rem] font-bold text-[var(--pale-sky)]">
                  {
                    project.name
                  }
                </h3>

                <ProjectStatusBadge
                  status={
                    project.status
                  }
                />
              </div>

              <p className="mt-1.5 line-clamp-2 min-h-8 text-[10px] leading-4 text-[var(--text-muted)]">
                {project.description ||
                  "No description provided."}
              </p>
            </div>

            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--denim-300)] transition-all group-hover:translate-x-0.5 group-hover:bg-[rgb(201_224_235_/_0.06)] group-hover:text-[var(--pale-sky)]">
              <ChevronRightIcon />
            </span>
          </div>
        </div>
      </div>

      {/*
       * =========================================================
       * PROJECT PROGRESS
       * =========================================================
       */}

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#35374c]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7392b5,#8350c4,#6d36de)]"
            style={{
              width:
                `${progress}%`,
            }}
          />
        </div>

        <p className="w-8 text-right text-[9px] font-black text-[var(--sky-200)]">
          {progress}%
        </p>
      </div>

      {/*
       * =========================================================
       * PROJECT FOOTER
       * =========================================================
       */}

      <div className="mt-auto flex items-center justify-between gap-4 pt-4">
        <MemberStack
          members={
            project.members
          }
        />

        <div className="flex items-center gap-2 text-[8px] font-semibold text-[var(--denim-300)]">
          <CalendarIcon />

          {formatShortDate(
            project.updatedAt,
          )}
        </div>
      </div>
    </Link>
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
  status: ProjectStatus;
}) {
  const styles: Record<
    ProjectStatus,
    string
  > = {
    active:
      "border-[rgb(131_80_196_/_0.35)] bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-200)]",

    planning:
      "border-[rgb(115_146_181_/_0.30)] bg-[rgb(115_146_181_/_0.14)] text-[var(--denim-300)]",

    completed:
      "border-[rgb(201_224_235_/_0.25)] bg-[rgb(201_224_235_/_0.11)] text-[var(--sky-200)]",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-1 text-[6px] font-black uppercase tracking-[0.11em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/*
 * =========================================================
 * MEMBER STACK
 * =========================================================
 */

function MemberStack({
  members,
  featured = false,
}: {
  members:
    Project["members"];

  featured?: boolean;
}) {
  const visible =
    members.slice(
      0,
      featured
        ? 3
        : 2,
    );

  const remaining =
    Math.max(
      members.length -
        visible.length,
      0,
    );

  return (
    <div className="flex items-center gap-2">
      {!featured && (
        <MembersIcon />
      )}

      <div className="flex">
        {visible.map(
          (
            member,
            index,
          ) => (
            <div
              key={
                member._id
              }
              title={
                member.name
              }
              className={`flex items-center justify-center rounded-full border-2 border-[#202235] font-black text-[var(--sky-50)] ${
                featured
                  ? "h-8 w-8 text-[8px]"
                  : "h-7 w-7 text-[7px]"
              } ${
                index === 0
                  ? ""
                  : "-ml-1.5"
              }`}
              style={{
                background:
                  getMemberGradient(
                    member.name,
                  ),
              }}
            >
              {getInitials(
                member.name,
              )}
            </div>
          ),
        )}

        {remaining > 0 && (
          <div
            className={`-ml-1.5 flex items-center justify-center rounded-full border-2 border-[#202235] bg-[#313449] font-black text-[var(--denim-300)] ${
              featured
                ? "h-8 w-8 text-[8px]"
                : "h-7 w-7 text-[7px]"
            }`}
          >
            +{remaining}
          </div>
        )}
      </div>

      {featured && (
        <span className="text-[9px] font-semibold text-[var(--text-muted)]">
          {members.length}{" "}
          {members.length ===
          1
            ? "member"
            : "members"}
        </span>
      )}
    </div>
  );
}

/*
 * =========================================================
 * PROJECT GLYPH
 * =========================================================
 */

function ProjectGlyph({
  name,
  icon,
  featured = false,
}: {
  name: string;
  icon:
    | ProjectIcon
    | undefined;
  featured?: boolean;
}) {
  const variant =
    getGlyphVariant(
      name,
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
      className={`relative flex shrink-0 items-center justify-center overflow-hidden text-[var(--sky-50)] ${
        featured
          ? "h-[112px] w-[112px] rounded-[20px]"
          : "h-[68px] w-[68px] rounded-[16px]"
      }`}
      style={{
        background:
          gradients[
            variant
          ],

        boxShadow: `
          inset 0 0 0 1px rgba(201,224,235,.12),
          0 18px 40px -28px rgba(109,54,222,.60)
        `,
      }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/15 blur-xl" />

      <div
        className={
          featured
            ? "relative h-12 w-12"
            : "relative h-8 w-8"
        }
      >
        <ProjectGlyphIcon
          icon={
            icon ??
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
      <SvgIcon>
        <path
          d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </SvgIcon>
    );
  }

  if (
    icon ===
    "terminal"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "database"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "server"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "globe"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "layers"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "package"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "cpu"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  if (
    icon ===
    "rocket"
  ) {
    return (
      <SvgIcon>
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
      </SvgIcon>
    );
  }

  return (
    <SvgIcon>
      <path
        d="M4 7.5h6l2-2h8v13H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

/*
 * =========================================================
 * SVG ICON WRAPPER
 * =========================================================
 */

function SvgIcon({
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
 * EMPTY PROJECTS
 * =========================================================
 */

function EmptyProjects({
  hasFilters,
  onReset,
  onCreate,
}: {
  hasFilters: boolean;
  onReset: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[rgb(96_105_144_/_0.34)] bg-[#1f2132]/80 px-6 text-center">
      <ProjectGlyph
        name="Empty"
        icon="folder"
      />

      <h3 className="db-display-title mt-5 text-xl">
        {hasFilters
          ? "No matching projects"
          : "No projects yet"}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--text-muted)]">
        {hasFilters
          ? "No projects match the current search or filter."
          : "Create a project to start organizing your workspace."}
      </p>

      <button
        type="button"
        onClick={
          hasFilters
            ? onReset
            : onCreate
        }
        className="mt-5 rounded-xl border border-[rgb(177_138_235_/_0.42)] bg-[rgb(131_80_196_/_0.18)] px-4 py-2.5 text-[10px] font-black text-[var(--lilac-200)] transition-colors hover:bg-[rgb(131_80_196_/_0.28)]"
      >
        {hasFilters
          ? "Reset filters"
          : "Create project"}
      </button>
    </div>
  );
}

/*
 * =========================================================
 * CREATE PROJECT MODAL
 * =========================================================
 */

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;

  onCreated: (
    project: Project,
  ) => void;
}) {
  const [
    name,
    setName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    icon,
    setIcon,
  ] = useState<ProjectIcon>(
    "folder",
  );

  const [
    status,
    setStatus,
  ] = useState<ProjectStatus>(
    "planning",
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    toastMessage,
    setToastMessage,
  ] = useState("");

  const [
    errorField,
    setErrorField,
  ] = useState<
    string | null
  >(null);

  const [
    shaking,
    setShaking,
  ] = useState(false);

  /*
   * =========================================================
   * MODAL BEHAVIOR
   * =========================================================
   */

  useEffect(() => {
    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !saving
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
    onClose,
    saving,
  ]);

  /*
   * =========================================================
   * ERROR HANDLING
   * =========================================================
   */

  const triggerError = (
    message: string,
    field?: string,
  ) => {
    setToastMessage(
      message,
    );

    setErrorField(
      field ?? null,
    );

    setShaking(false);

    window.requestAnimationFrame(
      () => {
        setShaking(true);
      },
    );

    window.setTimeout(
      () => {
        setShaking(false);
      },
      380,
    );
  };

  /*
   * =========================================================
   * CREATE PROJECT
   * =========================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      triggerError(
        "Project name is required",
        "name",
      );

      return;
    }

    setSaving(true);

    setToastMessage("");

    try {
      const response =
        await createProject({
          name:
            name.trim(),

          description:
            description.trim(),

          icon,

          status,
        });

      onCreated(
        response.project,
      );
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        triggerError(
          error.message,
          error.field,
        );
      } else {
        triggerError(
          error instanceof Error
            ? error.message
            : "Failed to create project",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return createPortal(
    <>
      {toastMessage && (
        <ErrorToast
          message={
            toastMessage
          }
          onClose={() =>
            setToastMessage(
              "",
            )
          }
        />
      )}

      <div
        className="fixed inset-0 z-[700] flex items-start justify-center overflow-y-auto bg-[#11111b]/80 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6 md:items-center"
        onMouseDown={(
          event,
        ) => {
          if (
            event.target ===
              event.currentTarget &&
            !saving
          ) {
            onClose();
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
          className={`db-modal my-auto w-full max-w-xl overflow-hidden rounded-[22px] ${
            shaking
              ? "modal-shake"
              : ""
          }`}
        >
          {/*
           * =========================================================
           * MODAL HEADER
           * =========================================================
           */}

          <div
            className="relative overflow-hidden border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at 90% 0%,
                  rgba(131,80,196,.18),
                  transparent 14rem
                ),
                linear-gradient(
                  135deg,
                  #25203e,
                  #211f35
                )
              `,
            }}
          >
            <div className="relative z-[1] flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <ProjectGlyph
                  name={
                    name ||
                    "New project"
                  }
                  icon={
                    icon
                  }
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
                    Workspace
                  </p>

                  <h2
                    id="create-project-title"
                    className="db-display-title mt-1 text-xl"
                  >
                    Create project
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                aria-label="Close create project"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[rgb(201_224_235_/_0.06)] hover:text-[var(--pale-sky)] disabled:opacity-40"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/*
           * =========================================================
           * MODAL FORM
           * =========================================================
           */}

          <form
            onSubmit={
              handleSubmit
            }
            className="p-5 sm:p-6"
          >
            <label className="block text-[9px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Project name

              <input
                required
                autoFocus
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

                  if (
                    errorField ===
                    "name"
                  ) {
                    setErrorField(
                      null,
                    );
                  }
                }}
                placeholder="Project name"
                className={`input-style mt-2 ${
                  errorField ===
                  "name"
                    ? "input-error"
                    : ""
                }`}
              />

              {errorField ===
                "name" && (
                <span className="mt-2 block text-[10px] font-bold normal-case tracking-normal text-[var(--lilac-200)]">
                  This project name is already in use.
                </span>
              )}
            </label>

            <label className="mt-5 block text-[9px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Description

              <textarea
                rows={4}
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                placeholder="Project description"
                className="input-style mt-2 h-auto resize-none py-3"
              />
            </label>

            {/*
             * =========================================================
             * PROJECT ICON
             * =========================================================
             */}

            <div className="mt-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Project icon
                  </p>

                  <p className="mt-1 text-[8px] font-semibold text-[var(--text-faint)]">
                    Choose the icon that will stay attached to this project.
                  </p>
                </div>

                <ProjectStatusBadge
                  status={status}
                />
              </div>

              <div className="mt-3 grid grid-cols-5 gap-2">
                {projectIconOptions.map(
                  (
                    option,
                  ) => {
                    const selected =
                      icon ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        title={
                          option.label
                        }
                        aria-label={`Use ${option.label} icon`}
                        aria-pressed={
                          selected
                        }
                        onClick={() =>
                          setIcon(
                            option.value,
                          )
                        }
                        className={`group flex aspect-square min-h-12 items-center justify-center rounded-xl border transition-all ${
                          selected
                            ? "border-[rgb(177_138_235_/_0.62)] bg-[linear-gradient(135deg,rgba(131,80,196,.34),rgba(109,54,222,.20))] text-[var(--sky-50)] shadow-[0_12px_26px_-18px_rgba(109,54,222,.80)]"
                            : "border-[rgb(96_105_144_/_0.28)] bg-[#202235] text-[var(--denim-300)] hover:border-[rgb(115_146_181_/_0.44)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5">
                          <ProjectGlyphIcon
                            icon={
                              option.value
                            }
                          />
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/*
             * =========================================================
             * PROJECT STATUS
             * =========================================================
             */}

            <div className="mt-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Initial status
                </p>

                <p className="mt-1 text-[8px] font-semibold text-[var(--text-faint)]">
                  Choose where this project starts in your workflow.
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {projectStatusOptions.map(
                  (option) => {
                    const selected =
                      status ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        aria-pressed={
                          selected
                        }
                        onClick={() =>
                          setStatus(
                            option.value,
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-left transition-all ${
                          selected
                            ? "border-[rgb(177_138_235_/_0.58)] bg-[linear-gradient(135deg,rgba(131,80,196,.30),rgba(109,54,222,.18))] shadow-[0_12px_28px_-20px_rgba(109,54,222,.85)]"
                            : "border-[rgb(96_105_144_/_0.28)] bg-[#202235] hover:border-[rgb(115_146_181_/_0.44)] hover:bg-[#292b40]"
                        }`}
                      >
                        <span
                          className={`block text-[10px] font-black ${
                            selected
                              ? "text-[var(--lilac-200)]"
                              : "text-[var(--pale-sky)]"
                          }`}
                        >
                          {
                            option.label
                          }
                        </span>

                        <span className="mt-1 block text-[8px] font-semibold leading-4 text-[var(--text-faint)]">
                          {
                            option.description
                          }
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/*
             * =========================================================
             * FORM ACTIONS
             * =========================================================
             */}

            <div className="mt-7 flex justify-end gap-3 border-t border-[var(--border-subtle)] pt-5">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                className="rounded-xl border border-[rgb(96_105_144_/_0.28)] bg-[#25283b] px-5 py-3 text-xs font-black text-[var(--text-secondary)] transition-colors hover:bg-[#292c41] hover:text-[var(--pale-sky)] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="inline-flex min-w-[128px] items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 py-3 text-xs font-black text-[var(--sky-50)] shadow-[0_14px_30px_-18px_rgba(109,54,222,.75)] transition-all hover:brightness-110 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Creating...
                  </>
                ) : (
                  "Create project"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body,
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
  if (
    tasks.length === 0
  ) {
    return 0;
  }

  const completed =
    tasks.filter(
      (task) =>
        task.status ===
        "done",
    ).length;

  return Math.round(
    (
      completed /
      tasks.length
    ) *
      100,
  );
}

function getGlyphVariant(
  value: string,
) {
  let total = 0;

  for (
    let index = 0;
    index <
    value.length;
    index += 1
  ) {
    total +=
      value.charCodeAt(
        index,
      );
  }

  return (
    total %
    5
  );
}

function getMemberGradient(
  value: string,
) {
  const gradients = [
    "linear-gradient(135deg,#8350c4,#6d36de)",
    "linear-gradient(135deg,#7392b5,#506e91)",
    "linear-gradient(135deg,#765d7e,#8350c4)",
    "linear-gradient(135deg,#506e91,#402b47)",
  ];

  let total = 0;

  for (
    let index = 0;
    index <
    value.length;
    index += 1
  ) {
    total +=
      value.charCodeAt(
        index,
      );
  }

  return gradients[
    total %
      gradients.length
  ];
}

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(
      /\s+/,
    )
    .slice(
      0,
      2,
    )
    .map(
      (part) =>
        part.charAt(
          0,
        ),
    )
    .join("")
    .toUpperCase();
}

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

function isOverdue(
  value: string,
) {
  const dueDate =
    new Date(
      value,
    );

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  return (
    dueDate.getTime() <
    today.getTime()
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",
      day:
        "numeric",
      year:
        "numeric",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

function formatShortDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",
      day:
        "numeric",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--denim-300)]"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 shrink-0 text-[var(--denim-300)]"
      aria-hidden="true"
    >
      <path
        d="M5 7h8M5 12h6M5 17h4M16 5v14M13 16l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
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
      className="h-4 w-4"
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

function MembersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 text-[var(--denim-300)]"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M3.5 19c.4-3.1 2.2-5 5.5-5s5.1 1.9 5.5 5M16 6.5a2.5 2.5 0 0 1 0 5M16 14c2.7.2 4.2 1.8 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
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

function ChevronDownIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 shrink-0 text-[var(--denim-300)] transition-transform ${
        open
          ? "rotate-180"
          : ""
      }`}
      aria-hidden="true"
    >
      <path
        d="m7 9 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        d="m6 6 12 12M18 6 6 18"
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ProjectsPage;