"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { apiRequest } from "@/lib/api";
import { disablePush, enablePush, getLocalPushSubscription, pushSupported, type PushStatus } from "@/lib/push";

export function PushNotificationSettings() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([apiRequest<PushStatus>("/push/status", {}, accessToken), getLocalPushSubscription()])
      .then(([serverStatus, localSubscription]) => setStatus({ ...serverStatus, enabled: Boolean(localSubscription) && serverStatus.enabled }))
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể kiểm tra trạng thái thông báo."));
  }, [accessToken]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 7500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggle = () => {
    if (!accessToken) return;
    setBusy(true);
    const operation = status?.enabled ? disablePush(accessToken) : enablePush(accessToken);
    void operation
      .then((next) => {
        setStatus(next);
        setNotice(next.enabled ? `Đã bật thông báo. Bạn sẽ được nhắc lúc ${next.reminderTime}.` : "Đã tắt thông báo trên thiết bị này.");
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể thay đổi thông báo."))
      .finally(() => setBusy(false));
  };

  const supported = pushSupported();
  return <>
    <button className="setting-item setting-button" onClick={toggle} disabled={busy || !supported}>
      <div className="setting-icon">{status?.enabled ? <Bell size={18} /> : <BellOff size={18} />}</div>
      <div><strong>{supported ? "Thông báo tiết kiệm" : "Thông báo chưa hỗ trợ"}</strong><span>{supported ? status?.enabled ? `Đang bật · Nhắc lúc ${status.reminderTime}` : "Bật để nhận nhắc nhở mỗi ngày lúc 20:00" : "Hãy dùng trình duyệt có hỗ trợ Web Push"}</span></div>
      <span className={`toggle ${status?.enabled ? "on" : ""}`} />
    </button>
    {notice && <div className="notice-card" role="status">{notice}</div>}
  </>;
}
