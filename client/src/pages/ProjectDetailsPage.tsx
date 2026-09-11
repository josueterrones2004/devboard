import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import {
  Link,
  useParams,
} from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import ErrorToast from "../components/ErrorToast";
import ProjectActions from "../components/ProjectActions";

import {
  ApiError,
} from "../services/api";

import {
  getProject,
  type Project,
  type ProjectIcon,
} from "../services/projectService";

import {
  createTask,
  deleteTask,
  getProjectTasks,
  updateTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../services/taskService";

type PriorityFilter =
  | "all"
  | TaskPriority;

/*
 * =========================================================
 * DROPDOWN TYPES
 * =========================================================
 */

type DropdownOption<
  T extends string,
> = {
  label: string;
  value: T;
};

type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  labels: string;
};

type DragData =
  | {
      type: "task";
      taskId: string;
      status: TaskStatus;
    }
  | {
      type: "column";
      status: TaskStatus;
    };

const columns: {
  id: TaskStatus;
  title: string;
  description: string;
}[] = [
  {
    id: "todo",
    title: "To do",
    description:
      "Ready to start",
  },
  {
    id: "in-progress",
    title: "In progress",
    description:
      "Currently active",
  },
  {
    id: "done",
    title: "Done",
    description:
      "Completed work",
  },
];

