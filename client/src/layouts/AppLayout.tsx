import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getMe,
  getStoredUser,
  logout,
  type User,
} from "../services/authService";

import {
  getProjects,
  type Project,
} from "../services/projectService";

import {
  getMyTasks,
  type MyTask,
} from "../services/taskService";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

/*
 * =========================================================
 * NAVIGATION
 * =========================================================
 */

const navigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect
          x="3.5"
          y="3.5"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="13.5"
          y="3.5"
          width="7"
          height="11"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="3.5"
          y="13.5"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="13.5"
          y="17.5"
          width="7"
          height="3"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/projects",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
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
    ),
  },
  {
    label: "My Tasks",
    href: "/my-tasks",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect
          x="3.5"
          y="3.5"
          width="17"
          height="17"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="m7.5 12 3 3 6-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="3.2"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.07A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.53-1.03H3v-4h.07A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.07V3h4v.07a1.7 1.7 0 0 0 1.03 1.53 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.93 10H21v4h-.07A1.7 1.7 0 0 0 19.4 15Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/*
 * =========================================================
 * USER HELPERS
 * =========================================================
 */

function getInitials(
  name: string,
) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .toUpperCase();

  return initials || "U";
}

function getFirstName(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    "User"
  );
}

function getGreeting() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

function formatDueDate(
  value: string | null,
) {
  if (!value) {
    return "No due date";
  }

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

/*
 * =========================================================
 * NOTIFICATION STORAGE
 * =========================================================
 */

function readStoredIds(
  key: string,
) {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string",
    );
  } catch {
    return [];
  }
}

function getReadKey(
  userId: string,
) {
  return `devboard_read_notifications_${userId}`;
}

function getDismissedKey(
  userId: string,
) {
  return `devboard_dismissed_notifications_${userId}`;
}

/*
 * =========================================================
 * APP LAYOUT
 * =========================================================
 */

function AppLayout() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const searchInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const storedUser =
    getStoredUser();

  /*
   * =========================================================
   * LAYOUT STATE
   * =========================================================
   */

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    sidebarAccountOpen,
    setSidebarAccountOpen,
  ] = useState(false);

  const [
    user,
    setUser,
  ] = useState<User | null>(
    storedUser,
  );

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    userMenuOpen,
    setUserMenuOpen,
  ] = useState(false);

  /*
   * =========================================================
   * SEARCH STATE
   * =========================================================
   */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(true);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  /*
   * =========================================================
   * NOTIFICATION STATE
   * =========================================================
   */

  const [
    notificationTasks,
    setNotificationTasks,
  ] = useState<MyTask[]>([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const [
    notificationError,
    setNotificationError,
  ] = useState("");

  const [
    readNotificationIds,
    setReadNotificationIds,
  ] = useState<string[]>(
    () =>
      storedUser
        ? readStoredIds(
            getReadKey(
              storedUser.id,
            ),
          )
        : [],
  );

  const [
    dismissedNotificationIds,
    setDismissedNotificationIds,
  ] = useState<string[]>(
    () =>
      storedUser
        ? readStoredIds(
            getDismissedKey(
              storedUser.id,
            ),
          )
        : [],
  );

  /*
   * =========================================================
   * MOBILE SIDEBAR
   * =========================================================
   */

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [sidebarOpen]);

  /*
   * =========================================================
   * INITIAL DATA
   * =========================================================
   */

  useEffect(() => {
    let active = true;

    const loadWorkspaceData =
      async () => {
        setSearchLoading(true);

        try {
          const [
            userResponse,
            projectResponse,
            taskResponse,
          ] =
            await Promise.all([
              getMe(),
              getProjects(),
              getMyTasks(),
            ]);

          if (!active) {
            return;
          }

          setUser(
            userResponse.user,
          );

          setProjects(
            projectResponse.projects,
          );

          setNotificationTasks(
            taskResponse.tasks,
          );

          localStorage.setItem(
            "devboard_user",
            JSON.stringify(
              userResponse.user,
            ),
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setSearchError(
            error instanceof Error
              ? error.message
              : "Failed to load workspace",
          );
        } finally {
          if (active) {
            setSearchLoading(
              false,
            );
          }
        }
      };

    void loadWorkspaceData();

    const intervalId =
      window.setInterval(
        () => {
          getMyTasks()
            .then(
              (
                response,
              ) => {
                if (!active) {
                  return;
                }

                setNotificationTasks(
                  response.tasks,
                );
              },
            )
            .catch(() => {
              /*
               * Notification refresh
               * must never interrupt
               * the main application.
               */
            });
        },
        30000,
      );

    return () => {
      active = false;

      window.clearInterval(
        intervalId,
      );
    };
  }, []);

  /*
   * =========================================================
   * KEYBOARD SHORTCUTS
   * =========================================================
   */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setSearchOpen(false);

        setNotificationsOpen(
          false,
        );

        setUserMenuOpen(false);

        setSidebarAccountOpen(
          false,
        );

        return;
      }

      const searchShortcut =
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k";

      if (!searchShortcut) {
        return;
      }

      event.preventDefault();

      setSearchOpen(true);

      setNotificationsOpen(false);

      setUserMenuOpen(false);

      window.setTimeout(
        () => {
          searchInputRef.current?.focus();
        },
        0,
      );
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
  }, []);

  /*
   * =========================================================
   * OUTSIDE CLICK
   * =========================================================
   */

  useEffect(() => {
    const handleOutsideClick = (
      event: PointerEvent,
    ) => {
      if (
        !(
          event.target instanceof
          Element
        )
      ) {
        return;
      }

      if (
        !event.target.closest(
          "[data-top-menu]",
        )
      ) {
        setSearchOpen(false);

        setNotificationsOpen(
          false,
        );

        setUserMenuOpen(false);
      }

      if (
        !event.target.closest(
          "[data-sidebar-account]",
        )
      ) {
        setSidebarAccountOpen(
          false,
        );
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick,
      );
    };
  }, []);

  /*
 * =========================================================
 * ROUTE CHANGES
 * =========================================================
 */

