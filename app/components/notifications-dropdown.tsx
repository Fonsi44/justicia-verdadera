"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, Clock, Calendar, Receipt, FileText, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  isRead: boolean
  caseId: string | null
  createdAt: string
}

const typeIcons: Record<string, typeof Bell> = {
  plazo: Clock,
  vista: Calendar,
  audiencia: Calendar,
  factura: Receipt,
  documento: FileText,
  sistema: Bell,
  mensaje: MessageSquare,
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=false&limit=5")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : data.notifications ?? [])
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function formatRelative(dateStr: string) {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
    } catch {
      return ""
    }
  }

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      )
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2",
            "w-80 max-h-96 overflow-y-auto rounded-xl border bg-card shadow-lg ring-1 ring-foreground/10",
            "animate-fade-in-up origin-top-right",
          )}
        >
          <div className="sticky top-0 z-10 border-b bg-card px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <Bell className="mb-2 size-8 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] ?? Bell
                return (
                  <li key={notification.id}>
                    <button
                      onClick={() => {
                        if (!notification.isRead) markAsRead(notification.id)
                      }}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !notification.isRead && "bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          !notification.isRead
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {notification.title}
                          </span>
                          <time className="shrink-0 text-[11px] text-muted-foreground">
                            {formatRelative(notification.createdAt)}
                          </time>
                        </div>
                        {notification.body && (
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {notification.body}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="sticky bottom-0 border-t bg-card px-4 py-2.5">
            <a
              href="/notificaciones"
              className="block text-center text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Ver todas las notificaciones
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
