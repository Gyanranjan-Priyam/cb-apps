/* eslint-disable @typescript-eslint/no-explicit-any */
import { emitRealtimeEvent, emitRealtimeEventToRooms } from "./supabase-server";

/**
 * Emit a Real-time event to a specific room/channel using Supabase Realtime.
 * Automatically routes quiz/system channels to the dedicated Quiz cluster and others to Main.
 */
export async function emitSocketEvent(room: string, event: string, data: any): Promise<void> {
  const isQuizRoom = room.startsWith("quiz-") || room.startsWith("system-");
  const clientType = isQuizRoom ? "quiz" : "main";
  await emitRealtimeEvent(room, event, data, clientType);
}

/**
 * Emit events to multiple rooms at once (batch emit) using Supabase Realtime.
 */
export async function emitSocketEventToRooms(
  rooms: string[],
  event: string,
  data: any
): Promise<void> {
  const quizRooms = rooms.filter((r) => r.startsWith("quiz-") || r.startsWith("system-"));
  const mainRooms = rooms.filter((r) => !r.startsWith("quiz-") && !r.startsWith("system-"));

  await Promise.all([
    quizRooms.length > 0 ? emitRealtimeEventToRooms(quizRooms, event, data, "quiz") : Promise.resolve(),
    mainRooms.length > 0 ? emitRealtimeEventToRooms(mainRooms, event, data, "main") : Promise.resolve(),
  ]);
}
