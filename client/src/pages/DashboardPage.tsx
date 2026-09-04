import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getProjects,
  type Project,
} from "../services/projectService";

import {
  getMyTasks,
  type MyTask,
} from "../services/taskService";

function DashboardPage() {
  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [tasks, setTasks] =
    useState<MyTask[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    Promise.all([
      getProjects(),
      getMyTasks(),
    ])
      .then(
        ([
          projectResponse,
          taskResponse,
        ]) => {
          setProjects(
            projectResponse.projects,
          );

          setTasks(
            taskResponse.tasks,
          );
        },
      )
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center text-sm font-bold text-white/30">
        Loading dashboard...
      </div>
    );
  }

  const activeProjects =
    projects.filter(
      (project) =>
        project.status ===
        "active",
    ).length;

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

  const upcomingTasks =
    tasks
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
      .slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="border-b border-white/[0.07] pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8f7bff]">
          Overview
        </p>

        <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
          Dashboard
        </h2>

        <p className="mt-3 text-sm text-white/40">
          Your current DevBoard workspace activity.
        </p>
      </section>

      {error && (
        <div className="mt-6 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 p-4 text-xs font-semibold text-[#ff8994]">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Projects"
          value={projects.length}
        />

        <Metric
          label="Active projects"
          value={activeProjects}
        />

        <Metric
          label="Open tasks"
          value={openTasks}
        />

        <Metric
          label="Completed tasks"
          value={completedTasks}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111218]">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
            <h3 className="text-lg font-black text-white">
              Recent projects
            </h3>

            <Link
              to="/projects"
              className="text-xs font-black text-[#a897ff]"
            >
              View all
            </Link>
          </div>

          {projects.length ===
          0 ? (
            <Empty text="No projects yet." />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {projects
                .slice(0, 5)
                .map(
                  (project) => (
                    <Link
                      key={
                        project._id
                      }
                      to={`/projects/${project._id}`}
                      className="block p-5 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-white">
                            {
                              project.name
                            }
                          </p>

                          <p className="mt-1 line-clamp-1 text-xs text-white/30">
                            {project.description ||
                              "No description."}
                          </p>
                        </div>

                        <span className="text-[9px] font-black uppercase text-[#a897ff]">
                          {
                            project.status
                          }
                        </span>
                      </div>
                    </Link>
                  ),
                )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111218]">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
            <h3 className="text-lg font-black text-white">
              Upcoming tasks
            </h3>

            <Link
              to="/my-tasks"
              className="text-xs font-black text-[#a897ff]"
            >
              View all
            </Link>
          </div>

          {upcomingTasks.length ===
          0 ? (
            <Empty text="No upcoming tasks." />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {upcomingTasks.map(
                (task) => (
                  <Link
                    key={task._id}
                    to={`/projects/${task.project._id}`}
                    className="block p-5 transition-colors hover:bg-white/[0.02]"
                  >
                    <p className="text-sm font-black text-white">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      {
                        task.project
                          .name
                      }
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-[#a897ff]">
                        {
                          task.priority
                        }
                      </span>

                      <span className="text-[10px] font-bold text-white/30">
                        {task.dueDate
                          ? formatDate(
                              task.dueDate,
                            )
                          : "—"}
                      </span>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </div>
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

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center p-6 text-xs font-semibold text-white/25">
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
    },
  ).format(
    new Date(value),
  );
}

export default DashboardPage;