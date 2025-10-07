import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const packFormats = await prisma.product.findMany({
			distinct: ['packetStyle'],
			select: { packetStyle: true },
			orderBy: { packetStyle: 'asc' },
		})
		const uniquePackFormats = packFormats.map((product) => product.packetStyle)
		return NextResponse.json(uniquePackFormats)
	} catch (error) {
		console.error('Error fetching unique product pack formats:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch unique product pack formats' },
			{ status: 500 },
		)
	}
}
