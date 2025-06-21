import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

async function getUserIdFromToken() {
    try {
        const token = cookies().get('token')?.value
        if (!token) return null

        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)

        return payload.id as string // ✅ Extract userId from token
    } catch (error) {
        console.error('Error verifying token:', error)
        return null
    }
}

// ✅ GET User Profile
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromToken()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
            },
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }
}

// ✅ Update User Profile
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromToken()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { firstName, lastName, phoneNumber, email } = await req.json()

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phoneNumber,
                email,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}
