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

import {
  getProjects,
  type Project,
} from "../services/projectService";

import {
  createTask,
  getMyTasks,
  type MyTask,
  type TaskPriority,
  type TaskStatus,
} from "../services/taskService";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type StatusFilter =
  | "all"
  | TaskStatus;

type PriorityFilter =
  | "all"
  | TaskPriority;

type SortOption =
  | "due-asc"
  | "due-desc";

type ViewMode =
  | "board"
  | "list";

type DropdownOption<
  T extends string,
> = {
  label: string;
  value: T;
};

type TaskForm = {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  labels: string;
};

/*
 * =========================================================
 * STATUS OPTIONS
 * =========================================================
 */

const statusOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All tasks",
    value: "all",
  },
  {
    label: "To do",
    value: "todo",
  },
  {
    label: "In progress",
    value: "in-progress",
  },
  {
    label: "Done",
    value: "done",
  },
];

/*
 * =========================================================
 * PRIORITY OPTIONS
 * =========================================================
 */

const priorityOptions: DropdownOption<PriorityFilter>[] =
  [
    {
      label: "All priorities",
      value: "all",
    },
    {
      label: "High",
      value: "high",
    },
    {
      label: "Medium",
      value: "medium",
    },
    {
      label: "Low",
      value: "low",
    },
  ];

/*
 * =========================================================
 * SORT OPTIONS
 * =========================================================
 */

const sortOptions: DropdownOption<SortOption>[] =
  [
    {
      label: "Due date · earliest",
      value: "due-asc",
    },
    {
      label: "Due date · latest",
      value: "due-desc",
    },
  ];

/*
 * =========================================================
 * CREATE TASK OPTIONS
 * =========================================================
 */

const taskStatusOptions: DropdownOption<TaskStatus>[] =
  [
    {
      label: "To do",
      value: "todo",
    },
    {
      label: "In progress",
      value: "in-progress",
    },
    {
      label: "Done",
      value: "done",
    },
  ];

const taskPriorityOptions: DropdownOption<TaskPriority>[] =
  [
    {
      label: "High",
      value: "high",
    },
    {
      label: "Medium",
      value: "medium",
    },
    {
      label: "Low",
      value: "low",
    },
  ];

/*
 * =========================================================
 * MY TASKS PAGE
 * =========================================================
 */

