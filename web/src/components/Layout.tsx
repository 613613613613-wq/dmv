import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useContentPack } from "../engine/contentPack";
import { currentStreak } from "../engine/streak";

const NAV = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/practice", label: "Practice", icon: BookIcon },
  { to: "/mock", label: "Mock Test", icon: ClipboardIcon },
  { to: "/review", label: "Review", icon: HistoryIcon },
  { to: "/bookmarks", label: "Saved", icon: BookmarkIcon },
  { to: "/settings", label: "Settings", icon: GearIcon },
];

export default function Layout() {
  const { data } = useUserData();
  const { pack } = useContentPack();
  const streak = currentStreak(data.attempts);
  const location = useLocation();
  const onMockExam =
    location.pathname.startsWith("/mock/exam") || location.pathname.startsWith("/mock/result");

  return (
    <div className="min-h-full bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
              <span className="font-bold tracking-tight">FL</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink-900">
                {pack?.name ?? "Florida"} Permit Prep
              </div>
              <div className="text-xs text-ink-500">
                {pack?.agency.name ?? "FLHSMV"} · Class E Knowledge Exam
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="chip bg-sun-50 text-sun-500">
                <FlameIcon /> {streak}-day streak
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-12 md:pl-52">
        <Outlet />
      </main>

      {!onMockExam && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-5xl grid-cols-6">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                    isActive ? "text-ink-900" : "text-ink-400"
                  }`
                }
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <aside className="fixed left-4 top-24 z-20 hidden w-44 md:block">
        <nav className="card flex flex-col gap-1 p-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-ink-900 text-white"
                    : "text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                }`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z" />
      <path d="M4 16a4 4 0 0 1 4-4h12" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="18" rx="2" />
      <path d="M9 4V2h6v2" />
      <path d="M9 10h6M9 14h6M9 18h4" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4Z" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2s4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 1-3S6 11 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12Z" />
    </svg>
  );
}
