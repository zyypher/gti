import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromToken } from '@/lib/getUserIdFromToken'

const prisma = new PrismaClient()

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
