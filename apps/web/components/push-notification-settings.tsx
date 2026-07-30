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
  const [testBusy, setTestBusy] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [timeBusy, setTimeBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([apiRequest<PushStatus>("/push/status", {}, accessToken), getLocalPushSubscription()])
      .then(([serverStatus, localSubscription]) => {
        setStatus({ ...serverStatus, enabled: Boolean(localSubscription) && serverStatus.enabled });
        setReminderTime(serverStatus.reminderTime);
      })
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

  const sendTest = () => {
    if (!accessToken) return;
    setTestBusy(true);
    void apiRequest<{ sent: number }>("/push/test", { method: "POST" }, accessToken)
      .then((result) => setNotice(result.sent ? "Đã gửi thông báo thử. Hãy kiểm tra thiết bị của bạn." : "Hệ thống chưa tìm thấy thiết bị nào đã đăng ký thông báo."))
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể gửi thông báo thử."))
      .finally(() => setTestBusy(false));
  };

  const saveReminderTime = () => {
    if (!accessToken || !reminderTime) return;
    setTimeBusy(true);
    void apiRequest<PushStatus>("/push/settings", { method: "PATCH", body: JSON.stringify({ reminderTime }) }, accessToken)
      .then((next) => {
        setStatus((current) => current ? { ...current, reminderTime: next.reminderTime } : next);
        setReminderTime(next.reminderTime);
        setNotice(`Đã lưu giờ nhắc nhở lúc ${next.reminderTime}.`);
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể lưu giờ nhắc nhở."))
      .finally(() => setTimeBusy(false));
  };

  const supported = pushSupported();
  return <>
    <button className="setting-item setting-button" onClick={toggle} disabled={busy || !supported}>
      <div className="setting-icon">{status?.enabled ? <Bell size={18} /> : <BellOff size={18} />}</div>
      <div><strong>{supported ? "Thông báo tiết kiệm" : "Thông báo chưa hỗ trợ"}</strong><span>{supported ? status?.enabled ? `Đang bật · Nhắc lúc ${status.reminderTime}` : `Bật để nhận nhắc nhở mỗi ngày${status?.reminderTime ? ` lúc ${status.reminderTime}` : ""}` : "Hãy dùng trình duyệt có hỗ trợ Web Push"}</span></div>
      <span className={`toggle ${status?.enabled ? "on" : ""}`} />
    </button>
    {status?.enabled && <button className="push-test-button" onClick={sendTest} disabled={testBusy}>{testBusy ? "Đang gửi…" : "Gửi thông báo thử"}</button>}
    {status?.enabled && <div className="push-reminder-panel">
      <div className="push-reminder-copy"><strong>Giờ nhắc nhở</strong><span>Hệ thống sẽ gửi thông báo mỗi ngày theo múi giờ của tài khoản.</span></div>
      <div className="push-reminder-actions"><label htmlFor="push-reminder-time">Chọn giờ</label><input id="push-reminder-time" type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} /><button type="button" onClick={saveReminderTime} disabled={timeBusy || !reminderTime}>{timeBusy ? "Đang lưu…" : "Lưu giờ"}</button></div>
    </div>}
    {notice && <div className="notice-card" role="status">{notice}</div>}
  </>;
}
