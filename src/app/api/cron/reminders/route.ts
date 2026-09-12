import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";
import webpush from "web-push";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    // Vercel Cron Security (Optional but recommended)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const env = getServerEnv();
    
    // We expect the user to have these in .env.local
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:admin@dayflow.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const adminDb = createAdminClient();
    
    // We check tasks that are due this minute.
    // E.g., if it's 10:30, we look for reminder_time = '10:30' (or similar, depending on how tasks are scheduled).
    // Note: Our task table only has 'start_time' and 'scheduled_date'.
    // Let's assume we notify if start_time == current time (HH:mm) AND scheduled_date == today.
    // For habits, we have `reminder_time`.

    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const currentTimeStr = format(now, "HH:mm");

    // 1. Get Tasks that start NOW and are not completed
    const { data: tasks } = await adminDb
      .from("tasks")
      .select("id, user_id, title, start_time")
      .eq("scheduled_date", todayStr)
      .eq("start_time", currentTimeStr)
      .eq("is_completed", false);

    // 2. Get Habits that remind NOW
    const { data: habits } = await adminDb
      .from("habits")
      .select("id, user_id, title, reminder_time");
      // Since reminder_time is TEXT and could be NULL, we filter in JS or DB
      // We'll filter in JS to be safe, or use eq if exact

    const activeHabits = (habits || []).filter(h => h.reminder_time === currentTimeStr);

    const notificationsToSend: { user_id: string; title: string; body: string; url: string }[] = [];

    (tasks || []).forEach(task => {
      notificationsToSend.push({
        user_id: task.user_id,
        title: "Waktunya Tugas!",
        body: `Waktunya mengerjakan: ${task.title}`,
        url: "/dashboard" // Or specific URL
      });
    });

    activeHabits.forEach(habit => {
      notificationsToSend.push({
        user_id: habit.user_id,
        title: "Waktunya Habit!",
        body: `Jangan lupa untuk: ${habit.title}`,
        url: `/habits/${habit.id}`
      });
    });

    if (notificationsToSend.length === 0) {
      return NextResponse.json({ success: true, message: "No reminders due at this minute" });
    }

    // Extract unique user IDs to fetch subscriptions
    const userIds = [...new Set(notificationsToSend.map(n => n.user_id))];

    // Fetch subscriptions for these users
    const { data: subscriptions } = await adminDb
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No subscribed devices found for due reminders" });
    }

    const sendPromises = notificationsToSend.flatMap(notification => {
      // Find all devices for this user
      const userSubs = subscriptions.filter(sub => sub.user_id === notification.user_id);
      
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        url: notification.url
      });

      return userSubs.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
        } catch (error: any) {
          // If the subscription is invalid/expired (statusCode 410 or 404), remove it from DB
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing expired subscription for endpoint: ${sub.endpoint}`);
            await adminDb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          } else {
            console.error(`Push error for endpoint ${sub.endpoint}:`, error);
          }
        }
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sent: sendPromises.length });
  } catch (error: any) {
    console.error("Cron reminders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}