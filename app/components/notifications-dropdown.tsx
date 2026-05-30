"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  caseId: string | null;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications?limit=5&unreadOnly=true");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setNotifications(json.data ?? []);
        setUnreadCount(json.unreadCount ?? json.data?.filter((n: Notification) => !n.isRead).length ?? 0);
      } catch {
        // silently fail
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label={`Notificaciones (${unreadCount} sin leer)`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-card shadow-lg z-20">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex items-start gap-3 px-3 py-2.5 border-b last:border-0 cursor-pointer transition-colors hover:bg-accent/50 ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <Link
                  href="/notificaciones"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-primary hover:underline py-1"
                >
                  Ver todas las notificaciones →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
