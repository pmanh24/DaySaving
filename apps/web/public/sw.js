self.addEventListener("push", (event) => {
  let data = { title: "100 Days Saving", body: "Đến giờ tiết kiệm rồi.", url: "/", tag: "saving-reminder" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Keep the fallback notification when a provider sends an empty payload.
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag,
    renotify: true,
    data: { url: data.url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => "focus" in client);
    if (existing) {
      if ("navigate" in existing) void existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  }));
});
