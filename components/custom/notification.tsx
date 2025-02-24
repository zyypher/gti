'use client';

import { useEffect, useState } from 'react';
import { Settings, Settings2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import api from '@/lib/api'; 

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  orderId: string;
}

export default function Notification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch notifications when component loads
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await api.get('/api/notifications'); // API call
        setNotifications(res.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  // ✅ Mark notification as read when clicked
  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}`, { isRead: true });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="w-full max-w-[395px] divide-y divide-gray-300 overflow-hidden rounded-lg bg-white shadow-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 rounded-t-lg bg-gray-100 p-3 text-black">
        <h2 className="font-semibold leading-5">Notifications</h2>
        <button type="button" className="hover:opacity-80">
          <X className="size-[18px]" />
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[466px] divide-y divide-gray-300 overflow-y-auto">
        {loading ? (
          <p className="text-center p-4 text-gray-500">Loading notifications...</p>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex gap-3 px-3 py-5 hover:bg-gray-100 cursor-pointer"
              onClick={() => markAsRead(notif.id)}
            >
              {/* Avatar Placeholder */}
              <Link
                href="#"
                className="size-9 shrink-0 overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center text-gray-600"
              >
                📢
              </Link>

              {/* Notification Content */}
              <div className="space-y-2.5">
                <p className="text-xs/5 font-medium text-gray">
                  <span className="font-bold text-black">Order Update:</span> {notif.message}
                </p>
                <div className="flex items-center gap-2.5 text-xs/4 font-medium text-gray">
                  <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                  <span className={`size-2 shrink-0 rounded-full ${notif.isRead ? 'bg-gray-400' : 'bg-primary'}`}></span>
                  <span>Order ID: {notif.orderId}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center p-4 text-gray-500">No new notifications</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-right">
        <Button type="button" variant={'black'} size={'large'}>
          View all notifications
        </Button>
      </div>
    </div>
  );
}
