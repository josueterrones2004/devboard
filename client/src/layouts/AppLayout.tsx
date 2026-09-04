import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

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
        <path
          d="M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
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
          strokeWidth="1.8"
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
        <path
          d="m5 7 2 2 4-4M13 7h6M5 13l2 2 4-4M13 13h6M5 19l2 2 4-4M13 19h6"
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
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.07A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.53-1.03H3v-4h.07A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.07V3h4v.07a1.7 1.7 0 0 0 1.03 1.53 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.93 10H21v4h-.07A1.7 1.7 0 0 0 19.4 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const location = useLocation();

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

  const pageTitle =
    navigation.find((item) =>
      location.pathname.startsWith(
        item.href,
      ),
    )?.label ?? "DevBoard";

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f7f7fa]">
      <div
        className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.07] bg-[#101116] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-white/[0.07] px-6">
          <NavLink
            to="/dashboard"
            onClick={closeSidebar}
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7657ff] to-[#4c7dff] shadow-[0_10px_30px_-10px_rgba(118,87,255,.8)]">
              <span className="text-sm font-black tracking-[-0.05em] text-white">
                DB
              </span>
            </div>

            <div>
              <p className="text-base font-black tracking-[-0.035em] text-white">
                DevBoard
              </p>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                Workspace
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
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

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#7657ff]/15 text-[#a897ff]"
                      : "text-white/45 hover:bg-white/[0.045] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={
                        isActive
                          ? "text-[#8f7bff]"
                          : "text-white/30 transition-colors group-hover:text-white/65"
                      }
                    >
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8f7bff] shadow-[0_0_12px_rgba(143,123,255,.9)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
              Quick access
            </p>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-bold text-white/40 transition-colors hover:bg-white/[0.045] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-white/30"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              New project
            </button>
          </div>
        </div>

        <div className="border-t border-white/[0.07] p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.045]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d1f27] text-xs font-black text-[#a897ff] ring-1 ring-white/[0.08]">
              JT
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                Josué Terrones
              </p>

              <p className="mt-0.5 truncate text-[10px] font-medium text-white/30">
                Workspace owner
              </p>
            </div>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 shrink-0 text-white/25"
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
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-white/[0.07] bg-[#0b0c10]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Open sidebar"
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white lg:hidden"
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

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
              DevBoard
            </p>

            <h1 className="mt-0.5 text-lg font-black tracking-[-0.035em] text-white">
              {pageTitle}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
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
            </button>

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
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

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7657ff]" />
            </button>

            <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />

            <button
              type="button"
              className="hidden items-center gap-2 rounded-xl p-1.5 pr-3 transition-colors hover:bg-white/[0.045] sm:flex"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d1f27] text-[10px] font-black text-[#a897ff] ring-1 ring-white/[0.08]">
                JT
              </div>

              <span className="text-xs font-bold text-white/60">
                Josué
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5 text-white/25"
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
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;