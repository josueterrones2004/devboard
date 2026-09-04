import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  deleteProject,
  updateProject,
  type Project,
  type ProjectStatus,
} from "../services/projectService";

type ProjectActionsProps = {
  project: Project;

  onUpdated: (
    project: Project,
  ) => void;
};

function ProjectActions({
  project,
  onUpdated,
}: ProjectActionsProps) {
  const navigate =
    useNavigate();

  const [open, setOpen] =
    useState(false);

  const [name, setName] =
    useState(project.name);

  const [
    description,
    setDescription,
  ] = useState(
    project.description,
  );

  const [status, setStatus] =
    useState<ProjectStatus>(
      project.status,
    );

  const [saving, setSaving] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const openModal = () => {
    setName(project.name);

    setDescription(
      project.description,
    );

    setStatus(
      project.status,
    );

    setError("");
    setOpen(true);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const response =
        await updateProject(
          project._id,
          {
            name,
            description,
            status,
          },
        );

      onUpdated(
        response.project,
      );

      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update project",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete =
    async () => {
      const confirmed =
        window.confirm(
          `Delete "${project.name}" and all its tasks?`,
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setError("");

      try {
        await deleteProject(
          project._id,
        );

        navigate(
          "/projects",
          {
            replace: true,
          },
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to delete project",
        );

        setDeleting(false);
      }
    };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-xl border border-white/[0.08] bg-[#111218] px-5 py-3 text-xs font-black text-white/50 transition-colors hover:border-white/[0.15] hover:text-white"
      >
        Manage project
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#111218]">
            <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8f7bff]">
                  Project settings
                </p>

                <h2 className="mt-2 text-xl font-black text-white">
                  Manage project
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="text-white/30 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >
              {error && (
                <div className="mb-5 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-4 py-3 text-xs font-semibold text-[#ff8994]">
                  {error}
                </div>
              )}

              <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                Project name

                <input
                  required
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target
                        .value,
                    )
                  }
                  className="input-style mt-2"
                />
              </label>

              <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
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
                  className="input-style mt-2 h-auto resize-none py-3"
                />
              </label>

              <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                Status

                <select
                  value={status}
                  onChange={(
                    event,
                  ) =>
                    setStatus(
                      event.target
                        .value as ProjectStatus,
                    )
                  }
                  className="input-style mt-2"
                >
                  <option value="planning">
                    Planning
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </label>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-xl border border-white/[0.08] px-5 py-3 text-xs font-black text-white/40"
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
                    : "Save changes"}
                </button>
              </div>
            </form>

            <div className="border-t border-white/[0.07] p-6">
              <h3 className="text-sm font-black text-[#ff8994]">
                Danger zone
              </h3>

              <p className="mt-2 text-xs leading-5 text-white/30">
                Deleting this project also removes all tasks that belong to it.
              </p>

              <button
                type="button"
                disabled={deleting}
                onClick={
                  handleDelete
                }
                className="mt-4 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-5 py-3 text-xs font-black text-[#ff8994] disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectActions;