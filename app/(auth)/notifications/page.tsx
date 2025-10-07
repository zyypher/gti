'use client'

import { useEffect, useState, useMemo } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PageHeading from '@/components/layout/page-heading'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications')
      setNotifications(response.data.notifications)
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark notifications as read')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeading heading="Notifications" />

      {/* header bar */}
      <Card className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/60 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/70 px-3 py-1.5 text-sm">
            <Bell className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-zinc-900">Total</span>
            <span className="rounded-md bg-zinc-900/5 px-2 py-0.5 text-zinc-700">
              {notifications.length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/70 px-3 py-1.5 text-sm">
            <Clock className="h-4 w-4 text-rose-600" />
            <span className="font-medium text-zinc-900">Unread</span>
            <span className="rounded-md bg-rose-600/10 px-2 py-0.5 text-rose-700">
              {unreadCount}
            </span>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="mr-1 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </Card>

      {/* list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-white/30 bg-white/60 p-4 backdrop-blur-xl"
            >
              <Skeleton className="h-9 w-9 rounded-full bg-white/80" />
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-xl bg-white/80" />
                <Skeleton className="h-4 w-1/2 rounded-xl bg-white/80" />
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="rounded-2xl border border-white/30 bg-white/60 p-12 text-center text-zinc-500 backdrop-blur-xl">
          No notifications found
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !n.isRead
            return (
              <Card
                key={n.id}
                className={[
                  'group flex items-start gap-3 rounded-2xl p-4 transition-shadow backdrop-blur-xl',
                  'border border-white/40',
                  isUnread
                    ? 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                    : 'bg-white/60'
                ].join(' ')}
              >
                {/* status dot */}
               {/* status badge */}
<span
  className={[
    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
    'shadow-[0_6px_16px_rgba(0,0,0,0.08)]',
    isUnread
      ? 'bg-indigo-600 text-white shadow-[0_6px_16px_rgba(99,102,241,0.35)]'
      : 'bg-zinc-200 text-zinc-700'
  ].join(' ')}
  aria-hidden="true"
>
  {isUnread ? (
    <Bell className="h-3.5 w-3.5" />
  ) : (
    <CheckCircle className="h-3.5 w-3.5" />
  )}
</span>


                {/* content */}
                <div className="flex-1">
                  <p className="text-sm text-zinc-900">{n.message}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true
                    })}
                  </p>
                </div>

                {/* badge/icon */}
                {isUnread ? (
                  <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-indigo-700">
                    New
                  </span>
                ) : (
                  <CheckCircle className="ml-2 h-4 w-4 text-emerald-500" />
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
