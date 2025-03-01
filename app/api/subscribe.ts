import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { userId, subscription } = await req.json();

        if (!userId || !subscription) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // ✅ Save or update push notification subscription in DB
        await prisma.user.update({
            where: { id: userId },
            data: { pushSubscription: JSON.stringify(subscription) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}
