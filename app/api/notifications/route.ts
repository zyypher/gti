import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
    try {
        const { userId, orderId, message } = await req.json()

        if (!userId || !orderId || !message) {
            return NextResponse.json(
                { error: 'Missing fields' },
                { status: 400 },
            )
        }

        const notification = await prisma.notification.create({
            data: { userId, orderId, message },
        })

        return NextResponse.json({ success: true, notification })
    } catch (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 },
        )
    }
}
