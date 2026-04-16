import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useDashboardStore } from '../store/useDashboardStore';

export function Layout() {
  const collapsed = useDashboardStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-bg text-white">
      <Sidebar />
      <div
        className={[
          'flex min-h-screen flex-col transition-[padding] duration-200',
          collapsed ? 'md:pl-16' : 'md:pl-64',
        ].join(' ')}
      >
        <TopBar />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
