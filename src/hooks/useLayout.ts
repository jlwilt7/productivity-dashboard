import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_LAYOUT, useDashboardStore } from '../store/useDashboardStore';
import type { LayoutConfig } from '../types/database';

export function useLayout() {
  const { user } = useAuth();
  const layout = useDashboardStore((s) => s.layout);
  const setLayout = useDashboardStore((s) => s.setLayout);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) setError(error.message);
      if (data && data.layout_json) {
        setLayout(data.layout_json as LayoutConfig);
      }
      setLoading(false);
    }
    void load();
  }, [user, setLayout]);

  const saveLayout = useCallback(
    async (next: LayoutConfig) => {
      setLayout(next);
      if (!user) return;
      const { error } = await supabase.from('dashboard_layouts').upsert(
        {
          user_id: user.id,
          layout_json: next,
        },
        { onConflict: 'user_id' },
      );
      if (error) setError(error.message);
    },
    [user, setLayout],
  );

  const resetToDefault = useCallback(async () => {
    await saveLayout(DEFAULT_LAYOUT);
  }, [saveLayout]);

  return { layout, loading, error, saveLayout, resetToDefault };
}