const priorityFilters: {
  label: string;
  value: PriorityFilter;
}[] = [
  {
    label: "All",
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

function normalizePositions(
  tasks: Task[],
) {
  return columns.flatMap(
    (column) =>
      tasks
        .filter(
          (task) =>
            task.status ===
            column.id,
        )
        .map(
          (task, index) => ({
            ...task,
            position: index,
          }),
        ),
  );
}

function reorderTasks(
  tasks: Task[],
  activeTaskId: string,
  targetStatus: TaskStatus,
  overTaskId: string | null,
) {
  const activeTask =
    tasks.find(
      (task) =>
        task._id ===
        activeTaskId,
    );

  if (!activeTask) {
    return tasks;
  }

  const sourceStatus =
    activeTask.status;

  if (
    sourceStatus ===
    targetStatus
  ) {
    const sourceTasks =
      tasks.filter(
        (task) =>
          task.status ===
          sourceStatus,
      );

    const oldIndex =
      sourceTasks.findIndex(
        (task) =>
          task._id ===
          activeTaskId,
      );

    const newIndex =
      overTaskId
        ? sourceTasks.findIndex(
            (task) =>
              task._id ===
              overTaskId,
          )
        : sourceTasks.length - 1;

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return tasks;
    }

    const reordered =
      arrayMove(
        sourceTasks,
        oldIndex,
        newIndex,
      );

    return normalizePositions([
      ...tasks.filter(
        (task) =>
          task.status !==
          sourceStatus,
      ),
      ...reordered,
    ]);
  }

  const sourceTasks =
    tasks.filter(
      (task) =>
        task.status ===
          sourceStatus &&
        task._id !==
          activeTaskId,
    );

  const targetTasks =
    tasks.filter(
      (task) =>
        task.status ===
        targetStatus,
    );

  const movedTask: Task = {
    ...activeTask,
    status: targetStatus,
  };

  const targetIndex =
    overTaskId
      ? targetTasks.findIndex(
          (task) =>
            task._id ===
            overTaskId,
        )
      : targetTasks.length;

  if (targetIndex === -1) {
    targetTasks.push(
      movedTask,
    );
  } else {
    targetTasks.splice(
      targetIndex,
      0,
      movedTask,
    );
  }

  const otherTasks =
    tasks.filter(
      (task) =>
        task.status !==
          sourceStatus &&
        task.status !==
          targetStatus,
    );

  return normalizePositions([
    ...otherTasks,
    ...sourceTasks,
    ...targetTasks,
  ]);
}

function createEmptyForm(
  project: Project,
  status: TaskStatus = "todo",
): TaskForm {
  return {
    title: "",
    description: "",
    status,
    priority: "medium",

    assignee:
      project.members[0]?._id ??
      "",

    dueDate: "",
    labels: "",
  };
}

function ProjectDetailsPage() {
  const { projectId } =
    useParams();

  const [
    project,
    setProject,
  ] = useState<Project | null>(
    null,
  );

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState<PriorityFilter>(
      "all",
    );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingTask,
    setEditingTask,
  ] =
    useState<Task | null>(
      null,
    );

  const [
    taskForm,
    setTaskForm,
  ] =
    useState<TaskForm | null>(
      null,
    );

  const [saving, setSaving] =
    useState(false);

  const [
    activeTaskId,
    setActiveTaskId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    dragOverStatus,
    setDragOverStatus,
  ] =
    useState<TaskStatus | null>(
      null,
    );

  const [
    toastMessage,
    setToastMessage,
  ] = useState("");

  const [
    errorField,
    setErrorField,
  ] = useState<string | null>(
    null,
  );

  const [shaking, setShaking] =
    useState(false);

  const [
    taskToDelete,
    setTaskToDelete,
  ] = useState<Task | null>(
    null,
  );

  const [
    deletingTask,
    setDeletingTask,
  ] = useState(false);

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 6,
          },
        },
      ),
    );

  useEffect(() => {
    if (!projectId) {
      return;
    }

    Promise.all([
      getProject(projectId),

      getProjectTasks(
        projectId,
      ),
    ])
      .then(
        ([
          projectResponse,
          taskResponse,
        ]) => {
          setProject(
            projectResponse.project,
          );

          setTasks(
            normalizePositions(
              taskResponse.tasks,
            ),
          );
        },
      )
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load project",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  const filteredTasks =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return tasks.filter(
        (task) => {
          const matchesSearch =
            !query ||
            task.title
              .toLowerCase()
              .includes(query) ||
            task.description
              .toLowerCase()
              .includes(query) ||
            task.labels.some(
              (label) =>
                label
                  .toLowerCase()
                  .includes(query),
            );

          const matchesPriority =
            priorityFilter ===
              "all" ||
            task.priority ===
              priorityFilter;

          return (
            matchesSearch &&
            matchesPriority
          );
        },
      );
    }, [
      tasks,
      search,
      priorityFilter,
    ]);

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "done",
    ).length;

  const progress =
    tasks.length > 0
      ? Math.round(
          (completedTasks /
            tasks.length) *
            100,
        )
      : 0;

  /*
   * =========================================================
   * DERIVED PROJECT STATUS
   * =========================================================
   */

  const projectStatus:
    Project["status"] =
      tasks.length === 0
        ? (project?.status ?? "planning")
        : tasks.every(
              (task) =>
                task.status ===
                "done",
            )
          ? "completed"
          : "active";

  const activeTask =
    activeTaskId
      ? tasks.find(
          (task) =>
            task._id ===
            activeTaskId,
        ) ?? null
      : null;

  const triggerModalError = (
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
   * LOADING STATE
   * =========================================================
   */

  if (loading) {
    return (
      <div
        className="flex min-h-[calc(100vh-86px)] items-center justify-center"
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
            )
          `,

          backgroundSize:
            "56px 56px, 56px 56px, auto, auto",
        }}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-[rgb(96_105_144_/_0.30)] bg-[#202235]/80 px-5 py-4 text-xs font-bold text-[var(--text-muted)] backdrop-blur-xl">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--lilac-300)]" />

          Loading project...
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR STATE
   * =========================================================
   */

  if (
    error ||
    !project ||
    !projectId
  ) {
    return (
      <div
        className="min-h-[calc(100vh-86px)] px-6 py-12"
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
            )
          `,

          backgroundSize:
            "56px 56px",
        }}
      >
        <div className="mx-auto max-w-3xl rounded-[20px] border border-[rgb(212_77_92_/_0.28)] bg-[rgb(212_77_92_/_0.10)] p-6 text-sm font-semibold text-[var(--lilac-200)]">
          {error ||
            "Project not found"}
        </div>
      </div>
    );
  }

  const openCreateModal = (
    status: TaskStatus = "todo",
  ) => {
    setEditingTask(null);
    setErrorField(null);
    setToastMessage("");

    setTaskForm(
      createEmptyForm(
        project,
        status,
      ),
    );

    setModalOpen(true);
  };

  const openEditModal = (
    task: Task,
  ) => {
    setEditingTask(task);
    setErrorField(null);
    setToastMessage("");

    setTaskForm({
      title: task.title,
      description:
        task.description,
      status: task.status,
      priority:
        task.priority,
      assignee:
        task.assignee?._id ??
        "",
      dueDate:
        task.dueDate?.slice(
          0,
          10,
        ) ?? "",
      labels:
        task.labels.join(
          ", ",
        ),
    });

    setModalOpen(true);
  };

  const closeTaskModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setTaskForm(null);
    setErrorField(null);
    setToastMessage("");
    setShaking(false);
  };

  const handleSaveTask =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!taskForm) {
        return;
      }

      if (
        !taskForm.title.trim()
      ) {
        triggerModalError(
          "Task title is required",
          "title",
        );

        return;
      }

      if (!taskForm.dueDate) {
        triggerModalError(
          "Due date is required",
          "dueDate",
        );

        return;
      }

      setSaving(true);
      setErrorField(null);

      const labels =
        taskForm.labels
          .split(",")
          .map((label) =>
            label.trim(),
          )
          .filter(Boolean);

      try {
        if (editingTask) {
          const response =
            await updateTask(
              editingTask._id,
              {
                title:
                  taskForm.title,

                description:
                  taskForm.description,

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

          setTasks(
            (current) =>
              normalizePositions(
                current.map(
                  (task) =>
                    task._id ===
                    editingTask._id
                      ? response.task
                      : task,
                ),
              ),
          );
        } else {
          const response =
            await createTask(
              projectId,
              {
                title:
                  taskForm.title,

                description:
                  taskForm.description,

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

          setProject(
            (current) =>
              current
                ? {
                    ...current,
                    status:
                      response.projectStatus,
                  }
                : current,
          );

          setTasks(
            (current) =>
              normalizePositions([
                ...current,
                response.task,
              ]),
          );
        }

        closeTaskModal();
      } catch (error) {
        if (
          error instanceof ApiError
        ) {
          triggerModalError(
            error.message,
            error.field,
          );
        } else {
          triggerModalError(
            error instanceof Error
              ? error.message
              : "Failed to save task",
          );
        }
      } finally {
        setSaving(false);
      }
    };

  const handleDeleteTask = (
    task: Task,
  ) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask =
    async () => {
      if (!taskToDelete) {
        return;
      }

      setDeletingTask(true);

      try {
        await deleteTask(
          taskToDelete._id,
        );

        setTasks(
          (current) =>
            normalizePositions(
              current.filter(
                (task) =>
                  task._id !==
                  taskToDelete._id,
              ),
            ),
        );

        if (tasks.length === 1) {
          setProject(
            (current) =>
              current
                ? {
                    ...current,
                    status:
                      "planning",
                  }
                : current,
          );
        }

        setTaskToDelete(null);
      } catch (error) {
        setToastMessage(
          error instanceof Error
            ? error.message
            : "Failed to delete task",
        );
      } finally {
        setDeletingTask(false);
      }
    };

  const handleDragStart = (
    event: DragStartEvent,
  ) => {
    const data =
      event.active.data
        .current as
        | DragData
        | undefined;

    if (
      data?.type === "task"
    ) {
      setActiveTaskId(
        data.taskId,
      );

      setDragOverStatus(
        data.status,
      );
    }
  };

  const handleDragOver = (
    event: DragOverEvent,
  ) => {
    const data =
      event.over?.data
        .current as
        | DragData
        | undefined;

    setDragOverStatus(
      data?.status ?? null,
    );
  };

  const handleDragEnd =
    async (
      event: DragEndEvent,
    ) => {
      setActiveTaskId(null);
      setDragOverStatus(null);

      const activeData =
        event.active.data
          .current as
          | DragData
          | undefined;

      const overData =
        event.over?.data
          .current as
          | DragData
          | undefined;

      if (
        !activeData ||
        activeData.type !==
          "task" ||
        !overData
      ) {
        return;
      }

      const previousTasks =
        tasks;

      const nextTasks =
        reorderTasks(
          tasks,
          activeData.taskId,
          overData.status,
          overData.type ===
            "task"
            ? overData.taskId
            : null,
        );

      setTasks(nextTasks);

      try {
        for (
          const task of nextTasks
        ) {
          await updateTask(
            task._id,
            {
              status:
                task.status,

              position:
                task.position,
            },
          );
        }
      } catch {
        setTasks(
          previousTasks,
        );

        setToastMessage(
          "Failed to save task order",
        );
      }
    };

  /*
   * =========================================================
   * PROJECT COUNTS
   * =========================================================
   */

  const todoCount =
    tasks.filter(
      (task) =>
        task.status ===
        "todo",
    ).length;

  const inProgressCount =
    tasks.filter(
      (task) =>
        task.status ===
        "in-progress",
    ).length;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
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
        className="relative isolate z-0 min-h-[calc(100vh-86px)]"
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
           * BACK TO PROJECTS
           * =========================================================
           */}

          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 rounded-xl px-1 py-1 text-[10px] font-black text-[var(--denim-300)] transition-colors hover:text-[var(--pale-sky)]"
          >
            <ChevronLeftIcon />

            Back to projects
          </Link>

          {/*
           * =========================================================
           * PROJECT HERO
           * =========================================================
           */}

          <section
            className="relative mt-4 overflow-hidden rounded-[24px] border border-[rgb(131_80_196_/_0.40)] shadow-[0_28px_75px_-52px_rgba(109,54,222,.65)]"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at 86% 12%,
                  rgba(131,80,196,.24),
                  transparent 22rem
                ),
                radial-gradient(
                  circle at 58% 110%,
                  rgba(115,146,181,.17),
                  transparent 22rem
                ),
                linear-gradient(
                  120deg,
                  #242138 0%,
                  #29233f 48%,
                  #30264c 100%
                )
              `,
            }}
          >
            {/*
             * =========================================================
             * HERO GRID BACKGROUND
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

            <div className="relative z-[1] grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(430px,.82fr)] xl:items-stretch">
              {/*
               * =========================================================
               * PROJECT IDENTITY
               * =========================================================
               */}

              <div className="flex min-w-0 flex-col justify-between">
                <div>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <ProjectGlyph
                      name={
                        project.name
                      }
                      icon={
                        project.icon
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <ProjectStatusBadge
                          status={
                            projectStatus
                          }
                        />

                        <span className="h-1 w-1 rounded-full bg-[var(--denim-300)]/50" />

                        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-faint)]">
                          Project workspace
                        </span>
                      </div>

                      <h1 className="db-display-title mt-3 break-words text-[2.45rem] leading-[0.98] sm:text-[3rem]">
                        {project.name}
                      </h1>

                      <p className="mt-4 max-w-3xl text-xs leading-6 text-[var(--text-secondary)] sm:text-sm">
                        {project.description ||
                          "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
            <ProjectActions
            project={{
             ...project,
             status:
              projectStatus,
            }}
            onUpdated={
              setProject
            }
          />
                  <button
                    type="button"
                    onClick={() =>
                      openCreateModal()
                    }
                    className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-[rgb(177_138_235_/_0.52)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 text-[10px] font-black text-[var(--sky-50)] shadow-[0_16px_32px_-18px_rgba(109,54,222,.78)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    <PlusIcon />

                    New task
                  </button>
                </div>
              </div>

              {/*
               * =========================================================
               * PROJECT PROGRESS
               * =========================================================
               */}

              <div className="rounded-[20px] border border-[rgb(201_224_235_/_0.10)] bg-[#202235]/65 p-5 backdrop-blur-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)]">
                      Project progress
                    </p>

                    <p className="db-display-title mt-1 text-[2.25rem] leading-none">
                      {progress}%
                    </p>
                  </div>

                  <p className="text-right text-[9px] font-semibold leading-4 text-[var(--text-muted)]">
                    {completedTasks} of{" "}
                    {tasks.length} tasks
                    completed
                  </p>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#171827]/80">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7392b5,#8350c4,#6d36de)] transition-[width]"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 divide-x divide-[rgb(201_224_235_/_0.10)]">
                  <HeroStat
                    label="To do"
                    value={
                      todoCount
                    }
                  />

                  <HeroStat
                    label="In progress"
                    value={
                      inProgressCount
                    }
                  />

                  <HeroStat
                    label="Done"
                    value={
                      completedTasks
                    }
                  />
                </div>

                <div className="mt-5 border-t border-[rgb(201_224_235_/_0.10)] pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-faint)]">
                        Members
                      </p>

                      <p className="mt-1 text-[9px] font-semibold text-[var(--text-muted)]">
                        {project.members.length}{" "}
                        {project.members.length ===
                        1
                          ? "member"
                          : "members"}
                      </p>
                    </div>

                    <MemberStack
                      members={
                        project.members
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/*
           * =========================================================
           * BOARD TOOLBAR
           * =========================================================
           */}

          <section className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[430px]">
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
                placeholder="Search tasks, labels or descriptions..."
                className="h-12 w-full rounded-xl border border-[rgb(96_105_144_/_0.30)] bg-[#202235]/90 pl-11 pr-4 text-xs font-semibold text-[var(--pale-sky)] outline-none transition-all placeholder:text-[var(--text-faint)] hover:border-[rgb(115_146_181_/_0.44)] focus:border-[rgb(177_138_235_/_0.50)] focus:ring-4 focus:ring-[rgb(131_80_196_/_0.10)]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {priorityFilters.map(
                (filter) => {
                  const active =
                    priorityFilter ===
                    filter.value;

                  return (
                    <button
                      key={
                        filter.value
                      }
                      type="button"
                      onClick={() =>
                        setPriorityFilter(
                          filter.value,
                        )
                      }
                      className={`h-11 rounded-xl border px-4 text-[8px] font-black uppercase tracking-[0.12em] transition-all ${
                        active
                          ? "border-[rgb(177_138_235_/_0.48)] bg-[linear-gradient(135deg,#4d2d74,#6d36de)] text-[var(--sky-50)] shadow-[0_14px_30px_-20px_rgba(109,54,222,.78)]"
                          : "border-[rgb(96_105_144_/_0.28)] bg-[#202235]/85 text-[var(--text-muted)] hover:border-[rgb(115_146_181_/_0.42)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
                      }`}
                    >
                      {filter.value ===
                      "all"
                        ? "All priorities"
                        : filter.label}
                    </button>
                  );
                },
              )}
            </div>
          </section>

          {/*
           * =========================================================
           * KANBAN BOARD
           * =========================================================
           */}

          <DndContext
            sensors={
              sensors
            }
            collisionDetection={
              closestCorners
            }
            onDragStart={
              handleDragStart
            }
            onDragOver={
              handleDragOver
            }
            onDragEnd={
              handleDragEnd
            }
          >
            <section className="mt-5 grid items-start gap-4 xl:grid-cols-3">
              {columns.map(
                (column) => (
                  <KanbanColumn
                    key={
                      column.id
                    }
                    column={
                      column
                    }
                    tasks={filteredTasks.filter(
                      (task) =>
                        task.status ===
                        column.id,
                    )}
                    highlighted={
                      dragOverStatus ===
                      column.id
                    }
                    onAdd={() =>
                      openCreateModal(
                        column.id,
                      )
                    }
                    onEdit={
                      openEditModal
                    }
                    onDelete={
                      handleDeleteTask
                    }
                  />
                ),
              )}
            </section>

            <DragOverlay>
              {activeTask ? (
                <TaskPreview
                  task={
                    activeTask
                  }
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/*
       * =========================================================
       * TASK MODAL
       * =========================================================
       */}

      {modalOpen &&
        taskForm && (
          <TaskModal
            project={
              project
            }
            form={
              taskForm
            }
            setForm={
              setTaskForm
            }
            saving={
              saving
            }
            editing={Boolean(
              editingTask,
            )}
            errorField={
              errorField
            }
            setErrorField={
              setErrorField
            }
            shaking={
              shaking
            }
            onSubmit={
              handleSaveTask
            }
            onClose={
              closeTaskModal
            }
          />
        )}

      {/*
       * =========================================================
       * DELETE TASK MODAL
       * =========================================================
       */}

      <div className="relative z-[800]">
        <ConfirmModal
          open={Boolean(
            taskToDelete,
          )}
          title="Delete task?"
          description={
            taskToDelete
              ? `You are about to permanently delete "${taskToDelete.title}". This action cannot be undone.`
              : ""
          }
          confirmText="Delete task"
          danger
          loading={
            deletingTask
          }
          onClose={() => {
            if (
              !deletingTask
            ) {
              setTaskToDelete(
                null,
              );
            }
          }}
          onConfirm={
            confirmDeleteTask
          }
        />
      </div>
    </>
  );
}

/*
 * =========================================================
 * HERO STAT
 * =========================================================
 */

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <p className="text-lg font-black text-[var(--pale-sky)]">
        {value}
      </p>

      <p className="mt-1 text-[7px] font-black uppercase tracking-[0.10em] text-[var(--text-faint)]">
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PROJECT STATUS BADGE
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
    active:
      "border-[rgb(131_80_196_/_0.38)] bg-[rgb(131_80_196_/_0.18)] text-[var(--lilac-200)]",

    planning:
      "border-[rgb(115_146_181_/_0.32)] bg-[rgb(115_146_181_/_0.14)] text-[var(--denim-300)]",

    completed:
      "border-[rgb(185_228_248_/_0.24)] bg-[rgb(185_228_248_/_0.10)] text-[#b9e4f8]",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] ${styles[status]}`}
    >
      {status}
    </span>
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
}: {
  name: string;
  icon:
    | ProjectIcon
    | undefined;
}) {
  const variant =
    getVisualVariant(
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
      className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] text-[var(--sky-50)]"
      style={{
        background:
          gradients[
            variant
          ],

        boxShadow: `
          inset 0 0 0 1px rgba(201,224,235,.12),
          0 20px 48px -28px rgba(109,54,222,.68)
        `,
      }}
    >
      <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15 blur-2xl" />

      <div className="relative h-11 w-11">
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
 * MEMBER STACK
 * =========================================================
 */

function MemberStack({
  members,
}: {
  members:
    Project["members"];
}) {
  const visible =
    members.slice(
      0,
      4,
    );

  const remaining =
    Math.max(
      members.length -
        visible.length,
      0,
    );

  return (
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
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#202235] text-[7px] font-black text-[var(--sky-50)] ${
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
        <div className="-ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#202235] bg-[#313449] text-[7px] font-black text-[var(--denim-300)]">
          +{remaining}
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * KANBAN COLUMN
 * =========================================================
 */

type KanbanColumnProps = {
  column:
    (typeof columns)[number];

  tasks: Task[];

  highlighted: boolean;

  onAdd: () => void;

  onEdit: (
    task: Task,
  ) => void;

  onDelete: (
    task: Task,
  ) => void;
};

function KanbanColumn({
  column,
  tasks,
  highlighted,
  onAdd,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef } =
    useDroppable({
      id: `column:${column.id}`,

      data: {
        type: "column",
        status:
          column.id,
      } satisfies DragData,
    });

  const styles: Record<
    TaskStatus,
    {
      border: string;
      background: string;
      title: string;
      dot: string;
      count: string;
    }
  > = {
    todo: {
      border:
        "border-[rgb(131_80_196_/_0.30)]",

      background:
        "bg-[linear-gradient(145deg,#242138,#211f32)]",

      title:
        "text-[var(--pale-sky)]",

      dot:
        "border-[var(--lilac-300)]",

      count:
        "bg-[rgb(131_80_196_/_0.14)] text-[var(--lilac-200)]",
    },

    "in-progress": {
      border:
        "border-[rgb(115_146_181_/_0.38)]",

      background:
        "bg-[linear-gradient(145deg,#232b40,#202438)]",

      title:
        "text-[var(--sky-200)]",

      dot:
        "border-[#a8d9f1]",

      count:
        "bg-[rgb(115_146_181_/_0.14)] text-[#a8d9f1]",
    },

    done: {
      border:
        "border-[rgb(112_180_191_/_0.34)]",

      background:
        "bg-[linear-gradient(145deg,#24333d,#202a36)]",

      title:
        "text-[#b9e4f8]",

      dot:
        "border-[#b9e4f8] bg-[#b9e4f8]",

      count:
        "bg-[rgb(185_228_248_/_0.10)] text-[#b9e4f8]",
    },
  };

  const style =
    styles[column.id];

  return (
    <div
      ref={
        setNodeRef
      }
      className={`overflow-hidden rounded-[18px] border transition-all ${
        highlighted
          ? "scale-[1.006] border-[rgb(177_138_235_/_0.56)] shadow-[0_0_0_4px_rgba(131,80,196,.07),0_24px_60px_-44px_rgba(109,54,222,.72)]"
          : style.border
      } ${style.background}`}
    >
      {/*
       * =========================================================
       * COLUMN HEADER
       * =========================================================
       */}

      <div className="flex min-h-[64px] items-center justify-between border-b border-[rgb(96_105_144_/_0.18)] px-4 py-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`h-4 w-4 rounded-full border-2 ${style.dot}`}
            />

            <h3
              className={`db-display-title text-[1.25rem] ${style.title}`}
            >
              {
                column.title
              }
            </h3>

            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[8px] font-black ${style.count}`}
            >
              {
                tasks.length
              }
            </span>
          </div>

          <p className="mt-1 text-[8px] font-semibold text-[var(--text-faint)]">
            {
              column.description
            }
          </p>
        </div>

        <button
          type="button"
          onClick={
            onAdd
          }
          aria-label={`Add task to ${column.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(96_105_144_/_0.22)] bg-[#202235]/55 text-[var(--denim-300)] transition-all hover:border-[rgb(177_138_235_/_0.36)] hover:bg-[rgb(131_80_196_/_0.12)] hover:text-[var(--pale-sky)]"
        >
          <PlusIcon />
        </button>
      </div>

      {/*
       * =========================================================
       * SORTABLE TASKS
       * =========================================================
       */}

      <SortableContext
        items={tasks.map(
          (task) =>
            task._id,
        )}
        strategy={
          verticalListSortingStrategy
        }
      >
        <div className="min-h-[170px] space-y-2.5 p-3">
          {tasks.length >
          0 ? (
            tasks.map(
              (task) => (
                <SortableTask
                  key={
                    task._id
                  }
                  task={
                    task
                  }
                  onEdit={() =>
                    onEdit(
                      task,
                    )
                  }
                  onDelete={() =>
                    onDelete(
                      task,
                    )
                  }
                />
              ),
            )
          ) : (
            <div className="flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-[rgb(96_105_144_/_0.22)] text-[9px] font-semibold text-[var(--text-faint)]">
              No tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/*
 * =========================================================
 * SORTABLE TASK
 * =========================================================
 */

type SortableTaskProps = {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
};

function SortableTask({
  task,
  onEdit,
  onDelete,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,

    data: {
      type: "task",
      taskId:
        task._id,
      status:
        task.status,
    } satisfies DragData,
  });

  return (
    <article
      ref={
        setNodeRef
      }
      style={{
        transform:
          CSS.Transform.toString(
            transform,
          ),

        transition,
      }}
      {...attributes}
      {...listeners}
      className={`group cursor-grab rounded-[14px] border bg-[#202235]/96 p-3.5 shadow-[0_14px_30px_-30px_rgba(0,0,0,.85)] transition-[border-color,background-color,opacity] active:cursor-grabbing ${
        isDragging
          ? "border-[rgb(177_138_235_/_0.40)] opacity-25"
          : "border-[rgb(96_105_144_/_0.30)] hover:border-[rgb(131_80_196_/_0.42)] hover:bg-[#25273b]"
      }`}
    >
      {/*
       * =========================================================
       * TASK TOP ROW
       * =========================================================
       */}

      <div className="flex items-start justify-between gap-3">
        <PriorityBadge
          priority={
            task.priority
          }
        />

        <div
          className="flex gap-1"
          onPointerDown={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={
              onEdit
            }
            aria-label={`Edit ${task.title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-faint)] transition-colors hover:bg-[rgb(201_224_235_/_0.05)] hover:text-[var(--pale-sky)]"
          >
            <EditIcon />
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            aria-label={`Delete ${task.title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[rgb(212_77_92_/_0.65)] transition-colors hover:bg-[rgb(212_77_92_/_0.10)] hover:text-[#ff9aa3]"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/*
       * =========================================================
       * TASK CONTENT
       * =========================================================
       */}

      <h4 className="mt-3 text-xs font-black leading-5 text-[var(--pale-sky)]">
        {
          task.title
        }
      </h4>

      <p className="mt-1.5 line-clamp-2 min-h-8 text-[9px] leading-4 text-[var(--text-muted)]">
        {task.description ||
          "No description."}
      </p>

      {task.labels.length >
        0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.labels
            .slice(
              0,
              3,
            )
            .map(
              (label) => (
                <TaskLabel
                  key={
                    label
                  }
                  label={
                    label
                  }
                />
              ),
            )}

          {task.labels.length >
            3 && (
            <span className="rounded-lg border border-[rgb(96_105_144_/_0.20)] bg-[#303349] px-2 py-1 text-[7px] font-black text-[var(--text-faint)]">
              +
              {task.labels.length -
                3}
            </span>
          )}
        </div>
      )}

      {/*
       * =========================================================
       * TASK FOOTER
       * =========================================================
       */}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[rgb(96_105_144_/_0.16)] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            title={
              task.assignee?.name ??
              "Unassigned"
            }
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgb(201_224_235_/_0.12)] bg-[linear-gradient(135deg,#526d95,#7657a6)] text-[7px] font-black text-[var(--sky-50)]"
          >
            {task.assignee
              ? getInitials(
                  task.assignee
                    .name,
                )
              : "—"}
          </div>

          <span className="truncate text-[8px] font-semibold text-[var(--text-faint)]">
            {task.assignee
              ? task.assignee
                  .name
              : "Unassigned"}
          </span>
        </div>

        <span
          className={`flex shrink-0 items-center gap-1.5 text-[8px] font-bold ${
            task.dueDate &&
            isOverdue(
              task.dueDate,
            ) &&
            task.status !==
              "done"
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
        </span>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * TASK PREVIEW
 * =========================================================
 */

function TaskPreview({
  task,
}: {
  task: Task;
}) {
  return (
    <div className="w-full rotate-1 rounded-[14px] border border-[rgb(177_138_235_/_0.52)] bg-[#24233a] p-4 shadow-[0_24px_70px_-18px_rgba(0,0,0,.88)]">
      <PriorityBadge
        priority={
          task.priority
        }
      />

      <h4 className="mt-3 text-xs font-black text-[var(--pale-sky)]">
        {
          task.title
        }
      </h4>

      <p className="mt-1.5 line-clamp-1 text-[9px] text-[var(--text-muted)]">
        {task.description ||
          "No description."}
      </p>
    </div>
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
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.10em] ${styles[priority]}`}
    >
      {
        priority
      }
    </span>
  );
}

/*
 * =========================================================
 * TASK LABEL
 * =========================================================
 */

function TaskLabel({
  label,
}: {
  label: string;
}) {
  const variant =
    getVisualVariant(
      label,
    ) % 3;

  const styles = [
    "border-[rgb(131_80_196_/_0.30)] bg-[#3d2c5f] text-[var(--lilac-200)]",

    "border-[rgb(115_146_181_/_0.30)] bg-[#2d4260] text-[#a8d9f1]",

    "border-[rgb(201_224_235_/_0.20)] bg-[#30364e] text-[var(--sky-200)]",
  ];

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-[7px] font-black ${styles[variant]}`}
    >
      {
        label
      }
    </span>
  );
}

/*
 * =========================================================
 * TASK MODAL
 * =========================================================
 */

type TaskModalProps = {
  project: Project;

  form: TaskForm;

  setForm: Dispatch<
    SetStateAction<TaskForm | null>
  >;

  saving: boolean;
  editing: boolean;

  errorField:
    string | null;

  setErrorField: Dispatch<
    SetStateAction<string | null>
  >;

  shaking: boolean;

  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;

  onClose: () => void;
};

function TaskModal({
  project,
  form,
  setForm,
  saving,
  editing,
  errorField,
  setErrorField,
  shaking,
  onSubmit,
  onClose,
}: TaskModalProps) {
  const updateForm = (
    values: Partial<TaskForm>,
  ) => {
    setForm(
      (current) =>
        current
          ? {
              ...current,
              ...values,
            }
          : current,
    );
  };

  const clearFieldError = (
    field: string,
  ) => {
    if (
      errorField ===
      field
    ) {
      setErrorField(null);
    }
  };

  const statusOptions: DropdownOption<TaskStatus>[] =
    [
      {
        label: "To do",
        value: "todo",
      },
      {
        label:
          "In progress",
        value:
          "in-progress",
      },
      {
        label: "Done",
        value: "done",
      },
    ];

  const priorityOptions: DropdownOption<TaskPriority>[] =
    [
      {
        label: "High",
        value: "high",
      },
      {
        label: "Medium",
        value:
          "medium",
      },
      {
        label: "Low",
        value: "low",
      },
    ];

  const assigneeOptions: DropdownOption<string>[] =
    [
      {
        label:
          "Unassigned",
        value: "",
      },
      ...project.members.map(
        (member) => ({
          label:
            member.name,
          value:
            member._id,
        }),
      ),
    ];

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center overflow-y-auto bg-[#11111b]/82 px-4 py-8 backdrop-blur-md"
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
      <form
        onSubmit={
          onSubmit
        }
        className={`db-modal w-full max-w-2xl overflow-visible rounded-[22px] ${
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
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgb(177_138_235_/_0.24)] bg-[rgb(131_80_196_/_0.16)] text-[var(--lilac-200)]">
                <TaskIcon />
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
                  {
                    project.name
                  }
                </p>

                <h2 className="db-display-title mt-1 text-xl">
                  {editing
                    ? "Edit task"
                    : "Create task"}
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
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[rgb(201_224_235_/_0.06)] hover:text-[var(--pale-sky)] disabled:opacity-40"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/*
         * =========================================================
         * MODAL BODY
         * =========================================================
         */}

        <div className="p-5 sm:p-6">
          <div className="space-y-5">
            <FieldLabel
              label="Title"
            >
              <input
                required
                value={
                  form.title
                }
                onChange={(
                  event,
                ) => {
                  updateForm({
                    title:
                      event.target
                        .value,
                  });

                  clearFieldError(
                    "title",
                  );
                }}
                placeholder="Task title"
                className={`input-style ${
                  errorField ===
                  "title"
                    ? "input-error"
                    : ""
                }`}
              />

              {errorField ===
                "title" && (
                <p className="mt-2 text-[9px] font-bold normal-case tracking-normal text-[#ff9aa3]">
                  This task title is already assigned to this user in this project.
                </p>
              )}
            </FieldLabel>

            <FieldLabel
              label="Description"
            >
              <textarea
                rows={4}
                value={
                  form.description
                }
                onChange={(
                  event,
                ) =>
                  updateForm({
                    description:
                      event.target
                        .value,
                  })
                }
                placeholder="Add useful task details..."
                className="input-style h-auto resize-none py-3"
              />
            </FieldLabel>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel
                label="Status"
              >
                <CustomDropdown
                  value={
                    form.status
                  }
                  options={
                    statusOptions
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm({
                      status:
                        value,
                    })
                  }
                  icon={
                    <StatusIcon />
                  }
                />
              </FieldLabel>

              <FieldLabel
                label="Priority"
              >
                <CustomDropdown
                  value={
                    form.priority
                  }
                  options={
                    priorityOptions
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm({
                      priority:
                        value,
                    })
                  }
                  icon={
                    <PriorityIcon />
                  }
                />
              </FieldLabel>

              <FieldLabel
                label="Assignee"
              >
                <CustomDropdown
                  value={
                    form.assignee
                  }
                  options={
                    assigneeOptions
                  }
                  onChange={(
                    value,
                  ) => {
                    updateForm({
                      assignee:
                        value,
                    });

                    clearFieldError(
                      "assignee",
                    );
                  }}
                  icon={
                    <UserIcon />
                  }
                  error={
                    errorField ===
                    "assignee"
                  }
                />
              </FieldLabel>

              <FieldLabel
                label="Due date"
              >
                <div className="relative">
                  <input
                    required
                    type="date"
                    value={
                      form.dueDate
                    }
                    onChange={(
                      event,
                    ) => {
                      updateForm({
                        dueDate:
                          event.target
                            .value,
                      });

                      clearFieldError(
                        "dueDate",
                      );
                    }}
                    className={`input-style ${
                      errorField ===
                      "dueDate"
                        ? "input-error"
                        : ""
                    }`}
                    style={{
                      colorScheme:
                        "dark",
                    }}
                  />
                </div>

                {errorField ===
                  "dueDate" && (
                  <p className="mt-2 text-[9px] font-bold normal-case tracking-normal text-[#ff9aa3]">
                    A due date is required for every task.
                  </p>
                )}
              </FieldLabel>
            </div>

            <FieldLabel
              label="Labels"
            >
              <input
                value={
                  form.labels
                }
                onChange={(
                  event,
                ) =>
                  updateForm({
                    labels:
                      event.target
                        .value,
                  })
                }
                placeholder="React, API, Backend"
                className="input-style"
              />

              <p className="mt-2 text-[8px] font-semibold normal-case tracking-normal text-[var(--text-faint)]">
                Separate labels with commas.
              </p>
            </FieldLabel>
          </div>

          {/*
           * =========================================================
           * MODAL ACTIONS
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
              className="rounded-xl border border-[rgb(96_105_144_/_0.28)] bg-[#25283b] px-5 py-3 text-[10px] font-black text-[var(--text-secondary)] transition-colors hover:bg-[#292c41] hover:text-[var(--pale-sky)] disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex min-w-[128px] items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 py-3 text-[10px] font-black text-[var(--sky-50)] shadow-[0_14px_30px_-18px_rgba(109,54,222,.75)] transition-all hover:brightness-110 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Saving...
                </>
              ) : editing ? (
                <>
                  <SaveIcon />

                  Save changes
                </>
              ) : (
                <>
                  <PlusIcon />

                  Create task
                </>
              )}
            </button>
          </div>
        </div>
      </form>
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
  value,
  options,
  onChange,
  icon,
  error = false,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (
    value: T,
  ) => void;
  icon?: ReactNode;
  error?: boolean;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const currentOption =
    options.find(
      (option) =>
        option.value ===
        value,
    ) ?? options[0];

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

  return (
    <div
      ref={
        containerRef
      }
      className={`relative ${
        open
          ? "z-[40]"
          : "z-0"
      }`}
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
        className={`flex h-12 w-full items-center rounded-xl border bg-[#202235]/90 px-4 text-left transition-all ${
          error
            ? "input-error"
            : open
              ? "border-[rgb(177_138_235_/_0.48)] shadow-[0_0_0_4px_rgba(131,80,196,.08)]"
              : "border-[rgb(96_105_144_/_0.30)] hover:border-[rgb(115_146_181_/_0.44)]"
        }`}
      >
        {icon && (
          <span className="flex shrink-0 items-center justify-center text-[var(--denim-300)]">
            {icon}
          </span>
        )}

        <span
          className={`min-w-0 flex-1 truncate text-xs font-bold text-[var(--text-secondary)] ${
            icon
              ? "ml-2.5"
              : ""
          }`}
        >
          {
            currentOption
              .label
          }
        </span>

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

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+7px)] z-[50] max-h-56 overflow-y-auto rounded-xl border border-[rgb(115_146_181_/_0.28)] bg-[#1b1d2c]/[0.99] p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,.88)] backdrop-blur-xl"
        >
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
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[10px] font-bold transition-colors ${
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
 * FIELD LABEL
 * =========================================================
 */

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {
          label
        }
      </span>

      <div className="mt-2">
        {
          children
        }
      </div>
    </label>
  );
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
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

function getVisualVariant(
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

  return total % 5;
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

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
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

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
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

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="m5 16-.7 3.7L8 19l10-10-3-3L5 16ZM13.8 7.2l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="1.7"
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
        d="m8 12 2.2 2.2L16 8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusIcon() {
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
        r="7"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PriorityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
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

function UserIcon() {
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

export default ProjectDetailsPage;