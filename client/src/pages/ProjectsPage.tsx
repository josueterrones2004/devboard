import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  createProject,
  getProjects,
  type Project,
  type ProjectStatus,
} from "../services/projectService";

type Filter =
  | "all"
  | ProjectStatus;

const filters: {
  label: string;
  value: Filter;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Planning",
    value: "planning",
  },
  {
    label: "Completed",
    value: "completed",
  },
];

function ProjectsPage() {
  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<Filter>("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  useEffect(() => {
    getProjects()
      .then((response) => {
        setProjects(
          response.projects,
        );
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load projects",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredProjects =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
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
    }, [
      projects,
      search,
      activeFilter,
    ]);

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

  const handleProjectCreated = (
    project: Project,
  ) => {
    setProjects(
      (current) => [
        project,
        ...current,
      ],
    );

    setCreateModalOpen(false);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="flex flex-col gap-6 border-b border-white/[0.07] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8f7bff]">
              Workspace
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
              Projects
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
              Organize your work, monitor progress and keep every project moving forward.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCreateModalOpen(
                true,
              )
            }
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#7657ff] px-5 py-3 text-sm font-black text-white shadow-[0_12px_30px_-12px_rgba(118,87,255,.9)] transition-all hover:-translate-y-0.5 hover:bg-[#846cff] lg:self-auto"
          >
            <span className="text-lg leading-none">
              +
            </span>

            New project
          </button>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProjectMetric
            label="Total projects"
            value={projects.length}
          />

          <ProjectMetric
            label="Active"
            value={activeCount}
          />

          <ProjectMetric
            label="Planning"
            value={planningCount}
          />

          <ProjectMetric
            label="Completed"
            value={completedCount}
          />
        </section>

        <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/25"
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

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search projects..."
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#111218] pl-11 pr-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-white/20 focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map(
              (filter) => {
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
                    className={`rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                      active
                        ? "border-[#7657ff]/50 bg-[#7657ff]/15 text-[#a897ff]"
                        : "border-white/[0.07] bg-[#111218] text-white/30 hover:border-white/[0.12] hover:text-white/70"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              },
            )}
          </div>
        </section>

        <section className="mt-6">
          {loading && (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.07] bg-[#111218]">
              <p className="text-sm font-bold text-white/30">
                Loading projects...
              </p>
            </div>
          )}

          {!loading &&
            error && (
              <div className="rounded-2xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 p-5 text-sm font-semibold text-[#ff8994]">
                {error}
              </div>
            )}

          {!loading &&
            !error &&
            filteredProjects.length >
              0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold text-white/25">
                    {
                      filteredProjects.length
                    }{" "}
                    {filteredProjects.length ===
                    1
                      ? "project"
                      : "projects"}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredProjects.map(
                    (project) => (
                      <ProjectCard
                        key={
                          project._id
                        }
                        project={
                          project
                        }
                      />
                    ),
                  )}
                </div>
              </>
            )}

          {!loading &&
            !error &&
            filteredProjects.length ===
              0 && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#111218]/50 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.035] text-white/20">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 7.5h6l2-2h8v13H4v-11Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h3 className="mt-5 text-lg font-black text-white">
                  No projects found
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-white/30">
                  Create a project or change your current search and filters.
                </p>
              </div>
            )}
        </section>
      </div>

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

type ProjectMetricProps = {
  label: string;
  value: number;
};

function ProjectMetric({
  label,
  value,
}: ProjectMetricProps) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#111218] p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
        {value}
      </p>
    </article>
  );
}

type ProjectCardProps = {
  project: Project;
};

function ProjectCard({
  project,
}: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111218] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.13] hover:bg-[#13141b] sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#7657ff] to-[#4c7dff] opacity-70" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-black tracking-[-0.03em] text-white transition-colors group-hover:text-[#b7aaff]">
              {project.name}
            </h3>

            <ProjectStatusBadge
              status={
                project.status
              }
            />
          </div>

          <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-white/35">
            {project.description ||
              "No description provided."}
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/25 transition-all group-hover:border-[#7657ff]/30 group-hover:bg-[#7657ff]/10 group-hover:text-[#a897ff]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="m9 18 6-6-6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-5 border-t border-white/[0.06] pt-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/20">
            Updated
          </p>

          <p className="mt-1 text-xs font-bold text-white/45">
            {formatDate(
              project.updatedAt,
            )}
          </p>
        </div>

        <div>
          <p className="mb-2 text-right text-[9px] font-black uppercase tracking-[0.12em] text-white/20">
            Members
          </p>

          <MemberStack
            members={
              project.members
            }
          />
        </div>
      </div>
    </Link>
  );
}

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

function ProjectStatusBadge({
  status,
}: ProjectStatusBadgeProps) {
  const labels: Record<
    ProjectStatus,
    string
  > = {
    active: "Active",
    planning: "Planning",
    completed: "Completed",
  };

  const styles: Record<
    ProjectStatus,
    string
  > = {
    active:
      "border-[#49d6b0]/20 bg-[#49d6b0]/10 text-[#67dfbc]",

    planning:
      "border-[#4c7dff]/20 bg-[#4c7dff]/10 text-[#7d9eff]",

    completed:
      "border-[#8f7bff]/20 bg-[#8f7bff]/10 text-[#ad9eff]",
  };

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

type MemberStackProps = {
  members: Project["members"];
};

function MemberStack({
  members,
}: MemberStackProps) {
  const visible =
    members.slice(0, 3);

  const remaining =
    Math.max(
      members.length -
        visible.length,
      0,
    );

  return (
    <div className="flex items-center justify-end">
      {visible.map(
        (member) => (
          <div
            key={member._id}
            title={member.name}
            className="-ml-1.5 flex h-8 w-8 first:ml-0 items-center justify-center rounded-full border-2 border-[#111218] bg-[#1c1d26] text-[8px] font-black text-[#a897ff]"
          >
            {getInitials(
              member.name,
            )}
          </div>
        ),
      )}

      {remaining > 0 && (
        <div className="-ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111218] bg-[#24252f] text-[8px] font-black text-white/40">
          +{remaining}
        </div>
      )}
    </div>
  );
}

type CreateProjectModalProps = {
  onClose: () => void;
  onCreated: (
    project: Project,
  ) => void;
};

function CreateProjectModal({
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [status, setStatus] =
    useState<ProjectStatus>(
      "active",
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const response =
        await createProject({
          name,
          description,
          status,
        });

      onCreated(
        response.project,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-md"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111218]"
      >
        <div className="flex items-start justify-between border-b border-white/[0.07] p-5 sm:p-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8f7bff]">
              Workspace
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              Create project
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 hover:bg-white/[0.05] hover:text-white"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-4 py-3 text-xs font-semibold text-[#ff8994]">
              {error}
            </div>
          )}

          <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
            Project name

            <input
              required
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-sm font-semibold text-white outline-none focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10"
            />
          </label>

          <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
            Description

            <textarea
              rows={4}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10"
            />
          </label>

          <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
            Status

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as ProjectStatus,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-sm font-bold text-white/65 outline-none focus:border-[#7657ff]/60"
            >
              <option value="active">
                Active
              </option>

              <option value="planning">
                Planning
              </option>

              <option value="completed">
                Completed
              </option>
            </select>
          </label>

          <div className="mt-7 flex justify-end gap-3 border-t border-white/[0.07] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-5 py-3 text-xs font-black text-white/45 hover:bg-white/[0.05] hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#7657ff] px-5 py-3 text-xs font-black text-white hover:bg-[#846cff] disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

export default ProjectsPage;