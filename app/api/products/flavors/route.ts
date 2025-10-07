import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const flavors = await prisma.product.findMany({
			distinct: ['flavor'],
			select: { flavor: true },
			orderBy: { flavor: 'asc' },
		})
		const uniqueFlavors = flavors.map((product) => product.flavor)
		return NextResponse.json(uniqueFlavors)
	} catch (error) {
		console.error('Error fetching unique product flavors:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch unique product flavors' },
			{ status: 500 },
		)
	}
}