function MyTasksPage() {
  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [
    tasks,
    setTasks,
  ] = useState<MyTask[]>([]);

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const [
    taskForm,
    setTaskForm,
  ] = useState<TaskForm | null>(
    null,
  );

  const [
    savingTask,
    setSavingTask,
  ] = useState(false);

  const [
    createTaskError,
    setCreateTaskError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState<PriorityFilter>(
      "all",
    );

  const [
    projectFilter,
    setProjectFilter,
  ] = useState("all");

  const [
    sort,
    setSort,
  ] =
    useState<SortOption>(
      "due-asc",
    );

  const [
    viewMode,
    setViewMode,
  ] =
    useState<ViewMode>(
      () => {
        const savedView =
          localStorage.getItem(
            "devboard_my_tasks_view_mode",
          );

        return savedView ===
          "list"
          ? "list"
          : "board";
      },
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
   * LOAD TASKS
   * =========================================================
   */

  useEffect(() => {
    let active = true;

    const loadTasks =
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            taskResponse,
            projectResponse,
          ] = await Promise.all([
            getMyTasks(),
            getProjects(),
          ]);

          if (!active) {
            return;
          }

          setTasks(
            taskResponse.tasks,
          );

          setProjects(
            projectResponse.projects,
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load tasks",
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    void loadTasks();

    return () => {
      active = false;
    };
  }, []);

  /*
   * =========================================================
   * SAVE VIEW MODE
   * =========================================================
   */

  useEffect(() => {
    localStorage.setItem(
      "devboard_my_tasks_view_mode",
      viewMode,
    );
  }, [viewMode]);

  /*
   * =========================================================
   * TASK COUNTS
   * =========================================================
   */

  const todoCount =
    tasks.filter(
      (task) =>
        task.status === "todo",
    ).length;

  const inProgressCount =
    tasks.filter(
      (task) =>
        task.status ===
        "in-progress",
    ).length;

  const doneCount =
    tasks.filter(
      (task) =>
        task.status === "done",
    ).length;

  /*
   * =========================================================
   * PROJECT OPTIONS
   * =========================================================
   */

  const projectOptions =
    useMemo<
      DropdownOption<string>[]
    >(
      () => [
        {
          label:
            "All projects",
          value: "all",
        },
        ...projects
          .map(
            (project) => ({
              label:
                project.name,
              value:
                project._id,
            }),
          )
          .sort((a, b) =>
            a.label.localeCompare(
              b.label,
            ),
          ),
      ],
      [projects],
    );

  /*
   * =========================================================
   * BASE FILTERS
   * =========================================================
   */

  const baseFilteredTasks =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const result =
        tasks.filter(
          (task) => {
            const matchesSearch =
              !query ||
              task.title
                .toLowerCase()
                .includes(
                  query,
                ) ||
              task.project.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              task.labels.some(
                (label) =>
                  label
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              );

            const matchesPriority =
              priorityFilter ===
                "all" ||
              task.priority ===
                priorityFilter;

            const matchesProject =
              projectFilter ===
                "all" ||
              task.project._id ===
                projectFilter;

            return (
              matchesSearch &&
              matchesPriority &&
              matchesProject
            );
          },
        );

      return [...result].sort(
        (a, b) => {
          if (
            sort ===
            "due-desc"
          ) {
            return sortTasksByDueDateDescending(
              a,
              b,
            );
          }

          return sortTasksByDueDate(
            a,
            b,
          );
        },
      );
    }, [
      tasks,
      search,
      priorityFilter,
      projectFilter,
      sort,
    ]);

  /*
   * =========================================================
   * STATUS FILTER
   * =========================================================
   */

  const filteredTasks =
    useMemo(() => {
      if (
        statusFilter ===
        "all"
      ) {
        return baseFilteredTasks;
      }

      return baseFilteredTasks.filter(
        (task) =>
          task.status ===
          statusFilter,
      );
    }, [
      baseFilteredTasks,
      statusFilter,
    ]);

  /*
   * =========================================================
   * BOARD COLUMNS
   * =========================================================
   */

  const todoTasks =
    baseFilteredTasks.filter(
      (task) =>
        task.status === "todo",
    );

  const inProgressTasks =
    baseFilteredTasks.filter(
      (task) =>
        task.status ===
        "in-progress",
    );

  const doneTasks =
    baseFilteredTasks.filter(
      (task) =>
        task.status === "done",
    );

  /*
   * =========================================================
   * VIEW ALL STATUS
   * =========================================================
   */

  const handleViewAllStatus = (
    status: TaskStatus,
  ) => {
    setStatusFilter(
      status,
    );

    window.requestAnimationFrame(
      () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      },
    );
  };

  /*
   * =========================================================
   * CREATE TASK
   * =========================================================
   */

  const openCreateTaskModal =
    () => {
      setCreateTaskError("");

      if (
        projects.length === 0
      ) {
        setTaskForm(null);
        setCreateModalOpen(true);
        return;
      }

      const firstProject =
        projects[0];

      setTaskForm({
        projectId:
          firstProject._id,
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignee:
          firstProject
            .members[0]?._id ??
          "",
        dueDate: "",
        labels: "",
      });

      setCreateModalOpen(true);
    };

  const closeCreateTaskModal =
    () => {
      if (savingTask) {
        return;
      }

      setCreateModalOpen(false);
      setTaskForm(null);
      setCreateTaskError("");
    };

  const updateTaskForm = (
    values: Partial<TaskForm>,
  ) => {
    setTaskForm(
      (current) =>
        current
          ? {
              ...current,
              ...values,
            }
          : current,
    );
  };

  const handleTaskProjectChange =
    (
      projectId: string,
    ) => {
      const project =
        projects.find(
          (candidate) =>
            candidate._id ===
            projectId,
        );

      updateTaskForm({
        projectId,
        assignee:
          project?.members[0]?._id ??
          "",
      });
    };

  const handleCreateTask =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!taskForm) {
        return;
      }

      if (
        !taskForm.projectId
      ) {
        setCreateTaskError(
          "Choose a project for this task.",
        );
        return;
      }

      if (
        !taskForm.title.trim()
      ) {
        setCreateTaskError(
          "Task title is required.",
        );
        return;
      }

      const labels =
        taskForm.labels
          .split(",")
          .map((label) =>
            label.trim(),
          )
          .filter(Boolean);

      setSavingTask(true);
      setCreateTaskError("");

      try {
        await createTask(
          taskForm.projectId,
          {
            title:
              taskForm.title.trim(),

            description:
              taskForm.description.trim(),

            status:
              taskForm.status,

            priority:
              taskForm.priority,

            assignee:
              taskForm.assignee ||
              null,

            dueDate:
              taskForm.dueDate,

            labels,
          },
        );

        const [
          taskResponse,
          projectResponse,
        ] = await Promise.all([
          getMyTasks(),
          getProjects(),
        ]);

        setTasks(
          taskResponse.tasks,
        );

        setProjects(
          projectResponse.projects,
        );

        setCreateModalOpen(false);
        setTaskForm(null);
      } catch (error) {
        setCreateTaskError(
          error instanceof Error
            ? error.message
            : "Failed to create task",
        );
      } finally {
        setSavingTask(false);
      }
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
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        {/*
         * =========================================================
         * PAGE HEADER
         * =========================================================
         */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="db-display-title text-[2.6rem] leading-none sm:text-[2.9rem]">
              My Tasks
            </h2>

            <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
              Tasks assigned to you across your projects.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateTaskModal
            }
            className="inline-flex h-12 items-center justify-center gap-2.5 self-start rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-6 text-xs font-black text-[var(--sky-50)] shadow-[0_16px_32px_-18px_rgba(109,54,222,.78)] transition-all hover:-translate-y-0.5 hover:brightness-110 sm:self-auto"
          >
            <PlusIcon />

            Add task
          </button>
        </section>

        {/*
         * =========================================================
         * TOP TOOLBAR
         * =========================================================
         */}

        <section className="relative z-30 mt-6 grid gap-3 2xl:grid-cols-[auto_minmax(0,1fr)] 2xl:items-center">
          {/*
           * =========================================================
           * STATUS TABS
           * =========================================================
           */}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {statusOptions.map(
              (option) => {
                const active =
                  statusFilter ===
                  option.value;

                const count =
                  option.value ===
                  "all"
                    ? tasks.length
                    : option.value ===
                        "todo"
                      ? todoCount
                      : option.value ===
                          "in-progress"
                        ? inProgressCount
                        : doneCount;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        option.value,
                      )
                    }
                    className={`flex h-12 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 text-xs font-bold transition-all sm:justify-start sm:gap-3 sm:px-4 ${
                      active
                        ? "border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#4d2d74,#6d36de)] text-[var(--sky-50)] shadow-[0_14px_30px_-20px_rgba(109,54,222,.80)]"
                        : "border-[rgb(96_105_144_/_0.30)] bg-[#202235]/90 text-[var(--text-secondary)] hover:border-[rgb(115_146_181_/_0.44)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
                    }`}
                  >
                    <StatusTabIcon
                      status={
                        option.value
                      }
                    />

                    {
                      option.label
                    }

                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[8px] font-black ${
                        active
                          ? "bg-white/10 text-[var(--sky-50)]"
                          : "bg-[#303349] text-[var(--denim-300)]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {/*
           * =========================================================
           * SEARCH / PRIORITY / VIEW
           * =========================================================
           */}

          <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(170px,210px)_auto] 2xl:justify-self-end">
            <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
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
                placeholder={
                  statusFilter ===
                  "all"
                    ? "Search my tasks..."
                    : `Search ${getStatusLabel(
                        statusFilter,
                      ).toLowerCase()} tasks...`
                }
                className="h-12 w-full rounded-xl border border-[rgb(96_105_144_/_0.30)] bg-[#202235]/90 pl-11 pr-4 text-xs font-semibold text-[var(--pale-sky)] outline-none transition-all placeholder:text-[var(--text-faint)] hover:border-[rgb(115_146_181_/_0.44)] focus:border-[rgb(177_138_235_/_0.50)] focus:ring-4 focus:ring-[rgb(131_80_196_/_0.10)]"
              />
            </div>

            <CustomDropdown
              label="Priority"
              value={
                priorityFilter
              }
              options={
                priorityOptions
              }
              onChange={
                setPriorityFilter
              }
              icon={
                <PriorityIcon />
              }
              widthClass="w-full min-w-0"
            />

            <div className="grid h-12 min-w-0 grid-cols-2 overflow-hidden rounded-xl border border-[rgb(96_105_144_/_0.30)] bg-[#202235]/90">
              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    "board",
                  )
                }
                className={`flex min-w-0 items-center justify-center gap-2 px-3 text-xs font-black transition-colors sm:px-4 ${
                  viewMode ===
                  "board"
                    ? "bg-[linear-gradient(135deg,#4d2d74,#6d36de)] text-[var(--sky-50)]"
                    : "text-[var(--text-muted)] hover:text-[var(--pale-sky)]"
                }`}
              >
                <BoardIcon />

                Board
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    "list",
                  )
                }
                className={`flex min-w-0 items-center justify-center gap-2 border-l border-[rgb(96_105_144_/_0.24)] px-3 text-xs font-black transition-colors sm:px-4 ${
                  viewMode ===
                  "list"
                    ? "bg-[linear-gradient(135deg,#4d2d74,#6d36de)] text-[var(--sky-50)]"
                    : "text-[var(--text-muted)] hover:text-[var(--pale-sky)]"
                }`}
              >
                <ListIcon />

                List
              </button>
            </div>
          </div>
        </section>

        {/*
         * =========================================================
         * LOADING / ERROR
         * =========================================================
         */}

        {loading && (
          <EmptyMessage text="Loading tasks..." />
        )}

        {!loading &&
          error && (
            <EmptyMessage
              text={error}
            />
          )}

        {/*
         * =========================================================
         * BOARD VIEW
         * =========================================================
         */}

        {!loading &&
          !error &&
          viewMode ===
            "board" && (
            <section className="mt-5">
              {statusFilter ===
              "all" ? (
                <div className="grid items-start gap-4 xl:grid-cols-3">
                  <TaskColumn
                    title="To do"
                    status="todo"
                    tasks={
                      todoTasks
                    }
                    limit={3}
                    onViewAll={() =>
                      handleViewAllStatus(
                        "todo",
                      )
                    }
                  />

                  <TaskColumn
                    title="In progress"
                    status="in-progress"
                    tasks={
                      inProgressTasks
                    }
                    limit={3}
                    onViewAll={() =>
                      handleViewAllStatus(
                        "in-progress",
                      )
                    }
                  />

                  <TaskColumn
                    title="Done"
                    status="done"
                    tasks={
                      doneTasks
                    }
                    limit={3}
                    onViewAll={() =>
                      handleViewAllStatus(
                        "done",
                      )
                    }
                  />
                </div>
              ) : (
                <ExpandedTaskSection
                  title={
                    getStatusLabel(
                      statusFilter,
                    )
                  }
                  status={
                    statusFilter
                  }
                  tasks={
                    filteredTasks
                  }
                  search={
                    search
                  }
                  onSearchChange={
                    setSearch
                  }
                  onBack={() => {
                    setStatusFilter(
                      "all",
                    );

                    setSearch(
                      "",
                    );
                  }}
                />
              )}
            </section>
          )}

        {/*
         * =========================================================
         * TASK LIST
         * =========================================================
         */}

        {!loading &&
          !error &&
          (
            viewMode ===
              "list" ||
            (
              viewMode ===
                "board" &&
              statusFilter ===
                "all"
            )
          ) && (
            <section className="mt-5 overflow-visible rounded-[20px] border border-[rgb(96_105_144_/_0.34)] bg-[#1f2132] shadow-[0_22px_60px_-48px_rgba(0,0,0,.75)]">
              {/*
               * =========================================================
               * TASK LIST HEADER
               * =========================================================
               */}

              <div className="relative z-20 flex flex-col gap-3 border-b border-[rgb(96_105_144_/_0.20)] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                <h3 className="db-display-title text-[1.4rem]">
                  {statusFilter ===
                  "all"
                    ? "All tasks"
                    : getStatusLabel(
                        statusFilter,
                      )}{" "}
                  <span className="text-[var(--denim-300)]">
                    (
                    {
                      filteredTasks.length
                    }
                    )
                  </span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  <CustomDropdown
                    label="Sort"
                    value={
                      sort
                    }
                    options={
                      sortOptions
                    }
                    onChange={
                      setSort
                    }
                    icon={
                      <SortIcon />
                    }
                    compact
                    widthClass="min-w-[190px]"
                  />

                  <CustomDropdown
                    label="Project"
                    value={
                      projectFilter
                    }
                    options={
                      projectOptions
                    }
                    onChange={
                      setProjectFilter
                    }
                    icon={
                      <FolderSmallIcon />
                    }
                    compact
                    widthClass="min-w-[190px]"
                  />

                  <CustomDropdown
                    label="Priority"
                    value={
                      priorityFilter
                    }
                    options={
                      priorityOptions
                    }
                    onChange={
                      setPriorityFilter
                    }
                    icon={
                      <PriorityIcon />
                    }
                    compact
                    widthClass="min-w-[175px]"
                  />
                </div>
              </div>

              {/*
               * =========================================================
               * TASK TABLE
               * =========================================================
               */}

              <div className="overflow-hidden rounded-b-[20px]">
                {filteredTasks.length ===
                0 ? (
                  <div className="flex min-h-[200px] items-center justify-center text-sm font-semibold text-[var(--text-muted)]">
                    No tasks found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse">
                      <thead>
                        <tr className="border-b border-[rgb(96_105_144_/_0.16)]">
                          <TableHeading>
                            Task
                          </TableHeading>

                          <TableHeading>
                            Project
                          </TableHeading>

                          <TableHeading>
                            Labels
                          </TableHeading>

                          <TableHeading>
                            Assignee
                          </TableHeading>

                          <TableHeading>
                            Priority
                          </TableHeading>

                          <TableHeading>
                            Due date
                          </TableHeading>

                          <TableHeading>
                            Status
                          </TableHeading>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTasks.map(
                          (
                            task,
                          ) => (
                            <TaskTableRow
                              key={
                                task._id
                              }
                              task={
                                task
                              }
                            />
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
      </div>

      {createModalOpen &&
        createPortal(
          <CreateTaskModal
            projects={
              projects
            }
            form={
              taskForm
            }
            saving={
              savingTask
            }
            error={
              createTaskError
            }
            onChange={
              updateTaskForm
            }
            onProjectChange={
              handleTaskProjectChange
            }
            onSubmit={
              handleCreateTask
            }
            onClose={
              closeCreateTaskModal
            }
          />,
          document.body,
        )}
    </div>
  );
}

/*
 * =========================================================
 * CREATE TASK MODAL
 * =========================================================
 */

function CreateTaskModal({
  projects,
  form,
  saving,
  error,
  onChange,
  onProjectChange,
  onSubmit,
  onClose,
}: {
  projects: Project[];
  form: TaskForm | null;
  saving: boolean;
  error: string;
  onChange: (
    values: Partial<TaskForm>,
  ) => void;
  onProjectChange: (
    projectId: string,
  ) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onClose: () => void;
}) {
  const selectedProject =
    form
      ? projects.find(
          (project) =>
            project._id ===
            form.projectId,
        ) ?? null
      : null;

  const projectOptions:
    DropdownOption<string>[] =
      projects
        .map(
          (project) => ({
            label:
              project.name,
            value:
              project._id,
          }),
        )
        .sort((a, b) =>
          a.label.localeCompare(
            b.label,
          ),
        );

  const assigneeOptions:
    DropdownOption<string>[] =
      selectedProject
        ? [
            {
              label:
                "Unassigned",
              value: "",
            },
            ...selectedProject
              .members.map(
                (member) => ({
                  label:
                    member.name,
                  value:
                    member._id,
                }),
              )
              .sort((a, b) =>
                a.label.localeCompare(
                  b.label,
                ),
              ),
          ]
        : [
            {
              label:
                "Unassigned",
              value: "",
            },
          ];

  useEffect(() => {
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

  return (
    <div
      className="fixed inset-0 z-[700] flex items-start justify-center overflow-y-auto bg-[#11111b]/82 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6 md:items-center"
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
        aria-labelledby="create-task-title"
        className="db-modal my-auto w-full max-w-2xl overflow-visible rounded-[22px]"
      >
        {/*
         * =========================================================
         * MODAL HEADER
         * =========================================================
         */}

        <div
          className="relative overflow-hidden rounded-t-[22px] border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6"
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
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgb(177_138_235_/_0.24)] bg-[rgb(131_80_196_/_0.16)] text-[var(--lilac-200)]">
                <TaskCreateIcon />
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
                  My Tasks
                </p>

                <h2
                  id="create-task-title"
                  className="db-display-title mt-1 text-xl"
                >
                  Create task
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
              aria-label="Close task modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[rgb(201_224_235_/_0.06)] hover:text-[var(--pale-sky)] disabled:opacity-40"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/*
         * =========================================================
         * NO PROJECTS
         * =========================================================
         */}

        {!form ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-dashed border-[rgb(115_146_181_/_0.28)] bg-[#202235]/65 px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[rgb(115_146_181_/_0.22)] bg-[rgb(115_146_181_/_0.10)] text-[var(--denim-300)]">
                <FolderSmallIcon />
              </div>

              <h3 className="db-display-title mt-4 text-lg">
                No projects yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--text-muted)]">
                Create a project before adding a task from My Tasks.
              </p>

              <Link
                to="/projects"
                onClick={
                  onClose
                }
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-[rgb(177_138_235_/_0.42)] bg-[rgb(131_80_196_/_0.16)] px-4 text-[10px] font-black text-[var(--lilac-200)] transition-colors hover:bg-[rgb(131_80_196_/_0.25)]"
              >
                Go to projects
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={
              onSubmit
            }
            className="p-5 sm:p-6"
          >
            <div className="space-y-5">
              {/*
               * =========================================================
               * PROJECT
               * =========================================================
               */}

              <CustomDropdown
                label="Project"
                value={
                  form.projectId
                }
                options={
                  projectOptions
                }
                onChange={
                  onProjectChange
                }
                icon={
                  <FolderSmallIcon />
                }
                widthClass="w-full"
              />

              {/*
               * =========================================================
               * TITLE
               * =========================================================
               */}

              <label className="block">
                <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Title
                </span>

                <input
                  autoFocus
                  required
                  value={
                    form.title
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      title:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Task title"
                  className="input-style mt-2"
                />
              </label>

              {/*
               * =========================================================
               * DESCRIPTION
               * =========================================================
               */}

              <label className="block">
                <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Description
                </span>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      description:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Add details about this task..."
                  rows={4}
                  className="input-style mt-2 min-h-[110px] resize-y py-3"
                />
              </label>

              {/*
               * =========================================================
               * STATUS / PRIORITY
               * =========================================================
               */}

              <div className="grid gap-4 sm:grid-cols-2">
                <CustomDropdown
                  label="Status"
                  value={
                    form.status
                  }
                  options={
                    taskStatusOptions
                  }
                  onChange={(
                    value,
                  ) =>
                    onChange({
                      status:
                        value,
                    })
                  }
                  icon={
                    <StatusCreateIcon />
                  }
                  widthClass="w-full"
                />

                <CustomDropdown
                  label="Priority"
                  value={
                    form.priority
                  }
                  options={
                    taskPriorityOptions
                  }
                  onChange={(
                    value,
                  ) =>
                    onChange({
                      priority:
                        value,
                    })
                  }
                  icon={
                    <PriorityIcon />
                  }
                  widthClass="w-full"
                />
              </div>

              {/*
               * =========================================================
               * ASSIGNEE / DUE DATE
               * =========================================================
               */}

              <div className="grid gap-4 sm:grid-cols-2">
                <CustomDropdown
                  label="Assignee"
                  value={
                    form.assignee
                  }
                  options={
                    assigneeOptions
                  }
                  onChange={(
                    value,
                  ) =>
                    onChange({
                      assignee:
                        value,
                    })
                  }
                  icon={
                    <UserCreateIcon />
                  }
                  widthClass="w-full"
                />

                <label className="block">
                  <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Due date
                  </span>

                  <input
                    type="date"
                    value={
                      form.dueDate
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange({
                        dueDate:
                          event.target
                            .value,
                      })
                    }
                    className="input-style mt-2"
                  />
                </label>
              </div>

              {/*
               * =========================================================
               * LABELS
               * =========================================================
               */}

              <label className="block">
                <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Labels
                </span>

                <input
                  value={
                    form.labels
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      labels:
                        event.target
                          .value,
                    })
                  }
                  placeholder="frontend, bug, urgent"
                  className="input-style mt-2"
                />

                <span className="mt-2 block text-[8px] font-semibold text-[var(--text-faint)]">
                  Separate labels with commas.
                </span>
              </label>

              {error && (
                <div className="rounded-xl border border-[rgb(177_138_235_/_0.28)] bg-[rgb(131_80_196_/_0.12)] px-4 py-3 text-[10px] font-bold text-[var(--lilac-200)]">
                  {error}
                </div>
              )}
            </div>

            {/*
             * =========================================================
             * MODAL ACTIONS
             * =========================================================
             */}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                className="h-11 rounded-xl border border-[rgb(96_105_144_/_0.28)] bg-[#202235]/75 px-5 text-[10px] font-black text-[var(--text-secondary)] transition-colors hover:bg-[#292b40] hover:text-[var(--pale-sky)] disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !form.title.trim() ||
                  !form.projectId
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 text-[10px] font-black text-[var(--sky-50)] shadow-[0_16px_32px_-18px_rgba(109,54,222,.78)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <PlusIcon />

                {saving
                  ? "Creating..."
                  : "Create task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * CUSTOM DROPDOWN
 * =========================================================
 */

function CustomDropdown<
  T extends string,
>({
  label,
  value,
  options,
  onChange,
  icon,
  compact = false,
  widthClass = "",
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (
    value: T,
  ) => void;
  icon?: ReactNode;
  compact?: boolean;
  widthClass?: string;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  /*
   * =========================================================
   * CURRENT OPTION
   * =========================================================
   */

  const currentOption =
    options.find(
      (option) =>
        option.value ===
        value,
    ) ?? options[0];

  /*
   * =========================================================
   * CLOSE DROPDOWN
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMouseDown = (
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

    document.addEventListener(
      "mousedown",
      handleMouseDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      ref={containerRef}
      className={`relative min-w-0 ${
        open
          ? "z-[70]"
          : "z-0"
      } ${widthClass}`}
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (currentOpen) =>
              !currentOpen,
          )
        }
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        className={`flex w-full items-center rounded-xl border text-left transition-all ${
          compact
            ? "h-10 bg-[#25283b] px-3"
            : "h-12 bg-[#202235]/90 px-4"
        } ${
          open
            ? "border-[rgb(177_138_235_/_0.48)] shadow-[0_0_0_4px_rgba(131,80,196,.08)]"
            : "border-[rgb(96_105_144_/_0.30)] hover:border-[rgb(115_146_181_/_0.44)]"
        }`}
      >
        {icon && (
          <span className="flex shrink-0 items-center justify-center text-[var(--denim-300)]">
            {icon}
          </span>
        )}

        <div
          className={`min-w-0 flex-1 ${
            icon
              ? "ml-2.5"
              : ""
          }`}
        >
          <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[var(--text-faint)]">
            {label}
          </p>

          <p
            className={`truncate font-bold text-[var(--text-secondary)] ${
              compact
                ? "text-[10px]"
                : "mt-0.5 text-xs"
            }`}
          >
            {
              currentOption
                .label
            }
          </p>
        </div>

        <span
          className={`ml-3 shrink-0 text-[var(--denim-300)] transition-transform duration-200 ${
            open
              ? "rotate-180"
              : ""
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {/*
       * =========================================================
       * DROPDOWN MENU
       * =========================================================
       */}

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+7px)] z-[100] w-full min-w-[min(190px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[rgb(115_146_181_/_0.28)] bg-[#1b1d2c]/[0.98] p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,.85)] backdrop-blur-xl"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="text-[7px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)]">
              {label}
            </p>
          </div>

          {options.map(
            (option) => {
              const active =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    active
                  }
                  onClick={() => {
                    onChange(
                      option.value,
                    );

                    setOpen(
                      false,
                    );
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] font-bold transition-colors ${
                    active
                      ? "bg-[linear-gradient(135deg,rgba(131,80,196,.30),rgba(109,54,222,.18))] text-[var(--lilac-200)]"
                      : "text-[var(--text-secondary)] hover:bg-[rgb(201_224_235_/_0.05)] hover:text-[var(--pale-sky)]"
                  }`}
                >
                  <span className="truncate">
                    {
                      option.label
                    }
                  </span>

                  {active && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(131_80_196_/_0.22)] text-[var(--lilac-200)]">
                      <CheckIcon />
                    </span>
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
 * TASK COLUMN
 * =========================================================
 */

function TaskColumn({
  title,
  status,
  tasks,
  limit,
  onViewAll,
}: {
  title: string;
  status: TaskStatus;
  tasks: MyTask[];
  limit?: number;
  onViewAll?: () => void;
}) {
  /*
   * =========================================================
   * COLUMN APPEARANCE
   * =========================================================
   */

  const styles: Record<
    TaskStatus,
    {
      border: string;
      background: string;
      title: string;
      circle: string;
    }
  > = {
    todo: {
      border:
        "border-[rgb(131_80_196_/_0.32)]",

      background:
        "bg-[linear-gradient(145deg,#242138,#211f32)]",

      title:
        "text-[var(--pale-sky)]",

      circle:
        "border-[var(--lilac-300)]",
    },

    "in-progress": {
      border:
        "border-[rgb(115_146_181_/_0.42)]",

      background:
        "bg-[linear-gradient(145deg,#232b40,#202438)]",

      title:
        "text-[var(--sky-200)]",

      circle:
        "border-[#a8d9f1]",
    },

    done: {
      border:
        "border-[rgb(112_180_191_/_0.40)]",

      background:
        "bg-[linear-gradient(145deg,#24333d,#202a36)]",

      title:
        "text-[#b9e4f8]",

      circle:
        "border-[#b9e4f8] bg-[#b9e4f8]",
    },
  };

  const style =
    styles[status];

  /*
   * =========================================================
   * VISIBLE TASKS
   * =========================================================
   */

  const visibleTasks =
    typeof limit ===
      "number"
      ? tasks.slice(
          0,
          limit,
        )
      : tasks;

  const hiddenTasks =
    Math.max(
      tasks.length -
        visibleTasks.length,
      0,
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className={`overflow-hidden rounded-[18px] border ${style.border} ${style.background} shadow-[0_20px_55px_-46px_rgba(0,0,0,.72)]`}
    >
      {/*
       * =========================================================
       * COLUMN HEADER
       * =========================================================
       */}

      <div className="flex h-[58px] items-center justify-between border-b border-[rgb(96_105_144_/_0.18)] px-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${style.circle}`}
          >
            {status ===
              "done" && (
              <CheckIcon />
            )}
          </span>

          <h3
            className={`db-display-title text-[1.35rem] ${style.title}`}
          >
            {title}
          </h3>

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#34364c] px-1.5 text-[8px] font-black text-[var(--denim-300)]">
            {
              tasks.length
            }
          </span>
        </div>

        <span className="text-lg font-black tracking-[0.15em] text-[var(--text-faint)]">
          ···
        </span>
      </div>

      {/*
       * =========================================================
       * COLUMN CONTENT
       * =========================================================
       */}

      <div className="space-y-2.5 p-3">
        {visibleTasks.length >
        0 ? (
          visibleTasks.map(
            (task) => (
              <TaskCard
                key={
                  task._id
                }
                task={
                  task
                }
              />
            ),
          )
        ) : (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-[rgb(96_105_144_/_0.22)] text-[10px] font-semibold text-[var(--text-faint)]">
            No tasks
          </div>
        )}
      </div>

      {/*
       * =========================================================
       * VIEW ALL TASKS
       * =========================================================
       */}

      {hiddenTasks >
        0 &&
        onViewAll && (
          <div className="border-t border-[rgb(96_105_144_/_0.16)] px-3 py-2.5">
            <button
              type="button"
              onClick={
                onViewAll
              }
              className="group flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[9px] font-black text-[var(--denim-300)] transition-all hover:bg-[rgb(201_224_235_/_0.05)] hover:text-[var(--pale-sky)]"
            >
              View all{" "}
              {
                tasks.length
              }{" "}
              tasks

              <ChevronRightSmallIcon />
            </button>
          </div>
        )}
    </div>
  );
}

/*
 * =========================================================
 * EXPANDED TASK SECTION
 * =========================================================
 */

function ExpandedTaskSection({
  title,
  status,
  tasks,
  search,
  onSearchChange,
  onBack,
}: {
  title: string;
  status: TaskStatus;
  tasks: MyTask[];
  search: string;
  onSearchChange: (
    value: string,
  ) => void;
  onBack: () => void;
}) {
  const styles: Record<
    TaskStatus,
    {
      border: string;
      background: string;
      title: string;
      circle: string;
    }
  > = {
    todo: {
      border:
        "border-[rgb(131_80_196_/_0.32)]",

      background:
        "bg-[linear-gradient(145deg,#242138,#211f32)]",

      title:
        "text-[var(--pale-sky)]",

      circle:
        "border-[var(--lilac-300)]",
    },

    "in-progress": {
      border:
        "border-[rgb(115_146_181_/_0.42)]",

      background:
        "bg-[linear-gradient(145deg,#232b40,#202438)]",

      title:
        "text-[var(--sky-200)]",

      circle:
        "border-[#a8d9f1]",
    },

    done: {
      border:
        "border-[rgb(112_180_191_/_0.40)]",

      background:
        "bg-[linear-gradient(145deg,#24333d,#202a36)]",

      title:
        "text-[#b9e4f8]",

      circle:
        "border-[#b9e4f8] bg-[#b9e4f8]",
    },
  };

  const style =
    styles[status];

  return (
    <div
      className={`overflow-hidden rounded-[18px] border ${style.border} ${style.background} shadow-[0_20px_55px_-46px_rgba(0,0,0,.72)]`}
    >
      {/*
       * =========================================================
       * EXPANDED HEADER
       * =========================================================
       */}

      <div className="flex flex-col gap-4 border-b border-[rgb(96_105_144_/_0.18)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={
              onBack
            }
            aria-label="Back to all task columns"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(96_105_144_/_0.25)] bg-[#202235]/70 text-[var(--denim-300)] transition-colors hover:border-[rgb(177_138_235_/_0.35)] hover:text-[var(--pale-sky)]"
          >
            <ChevronLeftIcon />
          </button>

          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${style.circle}`}
          >
            {status ===
              "done" && (
              <CheckIcon />
            )}
          </span>

          <h3
            className={`db-display-title text-[1.55rem] ${style.title}`}
          >
            {title}
          </h3>

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#34364c] px-1.5 text-[8px] font-black text-[var(--denim-300)]">
            {
              tasks.length
            }
          </span>
        </div>

        <div className="relative w-full lg:max-w-[340px]">
          <SearchIcon />

          <input
            type="search"
            value={
              search
            }
            onChange={(
              event,
            ) =>
              onSearchChange(
                event.target
                  .value,
              )
            }
            placeholder={`Search ${title.toLowerCase()} tasks...`}
            className="h-11 w-full rounded-xl border border-[rgb(96_105_144_/_0.30)] bg-[#202235]/85 pl-11 pr-4 text-xs font-semibold text-[var(--pale-sky)] outline-none transition-all placeholder:text-[var(--text-faint)] focus:border-[rgb(177_138_235_/_0.48)] focus:ring-4 focus:ring-[rgb(131_80_196_/_0.10)]"
          />
        </div>
      </div>

      {/*
       * =========================================================
       * EXPANDED TASK LIST
       * =========================================================
       */}

      <div className="max-h-[620px] overflow-y-auto p-3">
        {tasks.length >
        0 ? (
          <div className="grid gap-2.5 lg:grid-cols-2">
            {tasks.map(
              (task) => (
                <TaskCard
                  key={
                    task._id
                  }
                  task={
                    task
                  }
                />
              ),
            )}
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-[rgb(96_105_144_/_0.22)] text-[10px] font-semibold text-[var(--text-faint)]">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * TASK CARD
 * =========================================================
 */

function TaskCard({
  task,
}: {
  task: MyTask;
}) {
  const done =
    task.status === "done";

  return (
    <article className="rounded-[14px] border border-[rgb(96_105_144_/_0.30)] bg-[#202235]/95 p-3.5 shadow-[0_14px_30px_-30px_rgba(0,0,0,.8)] transition-all hover:-translate-y-0.5 hover:border-[rgb(131_80_196_/_0.42)] hover:bg-[#25273b]">
      {/*
       * =========================================================
       * TASK HEADER
       * =========================================================
       */}

      <div className="flex items-start gap-3">
        <StatusCheck
          status={
            task.status
          }
        />

        <div className="min-w-0 flex-1">
          <h4
            className={`truncate text-xs font-black text-[var(--pale-sky)] ${
              done
                ? "opacity-55 line-through"
                : ""
            }`}
          >
            {
              task.title
            }
          </h4>

          <Link
            to={`/projects/${task.project._id}`}
            className="mt-1.5 flex w-fit items-center gap-2 text-[9px] font-semibold text-[var(--denim-300)] transition-colors hover:text-[var(--pale-sky)]"
          >
            <ProjectTypeIcon
              name={
                task.project.name
              }
            />

            {
              task.project.name
            }
          </Link>
        </div>

        <AssigneeAvatar
          task={
            task
          }
        />

        <PriorityBadge
          priority={
            task.priority
          }
        />
      </div>

      {/*
       * =========================================================
       * TASK FOOTER
       * =========================================================
       */}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 pl-8">
        <div className="flex flex-wrap gap-1.5">
          {task.labels
            .slice(
              0,
              2,
            )
            .map(
              (label) => (
                <LabelBadge
                  key={
                    label
                  }
                  label={
                    label
                  }
                />
              ),
            )}
        </div>

        <div
          className={`flex items-center gap-2 text-[8px] font-semibold ${
            task.dueDate &&
            isOverdue(
              task.dueDate,
            ) &&
            !done
              ? "text-[var(--lilac-200)]"
              : "text-[var(--denim-300)]"
          }`}
        >
          <CalendarIcon />

          {task.dueDate
            ? formatDate(
                task.dueDate,
              )
            : "No due date"}
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * TASK TABLE ROW
 * =========================================================
 */

function TaskTableRow({
  task,
}: {
  task: MyTask;
}) {
  return (
    <tr className="border-b border-[rgb(96_105_144_/_0.13)] transition-colors last:border-0 hover:bg-[#25273b]/70">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <StatusCheck
            status={
              task.status
            }
          />

          <span
            className={`text-[11px] font-bold text-[var(--pale-sky)] ${
              task.status ===
              "done"
                ? "opacity-55 line-through"
                : ""
            }`}
          >
            {
              task.title
            }
          </span>
        </div>
      </td>

      <td className="px-5 py-3">
        <Link
          to={`/projects/${task.project._id}`}
          className="flex items-center gap-2 text-[10px] font-semibold text-[var(--denim-300)] transition-colors hover:text-[var(--pale-sky)]"
        >
          <ProjectTypeIcon
            name={
              task.project.name
            }
          />

          {
            task.project.name
          }
        </Link>
      </td>

      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1.5">
          {task.labels.length >
          0 ? (
            task.labels
              .slice(
                0,
                2,
              )
              .map(
                (label) => (
                  <LabelBadge
                    key={
                      label
                    }
                    label={
                      label
                    }
                  />
                ),
              )
          ) : (
            <span className="text-[9px] text-[var(--text-faint)]">
              —
            </span>
          )}
        </div>
      </td>

      <td className="px-5 py-3">
        <AssigneeAvatar
          task={
            task
          }
        />
      </td>

      <td className="px-5 py-3">
        <PriorityBadge
          priority={
            task.priority
          }
        />
      </td>

      <td className="px-5 py-3">
        <div className="flex items-center gap-2 text-[9px] font-semibold text-[var(--denim-300)]">
          <CalendarIcon />

          {task.dueDate
            ? formatDate(
                task.dueDate,
              )
            : "—"}
        </div>
      </td>

      <td className="px-5 py-3">
        <StatusBadge
          status={
            task.status
          }
        />
      </td>
    </tr>
  );
}

/*
 * =========================================================
 * TABLE HEADING
 * =========================================================
 */

function TableHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-[8px] font-black uppercase tracking-[0.13em] text-[var(--text-faint)]">
      {children}
    </th>
  );
}

/*
 * =========================================================
 * STATUS CHECK
 * =========================================================
 */

function StatusCheck({
  status,
}: {
  status: TaskStatus;
}) {
  const styles: Record<
    TaskStatus,
    string
  > = {
    todo:
      "border-[var(--denim-300)] bg-transparent",

    "in-progress":
      "border-[var(--lilac-300)] bg-transparent",

    done:
      "border-[#b9e4f8] bg-[#b9e4f8] text-[#202235]",
  };

  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${styles[status]}`}
    >
      {status ===
        "done" && (
        <CheckIcon />
      )}
    </span>
  );
}

/*
 * =========================================================
 * STATUS BADGE
 * =========================================================
 */

function StatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  const labels: Record<
    TaskStatus,
    string
  > = {
    todo: "To do",
    "in-progress":
      "In progress",
    done: "Done",
  };

  const styles: Record<
    TaskStatus,
    string
  > = {
    todo:
      "border-[rgb(115_146_181_/_0.26)] bg-[rgb(115_146_181_/_0.12)] text-[var(--denim-300)]",

    "in-progress":
      "border-[rgb(131_80_196_/_0.34)] bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-200)]",

    done:
      "border-[rgb(185_228_248_/_0.24)] bg-[rgb(185_228_248_/_0.11)] text-[#b9e4f8]",
  };

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.10em] ${styles[status]}`}
    >
      {
        labels[
          status
        ]
      }
    </span>
  );
}

/*
 * =========================================================
 * PRIORITY BADGE
 * =========================================================
 */

function PriorityBadge({
  priority,
}: {
  priority: TaskPriority;
}) {
  const styles: Record<
    TaskPriority,
    string
  > = {
    high:
      "border-[rgb(131_80_196_/_0.38)] bg-[#4a2d75] text-[var(--lilac-200)]",

    medium:
      "border-[rgb(115_146_181_/_0.36)] bg-[#304f70] text-[#b9e4f8]",

    low:
      "border-[rgb(115_146_181_/_0.24)] bg-[#263b58] text-[var(--denim-300)]",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-lg border px-3 py-1.5 text-[8px] font-black capitalize ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

/*
 * =========================================================
 * LABEL BADGE
 * =========================================================
 */

function LabelBadge({
  label,
}: {
  label: string;
}) {
  const variant =
    getLabelVariant(
      label,
    );

  const styles = [
    "border-[rgb(131_80_196_/_0.30)] bg-[#3d2c5f] text-[var(--lilac-200)]",
    "border-[rgb(115_146_181_/_0.30)] bg-[#2d4260] text-[#a8d9f1]",
    "border-[rgb(201_224_235_/_0.20)] bg-[#30364e] text-[var(--sky-200)]",
  ];

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[7px] font-black ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

/*
 * =========================================================
 * ASSIGNEE AVATAR
 * =========================================================
 */

function AssigneeAvatar({
  task,
}: {
  task: MyTask;
}) {
  const name =
    task.assignee?.name ??
    "You";

  return (
    <div
      title={
        name
      }
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgb(201_224_235_/_0.12)] bg-[linear-gradient(135deg,#526d95,#7657a6)] text-[7px] font-black text-[var(--sky-50)]"
    >
      {getInitials(
        name,
      )}
    </div>
  );
}

/*
 * =========================================================
 * EMPTY MESSAGE
 * =========================================================
 */

function EmptyMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 flex min-h-[240px] items-center justify-center rounded-[20px] border border-dashed border-[rgb(96_105_144_/_0.32)] bg-[#1f2132]/70 p-6 text-sm font-semibold text-[var(--text-muted)]">
      {text}
    </div>
  );
}

/*
 * =========================================================
 * TASK HELPERS
 * =========================================================
 */

function sortTasksByDueDate(
  a: MyTask,
  b: MyTask,
) {
  if (
    !a.dueDate &&
    !b.dueDate
  ) {
    return 0;
  }

  if (!a.dueDate) {
    return 1;
  }

  if (!b.dueDate) {
    return -1;
  }

  return (
    new Date(
      a.dueDate,
    ).getTime() -
    new Date(
      b.dueDate,
    ).getTime()
  );
}

function sortTasksByDueDateDescending(
  a: MyTask,
  b: MyTask,
) {
  if (
    !a.dueDate &&
    !b.dueDate
  ) {
    return 0;
  }

  if (!a.dueDate) {
    return 1;
  }

  if (!b.dueDate) {
    return -1;
  }

  return (
    new Date(
      b.dueDate,
    ).getTime() -
    new Date(
      a.dueDate,
    ).getTime()
  );
}

function isOverdue(
  value: string,
) {
  const due =
    new Date(value);

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  return (
    due.getTime() <
    today.getTime()
  );
}

function getStatusLabel(
  status: TaskStatus,
) {
  const labels: Record<
    TaskStatus,
    string
  > = {
    todo: "To do",
    "in-progress":
      "In progress",
    done: "Done",
  };

  return labels[status];
}

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase(),
    )
    .join("");
}

function getLabelVariant(
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

  return total % 3;
}

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

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
    new Date(value),
  );
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function TaskCreateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 9h6M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusCreateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0 text-[var(--denim-300)]"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="7"
        stroke="currentColor"
        strokeWidth="1.7"
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

function UserCreateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0 text-[var(--denim-300)]"
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
        d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6"
        stroke="currentColor"
        strokeWidth="1.7"
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--denim-300)]"
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

function PriorityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0 text-[var(--denim-300)]"
      aria-hidden="true"
    >
      <path
        d="M6 20V5M6 6h10l-2.5 3L16 12H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0 text-[var(--denim-300)]"
      aria-hidden="true"
    >
      <path
        d="M7 6h10M7 11h7M7 16h4M17 14v6M14.5 17.5 17 20l2.5-2.5"
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

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M9 6h11M9 12h11M9 18h11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="5"
        cy="6"
        r="1"
        fill="currentColor"
      />

      <circle
        cx="5"
        cy="12"
        r="1"
        fill="currentColor"
      />

      <circle
        cx="5"
        cy="18"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function StatusTabIcon({
  status,
}: {
  status: StatusFilter;
}) {
  if (
    status === "all"
  ) {
    return (
      <ListIcon />
    );
  }

  if (
    status === "done"
  ) {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current">
        <CheckIcon />
      </span>
    );
  }

  return (
    <span className="h-4 w-4 rounded-full border-2 border-current" />
  );
}

function ProjectTypeIcon({
  name,
}: {
  name: string;
}) {
  const variant =
    getLabelVariant(
      name,
    );

  if (
    variant === 0
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M8 21h8M12 17v4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (
    variant === 1
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
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
      </svg>
    );
  }

  return (
    <FolderSmallIcon />
  );
}

function FolderSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 shrink-0 text-[var(--denim-300)]"
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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3 w-3"
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

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none h-4 w-4 shrink-0 text-[var(--denim-300)]"
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

function ChevronRightSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
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

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m15 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MyTasksPage;