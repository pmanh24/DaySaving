import { apiRequest } from "@/lib/api";

export interface PushStatus {
  configured: boolean;
  enabled: boolean;
  subscriptionCount: number;
  reminderTime: string;
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(publicKey);
}

export async function getLocalPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.register("/sw.js");
  return registration.pushManager.getSubscription();
}

export async function enablePush(accessToken: string): Promise<PushStatus> {
  if (!pushSupported() || !publicKey) throw new Error("Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bạn chưa cho phép ứng dụng gửi thông báo.");
  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodePublicKey(publicKey) as unknown as BufferSource });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Không thể đọc thông tin thiết bị thông báo.");
  return apiRequest<PushStatus>("/push/subscribe", { method: "POST", body: JSON.stringify({ endpoint: json.endpoint, expirationTime: json.expirationTime ?? null, keys: json.keys }) }, accessToken);
}

export async function disablePush(accessToken: string): Promise<PushStatus> {
  const subscription = await getLocalPushSubscription();
  if (!subscription) return apiRequest<PushStatus>("/push/status", {}, accessToken);
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return apiRequest<PushStatus>("/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) }, accessToken);
}

function decodePublicKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}
