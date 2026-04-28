import { createClient, type RealtimePostgresChangesPayload, type SupabaseClient } from '@supabase/supabase-js';
import { TokenManager } from '../api';

type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

interface SubscribeToTableChangesOptions {
  table: string;
  schema?: string;
  event?: RealtimeEvent;
  filter?: string;
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onStatusChange?: (status: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let realtimeClient: SupabaseClient | null | undefined;
let warnedMissingConfig = false;

function getRealtimeClient(): SupabaseClient | null {
  if (realtimeClient !== undefined) return realtimeClient;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!warnedMissingConfig && import.meta.env.DEV) {
      warnedMissingConfig = true;
      console.warn(
        '[Realtime] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Realtime subscriptions are disabled.',
      );
    }
    realtimeClient = null;
    return realtimeClient;
  }

  realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return realtimeClient;
}

function ensureRealtimeAuth(client: SupabaseClient): void {
  const token = TokenManager.get();
  if (!token) return;
  client.realtime.setAuth(token);
}

export function subscribeToTableChanges({
  table,
  schema = 'public',
  event = '*',
  filter,
  onChange,
  onStatusChange,
}: SubscribeToTableChangesOptions): () => void {
  const client = getRealtimeClient();
  if (!client) return () => undefined;

  ensureRealtimeAuth(client);

  const channelName = `rt:${schema}:${table}:${Math.random().toString(36).slice(2)}`;
  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event,
        schema,
        table,
        ...(filter ? { filter } : {}),
      },
      payload => {
        onChange(payload as RealtimePostgresChangesPayload<Record<string, unknown>>);
      },
    )
    .subscribe(status => {
      onStatusChange?.(status);
    });

  return () => {
    client.removeChannel(channel);
  };
}
