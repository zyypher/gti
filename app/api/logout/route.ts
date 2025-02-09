import { NextResponse } from 'next/server'

export async function POST() {
    // Clear the authentication cookie
    const response = NextResponse.json({ message: 'Logout successful' })
    response.cookies.set('token', '', { httpOnly: true, maxAge: 0 })
    return response
}
