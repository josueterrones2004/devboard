import {
  useEffect,
  useMemo,
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

import ProjectActions from "../components/ProjectActions";

import {
  getProject,
  type Project,
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

  const activeTask =
    activeTaskId
      ? tasks.find(
          (task) =>
            task._id ===
            activeTaskId,
        ) ?? null
      : null;

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <p className="text-sm font-bold text-white/30">
          Loading project...
        </p>
      </div>
    );
  }

  if (
    error ||
    !project ||
    !projectId
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 p-6 text-sm font-semibold text-[#ff8994]">
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

  const handleSaveTask =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!taskForm) {
        return;
      }

      setSaving(true);
      setError("");

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
                  taskForm.dueDate ||
                  null,

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
                  taskForm.dueDate ||
                  null,

                labels,
              },
            );

          setTasks(
            (current) =>
              normalizePositions([
                ...current,
                response.task,
              ]),
          );
        }

        setModalOpen(false);
        setEditingTask(null);
        setTaskForm(null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to save task",
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDeleteTask =
    async (
      task: Task,
    ) => {
      if (
        !window.confirm(
          `Delete "${task.title}"?`,
        )
      ) {
        return;
      }

      try {
        await deleteTask(
          task._id,
        );

        setTasks(
          (current) =>
            normalizePositions(
              current.filter(
                (item) =>
                  item._id !==
                  task._id,
              ),
            ),
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to delete task",
        );
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
        await Promise.all(
          nextTasks.map(
            (task) =>
              updateTask(
                task._id,
                {
                  status:
                    task.status,

                  position:
                    task.position,
                },
              ),
          ),
        );
      } catch {
        setTasks(
          previousTasks,
        );

        setError(
          "Failed to save task order",
        );
      }
    };

  return (
    <>
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="border-b border-white/[0.07] pb-8">
          <Link
            to="/projects"
            className="text-xs font-black text-white/30 transition-colors hover:text-white"
          >
            ← Back to projects
          </Link>

          <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8f7bff]">
                  {project.status}
                </p>

                <span className="h-1 w-1 rounded-full bg-white/20" />

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
                  MongoDB
                </p>
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
                {project.name}
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
                {project.description ||
                  "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 self-start xl:self-auto">
              <ProjectActions
                project={project}
                onUpdated={
                  setProject
                }
              />

              <button
                type="button"
                onClick={() =>
                  openCreateModal()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7657ff] px-5 py-3 text-xs font-black text-white transition-all hover:-translate-y-0.5 hover:bg-[#846cff]"
              >
                <span className="text-lg">
                  +
                </span>

                New task
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Progress"
              value={`${progress}%`}
            />

            <Metric
              label="Completed"
              value={`${completedTasks}/${tasks.length}`}
            />

            <Metric
              label="Total tasks"
              value={String(
                tasks.length,
              )}
            />

            <div className="rounded-xl border border-white/[0.07] bg-[#111218] px-4 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/20">
                Members
              </p>

              <div className="mt-3 flex">
                {project.members.map(
                  (member) => (
                    <div
                      key={
                        member._id
                      }
                      title={
                        member.name
                      }
                      className="-ml-1.5 flex h-8 w-8 first:ml-0 items-center justify-center rounded-full border-2 border-[#111218] bg-[#1d1e27] text-[8px] font-black text-[#a897ff]"
                    >
                      {getInitials(
                        member.name,
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7657ff] to-[#4c7dff] transition-[width]"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-4 py-3 text-xs font-semibold text-[#ff8994]">
            {error}
          </div>
        )}

        <section className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search tasks..."
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#111218] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/20 focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10 lg:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            {priorityFilters.map(
              (filter) => (
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
                  className={`rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                    priorityFilter ===
                    filter.value
                      ? "border-[#7657ff]/50 bg-[#7657ff]/15 text-[#a897ff]"
                      : "border-white/[0.07] bg-[#111218] text-white/30"
                  }`}
                >
                  {filter.label}
                </button>
              ),
            )}
          </div>
        </section>

        <DndContext
          sensors={sensors}
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
          <section className="mt-6 grid items-start gap-4 xl:grid-cols-3">
            {columns.map(
              (column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
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
                task={activeTask}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {modalOpen &&
        taskForm && (
          <TaskModal
            project={project}
            form={taskForm}
            setForm={
              setTaskForm
            }
            saving={saving}
            editing={
              Boolean(
                editingTask,
              )
            }
            onSubmit={
              handleSaveTask
            }
            onClose={() => {
              setModalOpen(
                false,
              );

              setEditingTask(
                null,
              );

              setTaskForm(
                null,
              );
            }}
          />
        )}
    </>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111218] px-4 py-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/20">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

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
        status: column.id,
      } satisfies DragData,
    });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border transition-colors ${
        highlighted
          ? "border-[#7657ff]/50 bg-[#7657ff]/[0.04]"
          : "border-white/[0.07] bg-[#0e0f14]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <div>
          <div className="flex items-center gap-2">
            <ColumnDot
              status={column.id}
            />

            <h3 className="text-sm font-black text-white">
              {column.title}
            </h3>

            <span className="rounded-md bg-white/[0.045] px-2 py-1 text-[9px] font-black text-white/30">
              {tasks.length}
            </span>
          </div>

          <p className="mt-1 text-[10px] text-white/20">
            {column.description}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-white/25 hover:bg-white/[0.05] hover:text-white"
        >
          +
        </button>
      </div>

      <SortableContext
        items={tasks.map(
          (task) =>
            task._id,
        )}
        strategy={
          verticalListSortingStrategy
        }
      >
        <div className="min-h-40 space-y-3 p-4">
          {tasks.length > 0 ? (
            tasks.map(
              (task) => (
                <SortableTask
                  key={
                    task._id
                  }
                  task={task}
                  onEdit={() =>
                    onEdit(task)
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
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-xs font-semibold text-white/20">
              No tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

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
      taskId: task._id,
      status: task.status,
    } satisfies DragData,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform:
          CSS.Transform.toString(
            transform,
          ),

        transition,
      }}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl border bg-[#14151b] p-4 ${
        isDragging
          ? "opacity-25"
          : "border-white/[0.07]"
      }`}
    >
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
            onClick={onEdit}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-white/25 hover:bg-white/[0.05] hover:text-white"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-[#ff8994]/60 hover:bg-[#ff6b7a]/10 hover:text-[#ff8994]"
          >
            Delete
          </button>
        </div>
      </div>

      <h4 className="mt-4 text-sm font-black text-white">
        {task.title}
      </h4>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/30">
        {task.description ||
          "No description."}
      </p>

      {task.labels.length >
        0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {task.labels.map(
            (label) => (
              <span
                key={label}
                className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[8px] font-black uppercase text-white/30"
              >
                {label}
              </span>
            ),
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7657ff]/15 text-[8px] font-black text-[#a897ff]">
          {task.assignee
            ? getInitials(
                task.assignee
                  .name,
              )
            : "—"}
        </div>

        <span className="text-[9px] font-bold text-white/25">
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

function TaskPreview({
  task,
}: {
  task: Task;
}) {
  return (
    <div className="w-80 rotate-1 rounded-xl border border-[#7657ff]/40 bg-[#181920] p-4 shadow-2xl">
      <PriorityBadge
        priority={
          task.priority
        }
      />

      <h4 className="mt-4 text-sm font-black text-white">
        {task.title}
      </h4>
    </div>
  );
}

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
      "border-[#ff6b7a]/20 bg-[#ff6b7a]/10 text-[#ff8994]",

    medium:
      "border-[#ffbf69]/20 bg-[#ffbf69]/10 text-[#ffc980]",

    low:
      "border-[#49d6b0]/20 bg-[#49d6b0]/10 text-[#67dfbc]",
  };

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function ColumnDot({
  status,
}: {
  status: TaskStatus;
}) {
  const styles: Record<
    TaskStatus,
    string
  > = {
    todo: "bg-white/30",

    "in-progress":
      "bg-[#4c7dff]",

    done:
      "bg-[#49d6b0]",
  };

  return (
    <span
      className={`h-2 w-2 rounded-full ${styles[status]}`}
    />
  );
}

type TaskModalProps = {
  project: Project;

  form: TaskForm;

  setForm: Dispatch<
    SetStateAction<TaskForm | null>
  >;

  saving: boolean;

  editing: boolean;

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#111218] p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8f7bff]">
              {project.name}
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              {editing
                ? "Edit task"
                : "Create task"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <FieldLabel label="Title">
            <input
              required
              value={
                form.title
              }
              onChange={(
                event,
              ) =>
                updateForm({
                  title:
                    event.target
                      .value,
                })
              }
              className="input-style"
            />
          </FieldLabel>

          <FieldLabel label="Description">
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
              className="input-style h-auto resize-none py-3"
            />
          </FieldLabel>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Status">
              <select
                value={
                  form.status
                }
                onChange={(
                  event,
                ) =>
                  updateForm({
                    status:
                      event
                        .target
                        .value as TaskStatus,
                  })
                }
                className="input-style"
              >
                <option value="todo">
                  To do
                </option>

                <option value="in-progress">
                  In progress
                </option>

                <option value="done">
                  Done
                </option>
              </select>
            </FieldLabel>

            <FieldLabel label="Priority">
              <select
                value={
                  form.priority
                }
                onChange={(
                  event,
                ) =>
                  updateForm({
                    priority:
                      event
                        .target
                        .value as TaskPriority,
                  })
                }
                className="input-style"
              >
                <option value="high">
                  High
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="low">
                  Low
                </option>
              </select>
            </FieldLabel>

            <FieldLabel label="Assignee">
              <select
                value={
                  form.assignee
                }
                onChange={(
                  event,
                ) =>
                  updateForm({
                    assignee:
                      event
                        .target
                        .value,
                  })
                }
                className="input-style"
              >
                <option value="">
                  Unassigned
                </option>

                {project.members.map(
                  (member) => (
                    <option
                      key={
                        member._id
                      }
                      value={
                        member._id
                      }
                    >
                      {
                        member.name
                      }
                    </option>
                  ),
                )}
              </select>
            </FieldLabel>

            <FieldLabel label="Due date">
              <input
                type="date"
                value={
                  form.dueDate
                }
                onChange={(
                  event,
                ) =>
                  updateForm({
                    dueDate:
                      event.target
                        .value,
                  })
                }
                className="input-style"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Labels">
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
          </FieldLabel>
        </div>

        <div className="mt-7 flex justify-end gap-3 border-t border-white/[0.07] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] px-5 py-3 text-xs font-black text-white/45"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#7657ff] px-5 py-3 text-xs font-black text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
      {label}

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .toUpperCase();
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

export default ProjectDetailsPage;