self.addEventListener("push", (event) => {
  console.log("[WebPush] push event received", { hasData: Boolean(event.data) });
  let data = { title: "100 Days Saving", body: "Đến giờ tiết kiệm rồi.", url: "/", tag: "saving-reminder" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Keep the fallback notification when a provider sends an empty payload.
  }
  event.waitUntil((async () => {
    try {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: data.tag,
        renotify: true,
        data: { url: data.url },
      });
      console.log("[WebPush] notification displayed", { tag: data.tag });
    } catch (error) {
      console.error("[WebPush] notification display failed", error);
      throw error;
    }
  })());
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
