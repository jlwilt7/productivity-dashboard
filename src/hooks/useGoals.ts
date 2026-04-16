import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Goal } from '../types/database';

export interface CreateGoalInput {
  name: string;
  frequency: Goal['frequency'];
  type: Goal['type'];
  target_value?: number | null;
  category?: string | null;
}

export interface UpdateGoalInput {
  name?: string;
  frequency?: Goal['frequency'];
  type?: Goal['type'];
  target_value?: number | null;
  category?: string | null;
  position?: number;
  is_archived?: boolean;
}

export function useGoals(includeArchived = false) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch Goals
   */
  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch goals error:', error);
      setError(error.message);
    } else {
      setError(null);
      setGoals((data ?? []) as Goal[]);
    }

    setLoading(false);

  }, [user, includeArchived]);

  /**
   * Initial Fetch
   */
  useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  // Keep latest fetchGoals accessible without retriggering the subscription effect.
  const fetchGoalsRef = useRef(fetchGoals);
  useEffect(() => {
    fetchGoalsRef.current = fetchGoals;
  }, [fetchGoals]);

  /**
   * Realtime Subscription
   *
   * Channel name includes a random suffix so each mount gets a fresh channel.
   * Without this, Strict Mode / HMR remount returns the already-subscribed
   * channel from supabase.channel() and .on() throws "after subscribe()".
   */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`goals:${user.id}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchGoalsRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };

  }, [user]);

  /**
   * Add Goal
   */
  const addGoal = useCallback(
    async (input: CreateGoalInput) => {
      if (!user) return;

      const position = goals.length;

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: input.name,
          frequency: input.frequency,
          type: input.type,
          target_value: input.target_value ?? null,
          category: input.category ?? null,
          position,
          is_archived: false,
        });

      if (error) {
        console.error('Add goal error:', error);
        setError(error.message);
      }

      await fetchGoals();

    },
    [user, goals.length, fetchGoals]
  );

  /**
   * Update Goal
   */
  const updateGoal = useCallback(
    async (id: string, patch: UpdateGoalInput) => {
      const { error } = await supabase
        .from('goals')
        .update(patch)
        .eq('id', id);

      if (error) {
        console.error('Update goal error:', error);
        setError(error.message);
      }

      await fetchGoals();

    },
    [fetchGoals]
  );

  /**
   * Delete Goal
   */
  const deleteGoal = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete goal error:', error);
        setError(error.message);
      }

      await fetchGoals();

    },
    [fetchGoals]
  );

  /**
   * Reorder Goals
   */
  const reorderGoals = useCallback(
    async (orderedIds: string[]) => {

      // Optimistic UI
      setGoals((prev) => {
        const map = new Map(prev.map((g) => [g.id, g]));

        return orderedIds
          .map((id, idx) => {
            const g = map.get(id);
            return g ? { ...g, position: idx } : null;
          })
          .filter((g): g is Goal => g !== null);
      });

      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase
            .from('goals')
            .update({ position: idx })
            .eq('id', id)
        )
      );

    },
    []
  );

  /**
   * Archive Goal
   */
  const archiveGoal = useCallback(
    async (id: string, archived: boolean) => {
      await updateGoal(id, { is_archived: archived });
    },
    [updateGoal]
  );

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    reorderGoals,
    archiveGoal,
    refresh: fetchGoals,
  };
}