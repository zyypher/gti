import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        // ✅ Find token in the database
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // ✅ Hash password and update user
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        // ✅ Delete the token after use
        await prisma.passwordResetToken.delete({ where: { token } });

        return NextResponse.json({ message: "Password set successfully" });
    } catch (error) {
        console.error("Error setting password:", error);
        return NextResponse.json({ error: "Failed to set password" }, { status: 500 });
    }
}
