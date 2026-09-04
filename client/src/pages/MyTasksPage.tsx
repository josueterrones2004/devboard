import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getMyTasks,
  type MyTask,
  type TaskPriority,
  type TaskStatus,
} from "../services/taskService";

type StatusFilter =
  | "all"
  | TaskStatus;

type PriorityFilter =
  | "all"
  | TaskPriority;

function MyTasksPage() {
  const [tasks, setTasks] =
    useState<MyTask[]>([]);

  const [search, setSearch] =
    useState("");

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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    getMyTasks()
      .then((response) => {
        setTasks(response.tasks);
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load tasks",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
            task.project.name
              .toLowerCase()
              .includes(query) ||
            task.labels.some(
              (label) =>
                label
                  .toLowerCase()
                  .includes(query),
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            task.status ===
              statusFilter;

          const matchesPriority =
            priorityFilter ===
              "all" ||
            task.priority ===
              priorityFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
          );
        },
      );
    }, [
      tasks,
      search,
      statusFilter,
      priorityFilter,
    ]);

  const openTasks =
    tasks.filter(
      (task) =>
        task.status !== "done",
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "done",
    ).length;

  const highPriority =
    tasks.filter(
      (task) =>
        task.priority ===
          "high" &&
        task.status !== "done",
    ).length;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="border-b border-white/[0.07] pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8f7bff]">
          Workspace
        </p>

        <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
          My Tasks
        </h2>

        <p className="mt-3 text-sm text-white/40">
          Everything currently assigned to you.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Open tasks"
          value={openTasks}
        />

        <Metric
          label="High priority"
          value={highPriority}
        />

        <Metric
          label="Completed"
          value={completedTasks}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#111218]">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 xl:flex-row xl:items-center xl:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search tasks..."
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/20 focus:border-[#7657ff]/60 xl:max-w-md"
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="h-12 rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-xs font-bold text-white/60"
            >
              <option value="all">
                Status: All
              </option>

              <option value="todo">
                Status: To do
              </option>

              <option value="in-progress">
                Status: In progress
              </option>

              <option value="done">
                Status: Done
              </option>
            </select>

            <select
              value={
                priorityFilter
              }
              onChange={(event) =>
                setPriorityFilter(
                  event.target
                    .value as PriorityFilter,
                )
              }
              className="h-12 rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-xs font-bold text-white/60"
            >
              <option value="all">
                Priority: All
              </option>

              <option value="high">
                Priority: High
              </option>

              <option value="medium">
                Priority: Medium
              </option>

              <option value="low">
                Priority: Low
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <EmptyMessage text="Loading tasks..." />
        ) : error ? (
          <EmptyMessage text={error} />
        ) : filteredTasks.length ===
          0 ? (
          <EmptyMessage text="No tasks found." />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredTasks.map(
              (task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskRow({
  task,
}: {
  task: MyTask;
}) {
  return (
    <article className="p-5 transition-colors hover:bg-white/[0.02]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">
              {task.title}
            </h3>

            <StatusBadge
              status={task.status}
            />

            <PriorityBadge
              priority={
                task.priority
              }
            />
          </div>

          <p className="mt-2 text-xs leading-5 text-white/30">
            {task.description ||
              "No description."}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
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
        </div>

        <div className="flex shrink-0 items-center gap-6 border-t border-white/[0.06] pt-4 xl:border-0 xl:pt-0">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/20">
              Project
            </p>

            <Link
              to={`/projects/${task.project._id}`}
              className="mt-1 block text-xs font-bold text-white/45 hover:text-[#a897ff]"
            >
              {task.project.name}
            </Link>
          </div>

          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/20">
              Due
            </p>

            <p className="mt-1 text-xs font-bold text-white/40">
              {task.dueDate
                ? formatDate(
                    task.dueDate,
                  )
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111218] p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  const label = {
    todo: "To do",
    "in-progress":
      "In progress",
    done: "Done",
  }[status];

  return (
    <span className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[8px] font-black uppercase text-white/40">
      {label}
    </span>
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
      "text-[#ff8994]",
    medium:
      "text-[#ffc980]",
    low:
      "text-[#67dfbc]",
  };

  return (
    <span
      className={`text-[8px] font-black uppercase ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function EmptyMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center p-6 text-sm font-semibold text-white/25">
      {text}
    </div>
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
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

export default MyTasksPage;