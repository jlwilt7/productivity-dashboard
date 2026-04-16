import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Reflection, ReflectionType } from '../types/database';

export function useReflections(type: ReflectionType, date: string) {
  const { user } = useAuth();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!user) {
      setReflection(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('date', date)
      .maybeSingle();
    if (error) setError(error.message);
    else {
      setError(null);
      setReflection((data as Reflection | null) ?? null);
    }
    setLoading(false);
  }, [user, type, date]);

  useEffect(() => {
    void fetchOne();
  }, [fetchOne]);

  const save = useCallback(
    async (content: string) => {
      if (!user) return;
      const { error } = await supabase.from('reflections').upsert(
        {
          user_id: user.id,
          type,
          date,
          content,
        },
        { onConflict: 'user_id,type,date' },
      );
      if (error) setError(error.message);
      await fetchOne();
    },
    [user, type, date, fetchOne],
  );

  return { reflection, loading, error, save, refresh: fetchOne };
}

export function useAllReflections() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setReflections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setReflections((data ?? []) as Reflection[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { reflections, loading, refresh: fetch };
}
