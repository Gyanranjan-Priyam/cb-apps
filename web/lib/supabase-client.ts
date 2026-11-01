/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

// Singleton client instances
let mainSupabaseClient: SupabaseClient | null = null;
let quizSupabaseClient: SupabaseClient | null = null;


/**
 * Returns the browser client for the Main Supabase project (Attendance, Leaderboard, Points).
 */
export function getMainSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }

  if (!mainSupabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.warn("⚠️ [SupabaseClient] Main Supabase URL or Anon Key is missing");
    }

    mainSupabaseClient = createClient(url || "", anonKey || "", {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return mainSupabaseClient;
}

/**
 * Returns the browser client for the Dedicated Quiz / Exam Supabase project (Live CBT Exams, Kiosks).
 */
export function getQuizSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createClient(
      process.env.NEXT_PUBLIC_QUIZ_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_QUIZ_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }

  if (!quizSupabaseClient) {
    const url = process.env.NEXT_PUBLIC_QUIZ_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_QUIZ_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.warn("⚠️ [SupabaseClient] Quiz Supabase URL or Anon Key is missing");
    }

    quizSupabaseClient = createClient(url || "", anonKey || "", {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }

  return quizSupabaseClient;
}

// Track active channels and listeners for automatic cleanup and reuse
const activeChannels = new Map<string, RealtimeChannel>();
const channelRefCounts = new Map<string, number>();
const channelListeners = new Map<string, Map<string, Set<(payload: any) => void>>>();

/**
 * Helper to subscribe to a broadcast event on a Supabase Realtime channel.
 * Uses reference counting so multiple components sharing a channel don't disconnect each other.
 */
export function subscribeToBroadcast(
  channelName: string,
  eventName: string,
  callback: (payload: any) => void,
  clientType: "main" | "quiz" = "main"
): () => void {
  if (typeof window === "undefined") return () => {};

  const client = clientType === "quiz" ? getQuizSupabaseClient() : getMainSupabaseClient();
  const key = `${clientType}:${channelName}`;

  const currentCount = channelRefCounts.get(key) || 0;
  channelRefCounts.set(key, currentCount + 1);

  if (!channelListeners.has(key)) {
    channelListeners.set(key, new Map());
  }
  const eventMap = channelListeners.get(key)!;
  if (!eventMap.has(eventName)) {
    eventMap.set(eventName, new Set());
  }
  eventMap.get(eventName)!.add(callback);

  let channel = activeChannels.get(key);
  if (!channel) {
    channel = client.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channel.on("broadcast", { event: "*" }, (payloadObj: any) => {
      const receivedEvent = payloadObj?.event;
      const data = payloadObj?.payload;
      if (receivedEvent && eventMap.has(receivedEvent)) {
        eventMap.get(receivedEvent)?.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error in broadcast listener for ${receivedEvent}:`, err);
          }
        });
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`🔌 [SupabaseRealtime] Subscribed to channel: ${channelName} (${clientType})`);
      }
    });

    activeChannels.set(key, channel);
  }

  // Return cleanup function
  return () => {
    const currentListeners = eventMap.get(eventName);
    if (currentListeners) {
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        eventMap.delete(eventName);
      }
    }

    const count = (channelRefCounts.get(key) || 1) - 1;
    if (count <= 0) {
      channelRefCounts.delete(key);
      channelListeners.delete(key);
      const ch = activeChannels.get(key);
      if (ch) {
        client.removeChannel(ch).then(() => {
          activeChannels.delete(key);
          console.log(`🔌 [SupabaseRealtime] Left channel: ${channelName} (${clientType})`);
        }).catch(() => {});
      }
    } else {
      channelRefCounts.set(key, count);
    }
  };
}
