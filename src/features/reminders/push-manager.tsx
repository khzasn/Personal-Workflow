"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { getPublicEnv } from "@/lib/env";

// Convert a base64 string to a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Register service worker if not already
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
          }
          setIsLoading(false);
        });
      }).catch(err => {
        console.error("Service worker registration failed", err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      
      const env = getPublicEnv();
      if (!env.vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey)
      });

      // Send to backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ subscription })
      });

      if (!res.ok) throw new Error("Failed to save subscription on server");
      
      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Failed to subscribe:", err);
      alert(err.message || "Gagal mengaktifkan notifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from backend
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Browser tidak mendukung Push Notification</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/70 p-4 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSubscribed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Notifikasi Background</h4>
          <p className="text-[11px] text-muted-foreground">
            {isSubscribed ? "Aktif. Kamu akan menerima pengingat." : "Menerima pengingat meskipun aplikasi ditutup."}
          </p>
        </div>
      </div>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-all disabled:opacity-50 ${
          isSubscribed 
            ? "border border-border/60 bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSubscribed ? "Matikan" : "Aktifkan")}
      </button>
    </div>
  );
}