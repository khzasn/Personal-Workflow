/**
 * src/lib/notifications/browser-notification.ts
 * Helper untuk integrasi Web Notification API di desktop & mobile browser.
 */

import type { Task } from "@/types";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

/**
 * Mengirim notifikasi browser native saat tugas memasuki jam pelaksanaan.
 */
export function sendTaskNotification(task: Task): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const timeStr = task.start_time ? task.start_time.slice(0, 5) : "";
    const title = `⏰ Waktunya Tugas: ${task.title}`;
    const body = `Mulai pukul ${timeStr} • Kategori: ${task.category} (${task.estimated_minutes}m)`;

    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: `dayflow-task-${task.id}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("Failed to send browser notification:", err);
    return null;
  }
}
