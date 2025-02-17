import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all users
export async function GET(req: NextRequest) {
    try {
        const users = await prisma.user.findMany()
        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

// Add a new user
export async function POST(req: NextRequest) {
    try {
        const { email, password, role } = await req.json()

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const newUser = await prisma.user.create({
            data: { email, password, role },
        })

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}

