import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Goal, GoalEntry, GoalStatus } from '../types/database';

export function computeStatus(
  goal: Pick<Goal, 'type' | 'target_value'>,
  value: number,
): GoalStatus {
  if (goal.type === 'checkbox') {
    return value > 0 ? 'green' : 'red';
  }
  const target = goal.target_value ?? 0;
  if (target <= 0) {
    return value > 0 ? 'green' : 'red';
  }
  if (value <= 0) return 'red';
  if (value >= target) return 'green';
  return 'yellow';
}

interface UseGoalEntriesOptions {
  from?: string;
  to?: string;
}

export function useGoalEntries({ from, to }: UseGoalEntriesOptions = {}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('goal_entries')
      .select('*')
      .eq('user_id', user.id);
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query.order('date', { ascending: true });
    if (error) setError(error.message);
    else {
      setError(null);
      setEntries((data ?? []) as GoalEntry[]);
    }
    setLoading(false);
  }, [user, from, to]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const fetchEntriesRef = useRef(fetchEntries);
  useEffect(() => {
    fetchEntriesRef.current = fetchEntries;
  }, [fetchEntries]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`goal_entries:${user.id}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchEntriesRef.current();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const byKey = useMemo(() => {
    const m = new Map<string, GoalEntry>();
    for (const e of entries) m.set(`${e.goal_id}__${e.date}`, e);
    return m;
  }, [entries]);

  const getEntry = useCallback(
    (goalId: string, date: string) => byKey.get(`${goalId}__${date}`) ?? null,
    [byKey],
  );

  const upsertEntry = useCallback(
    async (goal: Goal, date: string, value: number) => {
      if (!user) return;
      const status = computeStatus(goal, value);
      // Optimistic update.
      setEntries((prev) => {
        const key = `${goal.id}__${date}`;
        const existing = prev.find(
          (e) => e.goal_id === goal.id && e.date === date,
        );
        if (existing) {
          return prev.map((e) =>
            e.goal_id === goal.id && e.date === date
              ? { ...e, value, status }
              : e,
          );
        }
        return [
          ...prev,
          {
            id: `optimistic-${key}`,
            user_id: user.id,
            goal_id: goal.id,
            date,
            value,
            status,
            created_at: new Date().toISOString(),
          },
        ];
      });

      const { error } = await supabase
        .from('goal_entries')
        .upsert(
          {
            user_id: user.id,
            goal_id: goal.id,
            date,
            value,
            status,
          },
          { onConflict: 'goal_id,date' },
        );
      if (error) setError(error.message);
      await fetchEntries();
    },
    [user, fetchEntries],
  );

  const clearEntry = useCallback(
    async (goalId: string, date: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('goal_entries')
        .delete()
        .eq('goal_id', goalId)
        .eq('date', date);
      if (error) setError(error.message);
      await fetchEntries();
    },
    [user, fetchEntries],
  );

  return {
    entries,
    loading,
    error,
    getEntry,
    upsertEntry,
    clearEntry,
    refresh: fetchEntries,
  };
}
