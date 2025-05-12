import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/getUserIdFromToken'
import webpush from 'web-push';

webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// ✅ Fetch Unread Notifications & All Notifications
export async function GET(req: Request) {
    try {
        // ✅ Extract userId from JWT
        const userId = await getUserIdFromToken(req)

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            )
        }

        // ✅ Fetch all notifications for user
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        // ✅ Count Unread Notifications
        const unreadCount = notifications.filter((n) => !n.isRead).length

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 },
        )
    }
}

// ✅ Mark all notifications as read
export async function PATCH(req: Request) {
    try {
        const userId = await getUserIdFromToken(req)
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            )
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json(
            { error: 'Failed to update notifications' },
            { status: 500 },
        )
    }
}


export async function POST(req: Request) {
    try {
        const { userId, orderId, message } = await req.json();

        if (!userId || !message) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // ✅ Save notification
        const notification = await prisma.notification.create({
            data: { userId, orderId, message },
        });

        // ✅ Get user push subscription
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user?.pushSubscription) {
            const subscription = JSON.parse(user.pushSubscription);
            await webpush.sendNotification(
                subscription,
                JSON.stringify({
                    title: 'New Notification',
                    message,
                    url: '/notifications', // ✅ Redirect to notifications page
                })
            );
        }

        return NextResponse.json({ success: true, notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}
