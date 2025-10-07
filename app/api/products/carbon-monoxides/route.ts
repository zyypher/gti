import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const carbonMonoxides = await prisma.product.findMany({
			distinct: ['co'],
			select: { co: true },
			orderBy: { co: 'asc' },
		})
		const uniqueCOs = carbonMonoxides.map((product) => product.co)
		return NextResponse.json(uniqueCOs)
	} catch (error) {
		console.error('Error fetching unique product carbon monoxide values:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch unique product carbon monoxide values' },
			{ status: 500 },
		)
	}
}
