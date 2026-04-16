import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import { useAuth } from '../context/AuthContext';
import { formatPretty, todayISO } from '../utils/dateHelpers';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/goals': 'Goals',
  '/weekly': 'Weekly Review',
  '/monthly': 'Monthly Review',
  '/metrics': 'Metrics',
  '/startup': 'Startup Tracker',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = TITLES[location.pathname] ?? 'Productivity Dashboard';
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const setSelectedDate = useDashboardStore((s) => s.setSelectedDate);
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const showDatePicker = location.pathname === '/';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-card-border bg-bg/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="btn-ghost h-9 w-9 p-0"
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-white md:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {showDatePicker && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-mute">{formatPretty(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-auto"
              max={todayISO()}
            />
            {selectedDate !== todayISO() && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setSelectedDate(todayISO())}
              >
                Today
              </button>
            )}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent hover:bg-accent/30"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
          >
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-card-border bg-card shadow-card">
                <div className="border-b border-card-border p-3">
                  <div className="truncate text-sm font-medium text-white">
                    {user?.email ?? 'Signed in'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-mute-light hover:bg-card-hover"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await signOut();
                    navigate('/login', { replace: true });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-status-red hover:bg-status-red/10"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
