/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { API_BASE_URL } from "./api-config";

let supabaseClient: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

// Track active channels, listener sets, and reference counts
const activeChannels = new Map<string, RealtimeChannel>();
const channelRefCounts = new Map<string, number>();
const channelListeners = new Map<string, Map<string, Set<(payload: any) => void>>>();

/**
 * Initializes and returns the Supabase client for mobile realtime subscriptions.
 */
export async function getMobileSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseClient) return supabaseClient;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      let anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        // Fetch dynamically from backend if not baked into env
        const res = await fetch(`${API_BASE_URL}/api/admin/mobile?type=supabase-config`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            url = json.data.url;
            anonKey = json.data.anonKey;
          }
        }
      }

      if (!url || !anonKey) {
        console.warn("⚠️ [SupabaseMobile] Supabase credentials not found");
        return null;
      }

      supabaseClient = createClient(url, anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 15,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      console.log("🔌 [SupabaseMobile] Realtime client initialized");
      return supabaseClient;
    } catch (err) {
      console.warn("Failed to initialize mobile Supabase client:", err);
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Subscribe to broadcast events on a Supabase Realtime channel.
 * Returns an unsubscription cleanup function.
 */
export function subscribeToMobileBroadcast(
  channelName: string,
  eventName: string,
  callback: (payload: any) => void
): () => void {
  let isCleanedUp = false;

  const count = channelRefCounts.get(channelName) || 0;
  channelRefCounts.set(channelName, count + 1);

  if (!channelListeners.has(channelName)) {
    channelListeners.set(channelName, new Map());
  }
  const eventMap = channelListeners.get(channelName)!;
  if (!eventMap.has(eventName)) {
    eventMap.set(eventName, new Set());
  }
  eventMap.get(eventName)!.add(callback);

  getMobileSupabaseClient().then((client) => {
    if (isCleanedUp || !client) return;

    let channel = activeChannels.get(channelName);
    if (!channel) {
      channel = client.channel(channelName, {
        config: {
          broadcast: { ack: false, self: true },
        },
      });

      channel.on("broadcast", { event: "*" }, (payloadObj: any) => {
        const receivedEvent = payloadObj?.event;
        const data = payloadObj?.payload ?? payloadObj;
        console.log(`📡 [SupabaseMobile] Broadcast received on [${channelName}]:`, receivedEvent, data);
        if (receivedEvent && eventMap.has(receivedEvent)) {
          eventMap.get(receivedEvent)?.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(`Error in broadcast handler for ${receivedEvent}:`, err);
            }
          });
        }
      });

      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`🔌 [SupabaseMobile] Successfully subscribed to channel: ${channelName}`);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`⚠️ [SupabaseMobile] Channel ${channelName} status: ${status}`, err);
        }
      });

      activeChannels.set(channelName, channel);
    }
  });

  return () => {
    isCleanedUp = true;
    const currentListeners = eventMap.get(eventName);
    if (currentListeners) {
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        eventMap.delete(eventName);
      }
    }

    const currentCount = (channelRefCounts.get(channelName) || 1) - 1;
    if (currentCount <= 0) {
      channelRefCounts.delete(channelName);
      channelListeners.delete(channelName);
      const ch = activeChannels.get(channelName);
      if (ch && supabaseClient) {
        supabaseClient.removeChannel(ch).then(() => {
          activeChannels.delete(channelName);
          console.log(`🔌 [SupabaseMobile] Left channel: ${channelName}`);
        }).catch(() => {});
      }
    } else {
      channelRefCounts.set(channelName, currentCount);
    }
  };
}
