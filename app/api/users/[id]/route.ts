import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Update user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const userId = params.id

    try {
        const { email, password, role } = await req.json()

        // Ensure at least one field is provided
        if (!email && !password && !role) {
            return NextResponse.json({ error: 'At least one field is required for update' }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
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
    const userId = params.id

    try {
        await prisma.user.delete({
            where: { id: userId },
        })

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
