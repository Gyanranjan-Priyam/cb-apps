/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let mainServerClient: SupabaseClient | null = null;
let quizServerClient: SupabaseClient | null = null;

function getMainConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { url, key };
}

function getQuizConfig() {
  const url =
    process.env.NEXT_PUBLIC_QUIZ_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    process.env.QUIZ_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_QUIZ_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { url, key };
}

export function getMainServerClient(): SupabaseClient {
  if (!mainServerClient) {
    const { url, key } = getMainConfig();
    mainServerClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return mainServerClient;
}

export function getQuizServerClient(): SupabaseClient {
  if (!quizServerClient) {
    const { url, key } = getQuizConfig();
    quizServerClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return quizServerClient;
}

/**
 * Direct ultra-fast HTTP broadcast dispatch via Supabase Realtime REST API.
 * Avoids channel connection/disconnection latency and finishes in ~10-30ms.
 */
async function sendDirectRealtimeBroadcast(
  url: string,
  key: string,
  channelName: string,
  eventName: string,
  payload: any
): Promise<boolean> {
  if (!url || !key) return false;

  const baseUrl = url.replace(/^ws/i, "http").replace(/\/+$/, "");
  const broadcastUrl = `${baseUrl}/realtime/v1/api/broadcast`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(broadcastUrl, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: channelName,
            event: eventName,
            payload: payload ?? {},
          },
        ],
      }),
      signal: controller.signal,
      keepalive: true,
    });

    return response.ok || response.status === 202;
  } catch {
    // If direct broadcast fails or times out, signal fallback
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Broadcast an event to all connected clients in a Supabase Realtime channel.
 */
export async function emitRealtimeEvent(
  channelName: string,
  eventName: string,
  payload: any,
  clientType: "main" | "quiz" = "main"
): Promise<void> {
  const { url, key } = clientType === "quiz" ? getQuizConfig() : getMainConfig();
  if (!url || !key) return;

  const success = await sendDirectRealtimeBroadcast(url, key, channelName, eventName, payload);
  if (!success) {
    try {
      const client = clientType === "quiz" ? getQuizServerClient() : getMainServerClient();
      const channel = client.channel(channelName);

      if (typeof (channel as any).httpSend === "function") {
        await (channel as any).httpSend(eventName, payload);
      } else {
        await channel.send({
          type: "broadcast",
          event: eventName,
          payload,
        });
      }

      // Clean up transient server channel non-blockingly
      void client.removeChannel(channel);
    } catch (error) {
      console.error(`❌ [SupabaseServer] Failed to broadcast event "${eventName}" to "${channelName}":`, error);
    }
  }
}

/**
 * Broadcast an event to multiple channels simultaneously with parallel dispatch.
 */
export async function emitRealtimeEventToRooms(
  channelNames: string[],
  eventName: string,
  payload: any,
  clientType: "main" | "quiz" = "main"
): Promise<void> {
  if (!channelNames.length) return;
  await Promise.allSettled(
    channelNames.map((channelName) =>
      emitRealtimeEvent(channelName, eventName, payload, clientType)
    )
  );
}
