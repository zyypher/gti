import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/getUserIdFromToken'

export async function POST(request: Request) {
    const userId = getUserIdFromToken(request)
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const {
            firstName,
            lastName,
            company,
            primaryNumber,
            secondaryNumber,
            country,
            email,
        } = body

        if (
            !firstName ||
            !lastName ||
            !company ||
            !primaryNumber ||
            !country ||
            !email
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            )
        }

        // Basic email format check (optional but nice to have)
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 },
            )
        }

        const newClient = await prisma.client.create({
            data: {
                firstName,
                lastName,
                company,
                primaryNumber,
                secondaryNumber,
                country,
                email,
                // 👇 required by current Prisma schema – reuse email for now
                nickname: email,
            },
        })

        return NextResponse.json(newClient, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function GET(request: Request) {
    const userId = getUserIdFromToken(request)
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const clients = await prisma.client.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        })
        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}
