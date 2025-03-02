'use client'

import { useEffect, useState } from 'react'
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
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            )
            toast.success('All notifications marked as read')
        } catch (error) {
            toast.error('Failed to mark notifications as read')
        }
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Notifications" />

            <div className="flex justify-between items-center">
                {notifications.some((n) => !n.isRead) && (
                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                    >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark All as Read
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Card key={index} className="p-4">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                        </Card>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                    <p className="text-gray-500 text-lg">No notifications found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`p-4 border rounded-lg ${notification.isRead
                                ? 'border-gray-300 bg-blue-50' 
                                : 'border-blue-500 bg-white'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-800">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(
                                            new Date(notification.createdAt),
                                            { addSuffix: true }
                                        )}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <Bell className="h-4 w-4 text-blue-500" />
                                )}
                            </div>
                        </Card>
                    ))}

                </div>
            )}
        </div>
    )
}
