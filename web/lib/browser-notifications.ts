/**
 * Browser Push Notification & Audio Chime Utility
 * Handles Web Notifications API permissions and displays native OS/browser push notifications.
 */

export type NotificationPermissionStatus = "granted" | "denied" | "default" | "unsupported";

/**
 * Check if the current browser environment supports the Notifications API.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && ("Notification" in window || "serviceWorker" in navigator);
}

/**
 * Get current browser notification permission status.
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return "unsupported";
  if (typeof Notification !== "undefined") {
    return Notification.permission as NotificationPermissionStatus;
  }
  return "default";
}

/**
 * Register Service Worker for reliable push notifications across all mobile & desktop browsers.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return registration;
  } catch (err) {
    console.warn("ServiceWorker registration failed:", err);
    return null;
  }
}

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return "unsupported";

  try {
    // Ensure service worker is registered in background
    registerServiceWorker().catch(() => {});

    let perm: NotificationPermission;
    if (typeof Notification !== "undefined" && typeof Notification.requestPermission === "function") {
      const req = Notification.requestPermission();
      if (req && typeof req.then === "function") {
        perm = await req;
      } else {
        perm = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }
      return perm as NotificationPermissionStatus;
    }
    return "default";
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
    return getNotificationPermission();
  }
}

// Global AudioContext reference
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a synthesized chime sound using the Web Audio API.
 */
export function playAttendanceChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Pleasant three-tone ascending chord (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.25, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.35);
    });
  } catch (e) {
    console.debug("Audio chime could not be played:", e);
  }
}

export interface BrowserNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

/**
 * Show a native browser push notification.
 * Works seamlessly across Android Chrome, iOS WebKit PWA, desktop browsers, and ServiceWorker.
 */
export async function showBrowserNotification(
  title: string,
  options: BrowserNotificationOptions
): Promise<Notification | null> {
  if (!isNotificationSupported()) return null;
  if (getNotificationPermission() !== "granted") return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const defaultIcon = origin ? `${origin}/assets/logo.png` : "/assets/logo.png";
  const notifOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon ? (options.icon.startsWith("http") ? options.icon : `${origin}${options.icon}`) : defaultIcon,
    badge: options.badge ? (options.badge.startsWith("http") ? options.badge : `${origin}${options.badge}`) : defaultIcon,
    tag: options.tag || `codebreakers-att-${Date.now()}`,
    requireInteraction: options.requireInteraction ?? false,
    data: options.data || { url: "/dashboard" },
    ...(typeof navigator !== "undefined" && "vibrate" in navigator ? { vibrate: [200, 100, 200] } : {}),
  };

  // 1. Primary path: ServiceWorker Registration (Required for Android & mobile PWA)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      let reg: ServiceWorkerRegistration | null | undefined = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await registerServiceWorker();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return null;
      }
    } catch (swErr) {
      console.warn("ServiceWorker showNotification failed, trying fallback:", swErr);
    }
  }

  // 2. Fallback path: standard window.Notification constructor (for desktop browsers)
  try {
    if (typeof Notification !== "undefined") {
      const notification = new Notification(title, notifOptions);
      notification.onclick = function () {
        window.focus();
        notification.close();
      };
      return notification;
    }
  } catch (err) {
    console.warn("Window Notification constructor unavailable on this device:", err);
  }

  return null;
}
