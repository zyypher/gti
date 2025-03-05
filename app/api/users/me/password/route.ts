import bcrypt from 'bcrypt'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export async function PATCH(req: Request) {
    const prisma = new PrismaClient()

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
    
    try {
        const userId = await getUserIdFromToken()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await req.json()

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // ✅ Ensure user has a password set
        if (!user.password) {
            return NextResponse.json({ error: 'Password not set. Please reset your password.' }, { status: 400 })
        }

        // ✅ Check if current password is correct
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
        }

        // ✅ Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })

        return NextResponse.json({ message: 'Password updated successfully' })
    } catch (error) {
        console.error('Error updating password:', error)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }
}
