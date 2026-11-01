/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { subscribeToMobileBroadcast } from "@/lib/supabase-client";

interface UseRealtimeOptions {
  channel: string;
  event: string;
  onUpdate: (payload?: any) => void;
  enabled?: boolean;
}

/**
 * React hook to effortlessly subscribe to Supabase Realtime broadcast channels on mobile.
 */
export function useSupabaseRealtime({
  channel,
  event,
  onUpdate,
  enabled = true,
}: UseRealtimeOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToMobileBroadcast(channel, event, (payload) => {
      onUpdateRef.current(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [channel, event, enabled]);
}
