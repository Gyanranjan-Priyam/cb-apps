/* eslint-disable @typescript-eslint/no-explicit-any */
import { RealtimeChannel } from "@supabase/supabase-js";
import { getMainSupabaseClient, getQuizSupabaseClient } from "./supabase-client";

// Active channels map: roomName -> RealtimeChannel
const activeChannels = new Map<string, RealtimeChannel>();
// Event listeners map: eventName -> Set of callbacks
const eventListeners = new Map<string, Set<(...args: any[]) => void>>();
const connectionListeners = new Set<(connected: boolean) => void>();

function getClientForRoom(room: string) {
  const isQuizRoom = room.startsWith("quiz-") || room.startsWith("system-");
  return isQuizRoom ? getQuizSupabaseClient() : getMainSupabaseClient();
}

/**
 * Initialize Supabase Realtime connection.
 */
export async function initSocket(): Promise<any> {
  if (typeof window === "undefined") return null;
  return getQuizSupabaseClient();
}

/**
 * Returns a mock socket client for legacy calls.
 */
export function getSocket(): any {
  if (typeof window === "undefined") return null;
  return {
    connected: true,
    emit: (event: string, ...args: any[]) => {
      console.log(`🔌 [SupabaseRealtime Bridge] emit: ${event}`, args);
    },
    on: (event: string, callback: (...args: any[]) => void) => {
      onSocketEvent(event, callback);
    },
    off: (event: string, callback?: (...args: any[]) => void) => {
      if (callback) {
        const listeners = eventListeners.get(event);
        if (listeners) listeners.delete(callback);
      } else {
        eventListeners.delete(event);
      }
    },
  };
}

/**
 * Subscribe to connection status changes.
 */
export function onSocketConnectionChange(callback: (connected: boolean) => void): () => void {
  connectionListeners.add(callback);
  callback(true);
  return () => {
    connectionListeners.delete(callback);
  };
}

// Channel subscriber reference counts
const channelRefCount = new Map<string, number>();

/**
 * Join a room (Supabase Realtime Channel).
 * Returns a cleanup function that automatically unsubscribes and removes the channel when all listeners detach.
 */
export function joinRoom(room: string): () => void {
  if (!room || typeof window === "undefined") return () => {};

  const client = getClientForRoom(room);
  const currentCount = channelRefCount.get(room) || 0;
  channelRefCount.set(room, currentCount + 1);

  let channel = activeChannels.get(room);
  if (!channel) {
    channel = client.channel(room, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    // Attach wildcard broadcast listener to distribute events to registered callbacks
    channel.on("broadcast", { event: "*" }, (payloadObj: any) => {
      const eventName = payloadObj?.event;
      const data = payloadObj?.payload;
      if (eventName) {
        const callbacks = eventListeners.get(eventName);
        if (callbacks) {
          callbacks.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(`Error in Supabase Realtime listener for "${eventName}":`, err);
            }
          });
        }
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`🔌 [Supabase Realtime] Subscribed to channel: ${room}`);
      }
    });

    activeChannels.set(room, channel);
  }

  return () => {
    const count = (channelRefCount.get(room) || 1) - 1;
    if (count <= 0) {
      channelRefCount.delete(room);
      const ch = activeChannels.get(room);
      if (ch) {
        client.removeChannel(ch).then(() => {
          activeChannels.delete(room);
          console.log(`🔌 [Supabase Realtime] Unsubscribed from channel: ${room}`);
        }).catch(() => {});
      }
    } else {
      channelRefCount.set(room, count);
    }
  };
}

/**
 * Register a listener for an event across all joined channels.
 */
export function onSocketEvent(event: string, callback: (...args: any[]) => void): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);

  return () => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        eventListeners.delete(event);
      }
    }
  };
}

/**
 * Disconnect and unsubscribe from all active channels.
 */
export function disconnectSocket(): void {
  activeChannels.forEach((channel, room) => {
    const client = getClientForRoom(room);
    client.removeChannel(channel).catch(() => {});
  });
  activeChannels.clear();
  eventListeners.clear();
  connectionListeners.clear();
  console.log("🔌 [Supabase Realtime] Disconnected and cleaned all channels.");
}


