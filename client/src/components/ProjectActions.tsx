import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  useNavigate,
} from "react-router-dom";

import ConfirmModal from "./ConfirmModal";
import ErrorToast from "./ErrorToast";

import {
  ApiError,
} from "../services/api";

import {
  deleteProject,
  updateProject,
  type Project,
  type ProjectIcon,
  type ProjectStatus,
} from "../services/projectService";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ProjectActionsProps = {
  project: Project;

  onUpdated: (
    project: Project,
  ) => void;
};

type ProjectIconOption = {
  label: string;
  value: ProjectIcon;
};

/*
 * =========================================================
 * PROJECT ICON OPTIONS
 * =========================================================
 */

const projectIconOptions: ProjectIconOption[] = [
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
 * PROJECT ACTIONS
 * =========================================================
 */

function ProjectActions({
  project,
  onUpdated,
}: ProjectActionsProps) {
  const navigate =
    useNavigate();

  /*
   * =========================================================
   * MODAL STATE
   * =========================================================
   */

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  /*
   * =========================================================
   * FORM STATE
   * =========================================================
   */

  const [
    name,
    setName,
  ] = useState(
    project.name,
  );

  const [
    description,
    setDescription,
  ] = useState(
    project.description,
  );

  const [
    icon,
    setIcon,
  ] = useState<ProjectIcon>(
    project.icon ??
      "folder",
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /*
   * =========================================================
   * ERROR STATE
   * =========================================================
   */

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

  const [
    shaking,
    setShaking,
  ] = useState(false);

  /*
   * =========================================================
   * FORM STATUS
   * =========================================================
   */

  const hasChanges =
    name.trim() !==
      project.name.trim() ||
    description.trim() !==
      project.description.trim() ||
    icon !==
      (
        project.icon ??
        "folder"
      );

  /*
   * =========================================================
   * BODY SCROLL
   * =========================================================
   */

  useEffect(() => {
    if (
      !open &&
      !deleteModalOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
    deleteModalOpen,
  ]);

  /*
   * =========================================================
   * MODAL KEYBOARD
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !saving
      ) {
        setOpen(false);

        setErrorField(
          null,
        );

        setToastMessage("");

        setShaking(
          false,
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    saving,
  ]);

  /*
   * =========================================================
   * ERROR FEEDBACK
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
      field ??
        null,
    );

    setShaking(
      false,
    );

    window.requestAnimationFrame(
      () => {
        setShaking(
          true,
        );
      },
    );

    window.setTimeout(
      () => {
        setShaking(
          false,
        );
      },
      380,
    );
  };

  /*
   * =========================================================
   * OPEN MANAGE PROJECT
   * =========================================================
   */

  const openModal = () => {
    setName(
      project.name,
    );

    setDescription(
      project.description,
    );

    setIcon(
      project.icon ??
        "folder",
    );

    setErrorField(
      null,
    );

    setToastMessage("");

    setShaking(
      false,
    );

    setOpen(
      true,
    );
  };

  /*
   * =========================================================
   * CLOSE MANAGE PROJECT
   * =========================================================
   */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setOpen(
      false,
    );

    setErrorField(
      null,
    );

    setToastMessage("");

    setShaking(
      false,
    );
  };

  /*
   * =========================================================
   * UPDATE PROJECT
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

    if (!hasChanges) {
      return;
    }

    setSaving(
      true,
    );

    setErrorField(
      null,
    );

    setToastMessage("");

    try {
      const response =
        await updateProject(
          project._id,
          {
            name:
              name.trim(),

            description:
              description.trim(),

            icon,
          },
        );

      onUpdated(
        response.project,
      );

      setOpen(
        false,
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
            : "Failed to update project",
        );
      }
    } finally {
      setSaving(
        false,
      );
    }
  };

  /*
   * =========================================================
   * OPEN DELETE CONFIRMATION
   * =========================================================
   */

  const openDeleteConfirmation =
    () => {
      setOpen(
        false,
      );

      setDeleteModalOpen(
        true,
      );
    };

  /*
   * =========================================================
   * DELETE PROJECT
   * =========================================================
   */

  const handleDelete =
    async () => {
      setDeleting(
        true,
      );

      setToastMessage("");

      try {
        await deleteProject(
          project._id,
        );

        navigate(
          "/projects",
          {
            replace:
              true,
          },
        );
      } catch (error) {
        setToastMessage(
          error instanceof Error
            ? error.message
            : "Failed to delete project",
        );

        setDeleting(
          false,
        );
      }
    };

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

      {/*
       * =========================================================
       * MANAGE PROJECT BUTTON
       * =========================================================
       */}

      <button
        type="button"
        onClick={
          openModal
        }
        className="group inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-[rgb(115_146_181_/_0.26)] bg-[#202235]/85 px-4 text-[10px] font-black text-[var(--text-secondary)] shadow-[0_14px_30px_-24px_rgba(0,0,0,.75)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[rgb(177_138_235_/_0.40)] hover:bg-[#292b40] hover:text-[var(--pale-sky)]"
      >
        <SettingsSlidersIcon />

        Manage project
      </button>

      {/*
       * =========================================================
       * MANAGE PROJECT MODAL
       * =========================================================
       */}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[700] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6 md:items-center"
            onMouseDown={(
              event,
            ) => {
              if (
                event.target ===
                  event.currentTarget &&
                !saving
              ) {
                closeModal();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="manage-project-title"
              className={`my-auto w-full max-w-xl overflow-hidden rounded-[22px] border border-[rgb(115_146_181_/_0.24)] bg-[#1b1d2c] shadow-[0_28px_90px_-30px_rgba(0,0,0,.92)] ${
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

              <div className="relative overflow-hidden border-b border-[rgb(96_105_144_/_0.18)] px-5 py-5 sm:px-6">
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--deep-lilac)]/20 blur-3xl" />

                <div className="relative flex items-start justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <ProjectIconPreview
                      icon={
                        icon
                      }
                    />

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)]">
                        Project settings
                      </p>

                      <h2
                        id="manage-project-title"
                        className="db-display-title mt-1.5 text-[1.45rem]"
                      >
                        Manage project
                      </h2>

                      <p className="mt-1 text-[9px] font-medium text-[var(--text-faint)]">
                        Update the project details, icon or remove it from your workspace.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      closeModal
                    }
                    aria-label="Close project settings"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-[var(--text-faint)] transition-all hover:border-[rgb(115_146_181_/_0.20)] hover:bg-[var(--surface-blue-soft)] hover:text-[var(--pale-sky)] disabled:opacity-40"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/*
               * =========================================================
               * PROJECT FORM
               * =========================================================
               */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="p-5 sm:p-6"
              >
                {/*
                 * =========================================================
                 * PROJECT NAME
                 * =========================================================
                 */}

                <FieldLabel
                  label="Project name"
                  hint="Workspace identity"
                >
                  <div>
                    <input
                      required
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
                      className={`input-style ${
                        errorField ===
                        "name"
                          ? "input-error"
                          : ""
                      }`}
                    />
                  </div>

                  {errorField ===
                    "name" && (
                    <span className="mt-2 block text-[9px] font-bold normal-case tracking-normal text-[var(--lilac-200)]">
                      This project name is already in use.
                    </span>
                  )}
                </FieldLabel>

                {/*
                 * =========================================================
                 * DESCRIPTION
                 * =========================================================
                 */}

                <div className="mt-5">
                  <FieldLabel
                    label="Description"
                    hint="Optional"
                  >
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
                      placeholder="Describe what this project is for..."
                      className="input-style h-auto resize-none py-3"
                    />
                  </FieldLabel>
                </div>

                {/*
                 * =========================================================
                 * PROJECT ICON
                 * =========================================================
                 */}

                <div className="mt-5">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Project icon
                    </p>

                    <p className="mt-1 text-[8px] font-semibold text-[var(--text-faint)]">
                      Choose the icon used for this project across DevBoard.
                    </p>
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

                <div className="mt-5 rounded-2xl border border-[rgb(115_146_181_/_0.20)] bg-[#202235]/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(115_146_181_/_0.20)] bg-[rgb(115_146_181_/_0.10)] text-[var(--denim-300)]">
                      <StatusIcon />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[7px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)]">
                        Project status
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <ProjectStatusBadge
                          status={
                            project.status
                          }
                        />

                        <span className="text-[9px] font-medium text-[var(--text-muted)]">
                          Updated automatically from the project&apos;s tasks.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/*
                 * =========================================================
                 * FORM ACTIONS
                 * =========================================================
                 */}

                <div className="mt-7 flex flex-col gap-3 border-t border-[rgb(96_105_144_/_0.16)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[var(--text-faint)]">
                      Changes
                    </p>

                    <p
                      className={`mt-1 text-[9px] font-semibold ${
                        hasChanges
                          ? "text-[var(--lilac-200)]"
                          : "text-[var(--text-faint)]"
                      }`}
                    >
                      {hasChanges
                        ? "You have unsaved changes."
                        : "Project details are up to date."}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={
                        closeModal
                      }
                      className="rounded-xl border border-[rgb(96_105_144_/_0.28)] bg-[#232536] px-4 py-3 text-[10px] font-black text-[var(--text-secondary)] transition-all hover:border-[rgb(115_146_181_/_0.40)] hover:bg-[#292c41] hover:text-[var(--pale-sky)] disabled:opacity-40"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !hasChanges
                      }
                      className="inline-flex min-w-[126px] items-center justify-center gap-2 rounded-xl border border-[rgb(177_138_235_/_0.50)] bg-[linear-gradient(135deg,#8350c4,#6d36de)] px-5 py-3 text-[10px] font-black text-[var(--sky-50)] shadow-[0_14px_30px_-18px_rgba(109,54,222,.72)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-35"
                    >
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon />

                          Save changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/*
               * =========================================================
               * DANGER ZONE
               * =========================================================
               */}

              <div className="border-t border-[rgb(212_77_92_/_0.14)] bg-[rgb(212_77_92_/_0.025)] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(212_77_92_/_0.20)] bg-[rgb(212_77_92_/_0.08)] text-[var(--lilac-200)]">
                      <TrashIcon />
                    </span>

                    <div>
                      <h3 className="text-[11px] font-black text-[var(--lilac-200)]">
                        Delete project
                      </h3>

                      <p className="mt-1 max-w-sm text-[9px] leading-5 text-[var(--text-muted)]">
                        This permanently removes the project and every task that belongs to it.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      openDeleteConfirmation
                    }
                    className="shrink-0 rounded-xl border border-[rgb(212_77_92_/_0.25)] bg-[rgb(212_77_92_/_0.08)] px-4 py-3 text-[10px] font-black text-[var(--lilac-200)] transition-all hover:border-[rgb(212_77_92_/_0.38)] hover:bg-[rgb(212_77_92_/_0.14)] disabled:opacity-40"
                  >
                    Delete project
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/*
       * =========================================================
       * DELETE CONFIRMATION
       * =========================================================
       */}

      <ConfirmModal
        open={
          deleteModalOpen
        }
        title="Delete project?"
        description={`You are about to permanently delete "${project.name}" and all tasks that belong to it. This action cannot be undone.`}
        confirmText="Delete project"
        danger
        loading={
          deleting
        }
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(
              false,
            );
          }
        }}
        onConfirm={
          handleDelete
        }
      />
    </>
  );
}

/*
 * =========================================================
 * FIELD LABEL
 * =========================================================
 */

function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </span>

        {hint && (
          <span className="text-[7px] font-semibold text-[var(--text-faint)]">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

/*
 * =========================================================
 * PROJECT ICON PREVIEW
 * =========================================================
 */

function ProjectIconPreview({
  icon,
}: {
  icon: ProjectIcon;
}) {
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[var(--sky-50)]"
      style={{
        background:
          "linear-gradient(135deg,#8350c4,#6d36de,#402b47)",

        boxShadow: `
          inset 0 0 0 1px rgba(201,224,235,.12),
          0 16px 34px -24px rgba(109,54,222,.70)
        `,
      }}
    >
      <span className="relative h-5 w-5">
        <ProjectGlyphIcon
          icon={
            icon
          }
        />
      </span>
    </span>
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
 * PROJECT STATUS BADGE
 * =========================================================
 */

function ProjectStatusBadge({
  status,
}: {
  status: ProjectStatus;
}) {
  const labels: Record<
    ProjectStatus,
    string
  > = {
    planning:
      "Planning",

    active:
      "Active",

    completed:
      "Completed",
  };

  const styles: Record<
    ProjectStatus,
    string
  > = {
    planning:
      "border-[rgb(115_146_181_/_0.28)] bg-[rgb(115_146_181_/_0.12)] text-[var(--denim-300)]",

    active:
      "border-[rgb(131_80_196_/_0.32)] bg-[rgb(131_80_196_/_0.15)] text-[var(--lilac-200)]",

    completed:
      "border-[rgb(185_228_248_/_0.24)] bg-[rgb(185_228_248_/_0.09)] text-[#b9e4f8]",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.11em] ${styles[status]}`}
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
 * ICONS
 * =========================================================
 */

function SettingsSlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 7h8M16 7h4M4 17h4M12 17h8M12 4v6M8 14v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="14"
        cy="7"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="10"
        cy="17"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
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
        r="8"
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

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 11v5M14 11v5"
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

export default ProjectActions;