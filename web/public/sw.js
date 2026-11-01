// Service Worker for CodeBreakers Real-Time Push & Attendance Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl) || client.url.includes("/dashboard")) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    let data;
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }

    const title = data.title || "CodeBreakers Notification";
    const options = {
      body: data.body || "",
      icon: data.icon || "/assets/logo.png",
      badge: data.badge || "/assets/logo.png",
      tag: data.tag || `cb-${Date.now()}`,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: data.data || { url: "/dashboard" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("ServiceWorker push event error:", err);
  }
});