useEffect(() => {
  const frameId =
    window.requestAnimationFrame(
      () => {
        setSearchOpen(
          false,
        );

        setNotificationsOpen(
          false,
        );

        setUserMenuOpen(
          false,
        );

        setSidebarAccountOpen(
          false,
        );

        setSidebarOpen(
          false,
        );
      },
    );

  return () => {
    window.cancelAnimationFrame(
      frameId,
    );
  };
}, [location.pathname]);

  /*
   * =========================================================
   * CURRENT USER
   * =========================================================
   */

  const displayName =
    user?.name ?? "User";

  const displayEmail =
    user?.email ?? "";

  const initials =
    getInitials(
      displayName,
    );

  const firstName =
    getFirstName(
      displayName,
    );

  const greeting =
    getGreeting();

  /*
   * =========================================================
   * CURRENT PAGE
   * =========================================================
   */

  const pageTitle =
    navigation.find(
      (item) =>
        location.pathname.startsWith(
          item.href,
        ),
    )?.label ?? "DevBoard";

  /*
   * =========================================================
   * NOTIFICATION DATA
   * =========================================================
   */

  const openTasks =
    useMemo(
      () =>
        notificationTasks
          .filter(
            (task) =>
              task.status !==
              "done",
          )
          .sort((a, b) => {
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
          }),
      [notificationTasks],
    );

  const visibleNotifications =
    useMemo(
      () =>
        openTasks.filter(
          (task) =>
            !dismissedNotificationIds.includes(
              task._id,
            ),
        ),
      [
        openTasks,
        dismissedNotificationIds,
      ],
    );

  const unreadNotifications =
    useMemo(
      () =>
        visibleNotifications.filter(
          (task) =>
            !readNotificationIds.includes(
              task._id,
            ),
        ),
      [
        visibleNotifications,
        readNotificationIds,
      ],
    );

  /*
   * =========================================================
   * SEARCH RESULTS
   * =========================================================
   */

  const searchResults =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const pages =
        navigation.filter(
          (item) =>
            !query ||
            item.label
              .toLowerCase()
              .includes(query),
        );

      const matchingProjects =
        projects
          .filter(
            (project) =>
              !query ||
              project.name
                .toLowerCase()
                .includes(query) ||
              project.description
                .toLowerCase()
                .includes(query),
          )
          .slice(0, 5);

      const matchingTasks =
        notificationTasks
          .filter((task) => {
            if (!query) {
              return false;
            }

            const titleMatch =
              task.title
                .toLowerCase()
                .includes(query);

            const projectMatch =
              task.project.name
                .toLowerCase()
                .includes(query);

            const labelMatch =
              task.labels.some(
                (label) =>
                  label
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              );

            return (
              titleMatch ||
              projectMatch ||
              labelMatch
            );
          })
          .slice(0, 5);

      return {
        pages,
        projects:
          matchingProjects,
        tasks:
          matchingTasks,
      };
    }, [
      searchQuery,
      projects,
      notificationTasks,
    ]);

  /*
   * =========================================================
   * NOTIFICATION PERSISTENCE
   * =========================================================
   */

  const saveReadIds = (
    ids: string[],
  ) => {
    setReadNotificationIds(
      ids,
    );

    if (!user) {
      return;
    }

    localStorage.setItem(
      getReadKey(user.id),
      JSON.stringify(ids),
    );
  };

  const saveDismissedIds = (
    ids: string[],
  ) => {
    setDismissedNotificationIds(
      ids,
    );

    if (!user) {
      return;
    }

    localStorage.setItem(
      getDismissedKey(
        user.id,
      ),
      JSON.stringify(ids),
    );
  };

  const markAllAsRead = () => {
    const ids =
      Array.from(
        new Set([
          ...readNotificationIds,
          ...visibleNotifications.map(
            (task) =>
              task._id,
          ),
        ]),
      );

    saveReadIds(ids);
  };

  const dismissNotification = (
    taskId: string,
  ) => {
    saveDismissedIds(
      Array.from(
        new Set([
          ...dismissedNotificationIds,
          taskId,
        ]),
      ),
    );

    saveReadIds(
      Array.from(
        new Set([
          ...readNotificationIds,
          taskId,
        ]),
      ),
    );
  };

  /*
   * =========================================================
   * MENU ACTIONS
   * =========================================================
   */

  const closeTopMenus = () => {
    setSearchOpen(false);

    setNotificationsOpen(
      false,
    );

    setUserMenuOpen(false);
  };

  const goTo = (
    path: string,
  ) => {
    closeTopMenus();

    setSidebarAccountOpen(
      false,
    );

    navigate(path);
  };

  const handleSearchFocus = () => {
    setSearchOpen(true);

    setNotificationsOpen(false);

    setUserMenuOpen(false);
  };

  const handleNotificationsToggle =
    async () => {
      const nextOpen =
        !notificationsOpen;

      setNotificationsOpen(
        nextOpen,
      );

      setSearchOpen(false);

      setUserMenuOpen(false);

      if (!nextOpen) {
        return;
      }

      setNotificationError("");

      setNotificationsLoading(
        true,
      );

      try {
        const response =
          await getMyTasks();

        setNotificationTasks(
          response.tasks,
        );
      } catch (error) {
        setNotificationError(
          error instanceof Error
            ? error.message
            : "Failed to load notifications",
        );
      } finally {
        setNotificationsLoading(
          false,
        );
      }
    };

  const handleUserMenuToggle =
    () => {
      setUserMenuOpen(
        (current) =>
          !current,
      );

      setSearchOpen(false);

      setNotificationsOpen(
        false,
      );
    };

  /*
   * =========================================================
   * ACCOUNT ACTIONS
   * =========================================================
   */

  const handleSwitchAccount =
    () => {
      logout();

      closeTopMenus();

      setSidebarAccountOpen(
        false,
      );

      navigate(
        "/login",
        {
          replace: true,
        },
      );
    };

  const handleLogout = () => {
    logout();

    closeTopMenus();

    setSidebarAccountOpen(
      false,
    );

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      {/*
       * =========================================================
       * MOBILE OVERLAY
       * =========================================================
       */}

      <div
        className={`fixed inset-0 z-40 bg-[var(--neutral-1000)]/75 backdrop-blur-md transition-opacity duration-300 xl:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() =>
          setSidebarOpen(false)
        }
        aria-hidden="true"
      />

      {/*
       * =========================================================
       * SIDEBAR
       * =========================================================
       */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[var(--border-blue)]/30 shadow-[18px_0_55px_-45px_var(--shadow-blue)] transition-transform duration-300 xl:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
        style={{
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(28, 30, 44, 0.98) 0%,
              rgba(31, 34, 51, 0.98) 48%,
              rgba(39, 31, 54, 0.98) 100%
            )
          `,
        }}
      >
        {/*
         * =========================================================
         * SIDEBAR BRAND
         * =========================================================
         */}

        <div className="flex min-h-[96px] items-center border-b border-[var(--border-subtle)] px-5">
          <NavLink
            to="/dashboard"
            className="group flex min-w-0 items-center gap-3.5"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
              <div className="absolute inset-1 rounded-full bg-[var(--deep-lilac)]/25 blur-lg transition-colors group-hover:bg-[var(--lilac-400)]/35" />

              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="relative z-[1] h-10 w-10 text-[var(--lilac-300)]"
                aria-hidden="true"
              >
                <path
                  d="M24 3c1.8 12.7 7.3 18.2 20 20-12.7 1.8-18.2 7.3-20 20-1.8-12.7-7.3-18.2-20-20C16.7 21.2 22.2 15.7 24 3Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="db-display-title truncate text-[1.55rem] leading-none">
                DevBoard
              </p>

              <p className="mt-1.5 truncate text-[10px] font-semibold tracking-[0.03em] text-[var(--denim-300)]">
                Project workspace
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(
                false,
              )
            }
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] xl:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/*
         * =========================================================
         * SIDEBAR NAVIGATION
         * =========================================================
         */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <nav className="space-y-2">
            {navigation.map(
              (item) => (
                <NavLink
                  key={
                    item.href
                  }
                  to={item.href}
                  className={({
                    isActive,
                  }) =>
                    `group relative flex items-center gap-3.5 overflow-hidden rounded-[14px] border px-4 py-3.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "border-[var(--lilac-400)]/55 bg-[linear-gradient(135deg,var(--lilac-500),var(--lilac-600),var(--violet-600))] text-[var(--sky-50)] shadow-[0_18px_38px_-24px_var(--shadow-purple)]"
                        : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-blue)]/30 hover:bg-[var(--surface-blue-soft)] hover:text-[var(--pale-sky)]"
                    }`
                  }
                >
                  {({
                    isActive,
                  }) => (
                    <>
                      {isActive && (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[var(--pale-sky)]/80" />
                      )}

                      <span
                        className={`transition-colors ${
                          isActive
                            ? "text-[var(--sky-100)]"
                            : "text-[var(--denim-300)] group-hover:text-[var(--sky-200)]"
                        }`}
                      >
                        {
                          item.icon
                        }
                      </span>

                      <span>
                        {
                          item.label
                        }
                      </span>
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>
        </div>

        {/*
         * =========================================================
         * SIDEBAR ACCOUNT
         * =========================================================
         */}

        <div
          className="relative border-t border-[var(--border-subtle)] p-3"
          data-sidebar-account
        >
          {sidebarAccountOpen && (
            <div className="db-modal absolute bottom-[calc(100%+0.65rem)] left-3 right-3 overflow-hidden rounded-2xl">
              <div className="relative overflow-hidden border-b border-[var(--border-subtle)] px-4 py-4">
                <div className="pointer-events-none absolute -right-7 -top-9 h-20 w-20 rounded-full bg-[var(--deep-lilac)]/22 blur-2xl" />

                <p className="relative text-[9px] font-black uppercase tracking-[0.17em] text-[var(--lilac-300)]">
                  Account
                </p>

                <p className="relative mt-1 truncate text-sm font-bold text-[var(--pale-sky)]">
                  {displayName}
                </p>

                <p className="relative mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                  {displayEmail}
                </p>
              </div>

              <div className="p-2">
                <SidebarMenuButton
                  icon={
                    <SettingsIcon />
                  }
                  title="Settings"
                  subtitle="Account and preferences"
                  tone="blue"
                  onClick={() =>
                    goTo(
                      "/settings",
                    )
                  }
                />

                <SidebarMenuButton
                  icon={
                    <SwitchIcon />
                  }
                  title="Switch account"
                  subtitle="Use another account"
                  tone="purple"
                  onClick={
                    handleSwitchAccount
                  }
                />

                <div className="my-1 h-px bg-[var(--border-subtle)]" />

                <SidebarMenuButton
                  icon={
                    <SignOutIcon />
                  }
                  title="Sign out"
                  subtitle="End this session"
                  tone="danger"
                  onClick={
                    handleLogout
                  }
                />
              </div>
            </div>
          )}

          <button
            type="button"
            aria-expanded={
              sidebarAccountOpen
            }
            onClick={() =>
              setSidebarAccountOpen(
                (current) =>
                  !current,
              )
            }
            className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all ${
              sidebarAccountOpen
                ? "border-[var(--border-blue)] bg-[var(--surface-blue)]"
                : "border-transparent hover:border-[var(--border-blue)]/30 hover:bg-[var(--surface-blue-soft)]"
            }`}
          >
            <UserAvatar
              initials={
                initials
              }
              size="large"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--pale-sky)]">
                {displayName}
              </p>

              <p className="mt-0.5 truncate text-[9px] text-[var(--text-muted)]">
                {displayEmail}
              </p>
            </div>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`h-4 w-4 shrink-0 text-[var(--denim-300)] transition-transform ${
                sidebarAccountOpen
                  ? "rotate-180"
                  : ""
              }`}
              aria-hidden="true"
            >
              <path
                d="m7 14 5-5 5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>

      {/*
       * =========================================================
       * MAIN SHELL
       * =========================================================
       */}

      <div className="min-h-screen xl:pl-[270px]">
        {/*
         * =========================================================
         * NAVBAR
         * =========================================================
         */}

        <header
          className="sticky top-0 z-[500] border-b border-[var(--border-blue)]/20 backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(90deg, rgba(21,22,32,.72), rgba(30,31,48,.62), rgba(32,26,45,.68))",
          }}
        >
          <div className="mx-auto flex h-[86px] w-full max-w-[1800px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(
                  true,
                )
              }
              aria-label="Open sidebar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-blue)]/35 bg-[var(--surface-blue-soft)] text-[var(--denim-300)] xl:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M5 7h14M5 12h14M5 17h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/*
             * =========================================================
             * PAGE TITLE
             * =========================================================
             */}

            <div className="min-w-[210px] shrink-0">
              <h1 className="db-display-title text-[1.82rem] leading-none">
                {pageTitle}
              </h1>

              <p className="mt-1.5 text-[11px] font-medium text-[var(--denim-300)]">
                {greeting},{" "}
                {firstName}
              </p>
            </div>

            {/*
             * =========================================================
             * GLOBAL SEARCH
             * =========================================================
             */}

            <div
              className="relative ml-auto hidden w-full max-w-[430px] md:block"
              data-top-menu="search"
            >
              <div
                className={`flex h-11 items-center rounded-xl border backdrop-blur-md transition-all ${
                  searchOpen
                    ? "border-[var(--lilac-400)]/60 bg-[var(--surface-blue)] shadow-[0_0_0_4px_var(--accent-soft)]"
                    : "border-[var(--border-blue)]/30 bg-[rgb(38_41_56_/_0.78)] hover:border-[var(--border-blue)] hover:bg-[var(--surface-blue-soft)]"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="ml-4 h-[18px] w-[18px] shrink-0 text-[var(--denim-300)]"
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

                <input
                  ref={
                    searchInputRef
                  }
                  type="search"
                  value={
                    searchQuery
                  }
                  onFocus={
                    handleSearchFocus
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchQuery(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search projects, tasks or pages..."
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]"
                />

                <span className="mr-2.5 shrink-0 rounded-lg border border-[var(--border-blue)]/35 bg-[var(--surface-raised)] px-2 py-1 text-[9px] font-black text-[var(--denim-300)] shadow-[inset_0_1px_0_rgb(201_224_235_/_0.04)]">
                  Ctrl + K
                </span>
              </div>

              {searchOpen && (
                <div className="db-modal absolute left-0 right-0 top-[52px] z-[600] overflow-hidden rounded-2xl">
                  <div className="max-h-[440px] overflow-y-auto p-3">
                    {searchLoading ? (
                      <p className="py-10 text-center text-xs text-[var(--text-muted)]">
                        Loading workspace...
                      </p>
                    ) : searchError ? (
                      <p className="py-10 text-center text-xs font-bold text-[var(--lilac-300)]">
                        {
                          searchError
                        }
                      </p>
                    ) : (
                      <>
                        {searchResults.pages.length >
                          0 && (
                          <SearchGroupTitle>
                            Pages
                          </SearchGroupTitle>
                        )}

                        {searchResults.pages.map(
                          (item) => (
                            <button
                              key={
                                item.href
                              }
                              type="button"
                              onClick={() =>
                                goTo(
                                  item.href,
                                )
                              }
                              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-blue-soft)]"
                            >
                              <span className="text-[var(--denim-300)] transition-colors group-hover:text-[var(--sky-200)]">
                                {
                                  item.icon
                                }
                              </span>

                              <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--pale-sky)]">
                                {
                                  item.label
                                }
                              </span>
                            </button>
                          ),
                        )}

                        {searchResults.projects.length >
                          0 && (
                          <SearchGroupTitle>
                            Projects
                          </SearchGroupTitle>
                        )}

                        {searchResults.projects.map(
                          (
                            project,
                          ) => (
                            <button
                              key={
                                project._id
                              }
                              type="button"
                              onClick={() =>
                                goTo(
                                  `/projects/${project._id}`,
                                )
                              }
                              className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-purple-soft)]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-purple)]/30 bg-[var(--accent-soft)] text-[var(--lilac-300)]">
                                  <ProjectIcon />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[var(--pale-sky)]">
                                    {
                                      project.name
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                                    {project.description ||
                                      "No description"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ),
                        )}

                        {searchResults.tasks.length >
                          0 && (
                          <SearchGroupTitle>
                            Tasks
                          </SearchGroupTitle>
                        )}

                        {searchResults.tasks.map(
                          (task) => (
                            <button
                              key={
                                task._id
                              }
                              type="button"
                              onClick={() =>
                                goTo(
                                  `/projects/${task.project._id}`,
                                )
                              }
                              className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-blue-soft)]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-blue)]/30 bg-[var(--denim-soft)] text-[var(--denim-300)]">
                                  <TaskIcon />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[var(--pale-sky)]">
                                    {
                                      task.title
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                                    {
                                      task.project
                                        .name
                                    }
                                  </p>
                                </div>
                              </div>
                            </button>
                          ),
                        )}

                        {searchResults.pages.length ===
                          0 &&
                          searchResults.projects.length ===
                            0 &&
                          searchResults.tasks.length ===
                            0 && (
                            <div className="py-10 text-center">
                              <p className="text-sm font-bold text-[var(--pale-sky)]">
                                No results
                              </p>

                              <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Try a project name, task title or page.
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/*
             * =========================================================
             * NAVBAR ACTIONS
             * =========================================================
             */}

            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
              {/*
               * =========================================================
               * NOTIFICATIONS
               * =========================================================
               */}

              <div
                className="relative"
                data-top-menu="notifications"
              >
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={
                    notificationsOpen
                  }
                  onClick={
                    handleNotificationsToggle
                  }
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                    notificationsOpen
                      ? "border-[var(--lilac-400)]/60 bg-[var(--surface-purple)] text-[var(--lilac-200)] shadow-[0_12px_30px_-20px_var(--shadow-purple)]"
                      : "border-[var(--border-blue)]/30 bg-[var(--surface-blue-soft)] text-[var(--denim-300)] hover:border-[var(--border-purple)] hover:bg-[var(--surface-purple-soft)] hover:text-[var(--lilac-200)]"
                  }`}
                >
                  <BellIcon />

                  {unreadNotifications.length >
                    0 && (
                    <span className="absolute right-[7px] top-[7px] h-2.5 w-2.5 rounded-full border-2 border-[var(--neutral-900)] bg-[var(--lilac-300)] shadow-[0_0_12px_var(--shadow-purple)]" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="db-modal absolute right-0 top-[52px] z-[600] w-[min(92vw,390px)] overflow-hidden rounded-2xl">
                    <div className="relative flex items-center justify-between overflow-hidden border-b border-[var(--border-subtle)] px-4 py-4">
                      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[var(--deep-lilac)]/20 blur-3xl" />

                      <div className="relative">
                        <p className="text-sm font-bold text-[var(--pale-sky)]">
                          Notifications
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--denim-300)]">
                          {unreadNotifications.length} unread
                        </p>
                      </div>

                      {unreadNotifications.length >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            markAllAsRead
                          }
                          className="relative text-[10px] font-bold text-[var(--lilac-300)] transition-colors hover:text-[var(--sky-200)]"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto p-2">
                      {notificationsLoading ? (
                        <p className="py-10 text-center text-xs text-[var(--text-muted)]">
                          Loading...
                        </p>
                      ) : notificationError ? (
                        <p className="py-10 text-center text-xs font-bold text-[var(--lilac-300)]">
                          {
                            notificationError
                          }
                        </p>
                      ) : visibleNotifications.length ===
                        0 ? (
                        <div className="py-10 text-center">
                          <p className="text-sm font-bold text-[var(--pale-sky)]">
                            All caught up
                          </p>

                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            No pending notifications.
                          </p>
                        </div>
                      ) : (
                        visibleNotifications
                          .slice(
                            0,
                            8,
                          )
                          .map(
                            (task) => {
                              const unread =
                                !readNotificationIds.includes(
                                  task._id,
                                );

                              return (
                                <div
                                  key={
                                    task._id
                                  }
                                  className={`group mb-1 flex overflow-hidden rounded-xl border transition-colors ${
                                    unread
                                      ? "border-[var(--border-purple)]/20 bg-[var(--surface-purple-soft)]"
                                      : "border-transparent hover:bg-[var(--surface-blue-soft)]"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        unread
                                      ) {
                                        saveReadIds(
                                          Array.from(
                                            new Set([
                                              ...readNotificationIds,
                                              task._id,
                                            ]),
                                          ),
                                        );
                                      }

                                      goTo(
                                        `/projects/${task.project._id}`,
                                      );
                                    }}
                                    className="min-w-0 flex-1 p-3 text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      {unread && (
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lilac-300)] shadow-[0_0_8px_var(--shadow-purple)]" />
                                      )}

                                      <p className="truncate text-xs font-bold text-[var(--pale-sky)]">
                                        {
                                          task.title
                                        }
                                      </p>
                                    </div>

                                    <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                                      {
                                        task.project
                                          .name
                                      }
                                    </p>

                                    <p className="mt-2 text-[9px] font-semibold text-[var(--denim-300)]">
                                      Due{" "}
                                      {formatDueDate(
                                        task.dueDate,
                                      )}
                                    </p>
                                  </button>

                                  <button
                                    type="button"
                                    title="Dismiss"
                                    aria-label={`Dismiss ${task.title}`}
                                    onClick={() =>
                                      dismissNotification(
                                        task._id,
                                      )
                                    }
                                    className="flex w-10 shrink-0 items-center justify-center text-[var(--text-faint)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--sky-200)]"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            },
                          )
                      )}
                    </div>

                    <div className="border-t border-[var(--border-subtle)] p-3">
                      <button
                        type="button"
                        onClick={() =>
                          goTo(
                            "/my-tasks",
                          )
                        }
                        className="w-full rounded-xl border border-[var(--border-blue)]/25 bg-[var(--surface-blue-soft)] px-3 py-2.5 text-xs font-bold text-[var(--pale-sky)] transition-colors hover:border-[var(--border-purple)] hover:bg-[var(--surface-purple-soft)]"
                      >
                        View all tasks
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/*
               * =========================================================
               * USER MENU
               * =========================================================
               */}

              <div
                className="relative"
                data-top-menu="user"
              >
                <button
                  type="button"
                  aria-expanded={
                    userMenuOpen
                  }
                  onClick={
                    handleUserMenuToggle
                  }
                  className={`flex items-center gap-2.5 rounded-xl border px-2 py-1.5 transition-all ${
                    userMenuOpen
                      ? "border-[var(--border-blue)] bg-[var(--surface-blue)]"
                      : "border-transparent hover:border-[var(--border-blue)]/25 hover:bg-[var(--surface-blue-soft)]"
                  }`}
                >
                  <UserAvatar
                    initials={
                      initials
                    }
                    size="small"
                  />

                  <span className="hidden max-w-28 truncate text-xs font-semibold text-[var(--pale-sky)] sm:block">
                    {firstName}
                  </span>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`hidden h-3.5 w-3.5 text-[var(--denim-300)] transition-transform sm:block ${
                      userMenuOpen
                        ? "rotate-180"
                        : ""
                    }`}
                    aria-hidden="true"
                  >
                    <path
                      d="m7 10 5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="db-modal absolute right-0 top-[52px] z-[600] w-64 overflow-hidden rounded-2xl">
                    <div className="relative overflow-hidden border-b border-[var(--border-subtle)] p-4">
                      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[var(--dusty-denim)]/18 blur-3xl" />

                      <div className="relative flex items-center gap-3">
                        <UserAvatar
                          initials={
                            initials
                          }
                          size="large"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[var(--pale-sky)]">
                            {displayName}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                            {displayEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <TopMenuButton
                        icon={
                          <SettingsIcon />
                        }
                        label="Settings"
                        onClick={() =>
                          goTo(
                            "/settings",
                          )
                        }
                      />

                      <TopMenuButton
                        icon={
                          <SwitchIcon />
                        }
                        label="Switch account"
                        onClick={
                          handleSwitchAccount
                        }
                      />

                      <TopMenuButton
                        icon={
                          <SignOutIcon />
                        }
                        label="Sign out"
                        danger
                        onClick={
                          handleLogout
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/*
         * =========================================================
         * PAGE CONTENT
         * =========================================================
         */}

        <main className="min-h-[calc(100vh-86px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * USER AVATAR
 * =========================================================
 */

function UserAvatar({
  initials,
  size,
}: {
  initials: string;
  size:
    | "small"
    | "large";
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-blue)]/35 bg-[linear-gradient(135deg,var(--denim-500),var(--deep-lilac))] font-black text-[var(--sky-50)] shadow-[0_10px_24px_-16px_var(--shadow-blue)] ${
        size === "large"
          ? "h-10 w-10 text-xs"
          : "h-9 w-9 text-[10px]"
      }`}
    >
      <div className="pointer-events-none absolute -right-2 -top-2 h-6 w-6 rounded-full bg-[var(--pale-sky)]/20 blur-md" />

      <span className="relative">
        {initials}
      </span>
    </div>
  );
}

/*
 * =========================================================
 * SIDEBAR MENU BUTTON
 * =========================================================
 */

function SidebarMenuButton({
  icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone:
    | "blue"
    | "purple"
    | "danger";
  onClick: () => void;
}) {
  const styles = {
    blue: {
      wrapper:
        "hover:bg-[var(--surface-blue-soft)]",

      icon:
        "border-[var(--border-blue)]/25 bg-[var(--denim-soft)] text-[var(--denim-300)]",

      title:
        "text-[var(--pale-sky)]",
    },

    purple: {
      wrapper:
        "hover:bg-[var(--surface-purple-soft)]",

      icon:
        "border-[var(--border-purple)]/25 bg-[var(--accent-soft)] text-[var(--lilac-300)]",

      title:
        "text-[var(--pale-sky)]",
    },

    danger: {
      wrapper:
        "hover:bg-[var(--surface-purple-soft)]",

      icon:
        "border-[var(--border-purple)]/25 bg-[var(--accent-soft)] text-[var(--lilac-200)]",

      title:
        "text-[var(--lilac-200)]",
    },
  };

  const style =
    styles[tone];

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${style.wrapper}`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${style.icon}`}
      >
        {icon}
      </div>

      <div>
        <p
          className={`text-xs font-bold ${style.title}`}
        >
          {title}
        </p>

        <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
          {subtitle}
        </p>
      </div>
    </button>
  );
}

/*
 * =========================================================
 * TOP MENU BUTTON
 * =========================================================
 */

function TopMenuButton({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold transition-colors ${
        danger
          ? "text-[var(--lilac-200)] hover:bg-[var(--surface-purple-soft)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-blue-soft)] hover:text-[var(--pale-sky)]"
      }`}
    >
      <span
        className={
          danger
            ? "text-[var(--lilac-300)]"
            : "text-[var(--denim-300)]"
        }
      >
        {icon}
      </span>

      {label}
    </button>
  );
}

/*
 * =========================================================
 * SEARCH GROUP TITLE
 * =========================================================
 */

function SearchGroupTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="mb-1 mt-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--lilac-300)] first:mt-0">
      {children}
    </p>
  );
}

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

function SettingsIcon() {
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
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.07A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.53-1.03H3v-4h.07A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.07V3h4v.07a1.7 1.7 0 0 0 1.03 1.53 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.93 10H21v4h-.07A1.7 1.7 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SwitchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M7 7h11l-3-3M17 17H6l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
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
  );
}

function TaskIcon() {
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
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
    >
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7ZM10 20h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AppLayout;