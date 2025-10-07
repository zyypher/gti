import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const colors = await prisma.product.findMany({
			distinct: ['color'],
			select: { color: true },
			orderBy: { color: 'asc' },
		})
		const uniqueColors = colors.map((product) => product.color)
		return NextResponse.json(uniqueColors)
	} catch (error) {
		console.error('Error fetching unique product colors:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch unique product colors' },
			{ status: 500 },
		)
	}
}
