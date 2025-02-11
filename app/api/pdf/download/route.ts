import { NextResponse } from 'next/server'
import fs from 'fs'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('file')

    if (!filePath || !fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="merged-document.pdf"',
        },
    })
}
