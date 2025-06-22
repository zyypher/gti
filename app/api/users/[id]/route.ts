import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/getUserIdFromToken'

// Update user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const loggedInUserId = await getUserIdFromToken(req)
    if (!loggedInUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the logged-in user is an admin
    const loggedInUser = await prisma.user.findUnique({
        where: { id: loggedInUserId },
    })
    if (loggedInUser?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userIdToUpdate = params.id

    try {
        const { email, password, role } = await req.json()

        // Ensure at least one field is provided
        if (!email && !password && !role) {
            return NextResponse.json({ error: 'At least one field is required for update' }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: { email, password, role },
        })

        return NextResponse.json(updatedUser, { status: 200 })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

// Delete user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const loggedInUserId = await getUserIdFromToken(req)
    if (!loggedInUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the logged-in user is an admin
    const loggedInUser = await prisma.user.findUnique({
        where: { id: loggedInUserId },
    })
    if (loggedInUser?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userIdToDelete = params.id

    try {
        await prisma.user.delete({
            where: { id: userIdToDelete },
        })

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
