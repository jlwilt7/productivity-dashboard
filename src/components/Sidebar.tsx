import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';

interface NavItem {
  to: string;
  label: string;
  icon: ReactElement;
}

const iconClass = 'h-5 w-5 flex-shrink-0';

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/weekly',
    label: 'Weekly Review',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/monthly',
    label: 'Monthly Review',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/metrics',
    label: 'Metrics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/startup',
    label: 'Startup Tracker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <path d="M5 19c0-5 3-8 7-8s7 3 7 8" />
        <path d="M12 3l2 4h-4l2-4zM9 14l-3 3M15 14l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const collapsed = useDashboardStore((s) => s.sidebarCollapsed);
  const setCollapsed = useDashboardStore((s) => s.setSidebarCollapsed);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-card-border bg-bg-elevated transition-transform duration-200',
          'w-64',
          collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-16 items-center gap-3 border-b border-card-border px-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 14h7v7H3z" />
            </svg>
          </div>
          {(!collapsed || window.innerWidth < 768) && (
            <div className="flex flex-col overflow-hidden md:block">
              <span className="truncate text-sm font-semibold text-white">
                Productivity
              </span>
              <span className="truncate text-xs text-mute">Dashboard</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => {
                    if (window.innerWidth < 768) setCollapsed(true);
                  }}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent/15 text-accent'
                        : 'text-mute-light hover:bg-card hover:text-white',
                    ].join(' ')
                  }
                >
                  {item.icon}
                  <span
                    className={
                      collapsed ? 'hidden md:hidden' : 'block truncate'
                    }
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-card-border p-3 text-xs text-mute">
          {!collapsed && (
            <span className="block text-center">
              v1.0.0 &middot; local-first
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
