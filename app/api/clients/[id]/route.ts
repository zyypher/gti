import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/getUserIdFromToken'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } },
) {
    const userId = getUserIdFromToken(request)
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = params
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

        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                firstName,
                lastName,
                company,
                primaryNumber,
                secondaryNumber,
                country,
                email,
            },
        })

        return NextResponse.json(updatedClient)
    } catch (error) {
        console.error(`Error updating client:`, error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
    const userId = getUserIdFromToken(request)
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = params
        await prisma.client.delete({
            where: { id },
        })
        return NextResponse.json(
            { message: 'Client deleted successfully' },
            { status: 200 },
        )
    } catch (error) {
        console.error(`Error deleting client:`, error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
} 