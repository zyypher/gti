import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// ✅ Extract User ID from JWT Token
export async function getUserIdFromToken(req: Request): Promise<string | null> {
    try {
        const token = cookies().get('token')?.value
        if (!token) return null

        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)

        return payload.id as string
    } catch (error) {
        console.error('Error verifying token:', error)
        return null
    }
}