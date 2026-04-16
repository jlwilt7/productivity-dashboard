import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useDashboardStore } from '../store/useDashboardStore';
import { useLayout } from '../hooks/useLayout';
import type {
  DashboardLayout,
  Goal,
  GoalEntry,
  Reflection,
} from '../types/database';

interface ExportBundle {
  version: 1;
  exportedAt: string;
  user_email: string | null;
  goals: Goal[];
  goal_entries: GoalEntry[];
  reflections: Reflection[];
  dashboard_layouts: DashboardLayout[];
  startup_entries: ReturnType<typeof useDashboardStore.getState>['startupEntries'];
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { resetToDefault } = useLayout();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onExport() {
    if (!user) return;
    setBusy(true);
    setMessage(null);

    const [goalsRes, entriesRes, reflectionsRes, layoutsRes] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('goal_entries').select('*').eq('user_id', user.id),
      supabase.from('reflections').select('*').eq('user_id', user.id),
      supabase.from('dashboard_layouts').select('*').eq('user_id', user.id),
    ]);

    const bundle: ExportBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user_email: user.email ?? null,
      goals: (goalsRes.data ?? []) as Goal[],
      goal_entries: (entriesRes.data ?? []) as GoalEntry[],
      reflections: (reflectionsRes.data ?? []) as Reflection[],
      dashboard_layouts: (layoutsRes.data ?? []) as DashboardLayout[],
      startup_entries: useDashboardStore.getState().startupEntries,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setBusy(false);
    setMessage({ kind: 'ok', text: 'Export downloaded.' });
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    setMessage(null);

    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as Partial<ExportBundle>;
      if (bundle.version !== 1) throw new Error('Unsupported export version.');

      // Strip ids so Supabase assigns fresh ones and avoids collisions.
      const stamp = (rows: Array<{ id?: string; user_id?: string }>) =>
        rows.map(({ id: _id, ...rest }) => ({ ...rest, user_id: user.id }));

      if (bundle.goals?.length) {
        const { error } = await supabase
          .from('goals')
          .insert(stamp(bundle.goals as Goal[]));
        if (error) throw error;
      }
      if (bundle.goal_entries?.length) {
        const { error } = await supabase
          .from('goal_entries')
          .insert(stamp(bundle.goal_entries as GoalEntry[]));
        if (error) throw error;
      }
      if (bundle.reflections?.length) {
        const { error } = await supabase
          .from('reflections')
          .insert(stamp(bundle.reflections as Reflection[]));
        if (error) throw error;
      }
      if (bundle.startup_entries?.length) {
        const { addStartupEntry } = useDashboardStore.getState();
        for (const se of bundle.startup_entries) addStartupEntry(se);
      }
      setMessage({
        kind: 'ok',
        text: 'Import complete. Some rows may have been skipped if they already existed.',
      });
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Import failed.',
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onReset() {
    if (!user) return;
    const confirmed = confirm(
      'Reset account data? This permanently deletes all goals, entries, reflections, and layouts. This cannot be undone.',
    );
    if (!confirmed) return;
    setBusy(true);
    setMessage(null);
    const results = await Promise.all([
      supabase.from('goal_entries').delete().eq('user_id', user.id),
      supabase.from('reflections').delete().eq('user_id', user.id),
      supabase.from('dashboard_layouts').delete().eq('user_id', user.id),
      supabase.from('goals').delete().eq('user_id', user.id),
    ]);
    useDashboardStore.getState().clearStartupEntries();
    await resetToDefault();
    setBusy(false);
    const failed = results.find((r) => r.error);
    setMessage(
      failed
        ? { kind: 'err', text: failed.error?.message ?? 'Reset failed.' }
        : { kind: 'ok', text: 'Account data reset.' },
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="mt-1 text-sm text-mute">
          Manage your data and account preferences.
        </p>
      </div>

      <div className="card space-y-1">
        <h3 className="text-sm font-semibold text-white">Account</h3>
        <p className="text-sm text-mute-light">{user?.email ?? 'Not signed in'}</p>
        <div className="pt-3">
          <button type="button" className="btn-outline" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold text-white">Export data</h3>
        <p className="mb-3 text-sm text-mute">
          Download all your goals, entries, reflections, and layouts as a JSON
          file.
        </p>
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={busy || !user}
          className="btn-primary disabled:opacity-50"
        >
          Download JSON
        </button>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold text-white">Import data</h3>
        <p className="mb-3 text-sm text-mute">
          Restore from a previously exported JSON. New records will be inserted
          alongside your existing data.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={onImport}
          disabled={busy || !user}
          className="block w-full text-sm text-mute-light file:mr-3 file:rounded-md file:border-0 file:bg-accent/20 file:px-3 file:py-2 file:text-sm file:text-accent hover:file:bg-accent/30"
        />
      </div>

      <div className="card border-status-red/30">
        <h3 className="mb-1 text-sm font-semibold text-status-red">Reset account data</h3>
        <p className="mb-3 text-sm text-mute">
          Permanently deletes all goals, entries, reflections, layouts, and
          startup entries. Your account itself is not deleted.
        </p>
        <button
          type="button"
          onClick={() => void onReset()}
          disabled={busy || !user}
          className="btn-danger disabled:opacity-50"
        >
          Reset everything
        </button>
      </div>

      {message && (
        <div
          className={[
            'rounded-lg border px-3 py-2 text-sm',
            message.kind === 'ok'
              ? 'border-status-green/30 bg-status-green/10 text-status-green'
              : 'border-status-red/30 bg-status-red/10 text-status-red',
          ].join(' ')}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
