import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutConfig, StartupEntry, WidgetType } from '../types/database';

export const DEFAULT_LAYOUT: LayoutConfig = {
  widgets: [
    { id: 'checklist',    type: 'checklist',    visible: true, position: 0 },
    { id: 'quick-stats',  type: 'quick-stats',  visible: true, position: 1 },
    { id: 'daily-pie',    type: 'daily-pie',    visible: true, position: 2 },
    { id: 'weekly-pie',   type: 'weekly-pie',   visible: true, position: 3 },
    { id: 'monthly-pie',  type: 'monthly-pie',  visible: true, position: 4 },
  ],
};

interface DashboardStoreState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;

  layout: LayoutConfig;
  setLayout: (layout: LayoutConfig) => void;
  toggleWidget: (type: WidgetType) => void;
  reorderWidgets: (ids: string[]) => void;
  resetLayout: () => void;

  startupEntries: StartupEntry[];
  addStartupEntry: (entry: StartupEntry) => void;
  removeStartupEntry: (date: string) => void;
  clearStartupEntries: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const useDashboardStore = create<DashboardStoreState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      selectedDate: todayISO(),
      setSelectedDate: (date) => set({ selectedDate: date }),

      layout: DEFAULT_LAYOUT,
      setLayout: (layout) => set({ layout }),
      toggleWidget: (type) =>
        set((s) => ({
          layout: {
            widgets: s.layout.widgets.map((w) =>
              w.type === type ? { ...w, visible: !w.visible } : w,
            ),
          },
        })),
      reorderWidgets: (ids) =>
        set((s) => ({
          layout: {
            widgets: ids
              .map((id, idx) => {
                const w = s.layout.widgets.find((wi) => wi.id === id);
                return w ? { ...w, position: idx } : null;
              })
              .filter((w): w is NonNullable<typeof w> => w !== null),
          },
        })),
      resetLayout: () => set({ layout: DEFAULT_LAYOUT }),

      startupEntries: [],
      addStartupEntry: (entry) =>
        set((s) => ({
          startupEntries: [
            entry,
            ...s.startupEntries.filter((e) => e.date !== entry.date),
          ].sort((a, b) => (a.date < b.date ? 1 : -1)),
        })),
      removeStartupEntry: (date) =>
        set((s) => ({
          startupEntries: s.startupEntries.filter((e) => e.date !== date),
        })),
      clearStartupEntries: () => set({ startupEntries: [] }),
    }),
    {
      name: 'dashboard-store',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        layout: s.layout,
        startupEntries: s.startupEntries,
      }),
    },
  ),
);
