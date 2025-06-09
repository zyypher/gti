import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { SignJWT } from 'jose'

export async function POST(req: Request) {
    try {
        // Read and parse the request body
        const body = await req.json()
        const { email, password } = body

        // Check if user exists in the database
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 },
            )
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 },
            )
        }

        // Create a JWT token using jose
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1d')
            .sign(secret)

        // Set the token in a cookie
        const response = NextResponse.json({ message: 'Login successful' })
        response.cookies.set('token', token, {
            httpOnly: true,
            maxAge: 86400,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        })

        return response
    } catch (error) {
        console.error('Error handling login:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        )
    }
}
