import type { Metadata } from 'next'
import '@/app/globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
    title: 'GTI Sales Dashboard',
    description:
        'Gulbahar Tobacco International Sales Dashboard – Monitor sales performance, track inventory, and analyze business data in real-time. Empowering efficient decision-making for one of the leading tobacco manufacturers in the UAE.',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <head>
                {/* ✅ Add PWA manifest link */}
                <link rel="manifest" href="/manifest.json" />

                {/* ✅ Add recommended PWA meta tags */}
                <meta name="theme-color" content="#000000" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />

                {/* ✅ Add favicon and PWA icon */}
                <link rel="icon" href="/favicon.ico" />
                <link
                    rel="apple-touch-icon"
                    sizes="192x192"
                    href="/images/gulbahar-logodark.png"
                />
            </head>
            <body className="bg-gray-400 font-plus-jakarta text-sm/[22px] font-normal text-gray antialiased">
                {children}
                <Toaster position="top-center" reverseOrder={false} />
            </body>
        </html>
    )
}
