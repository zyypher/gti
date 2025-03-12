'use client'

import {
    Settings,
    Home,
    X,
    Cigarette,
    Package,
    CircleUserRound,
    FileText,
    ListOrdered,
    MessageCircle,
    LogOut,
} from 'lucide-react'
import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NavLink from '@/components/layout/nav-link'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'

const Sidebar = () => {
    const pathName = usePathname()
    const router = useRouter()

    const toggleSidebarResponsive = () => {
        document.getElementById('sidebar')?.classList.remove('open')
        document.getElementById('overlay')?.classList.toggle('open')
    }

    useEffect(() => {
        if (document?.getElementById('overlay')?.classList?.contains('open')) {
            toggleSidebarResponsive()
        }
    }, [pathName])

    return (
        <>
            <div
                id="overlay"
                className="fixed inset-0 z-30 hidden bg-black/50"
                onClick={toggleSidebarResponsive}
            ></div>
            <Card
                id="sidebar"
                className="sidebar fixed -left-[260px] top-0 z-40 flex h-screen w-[260px] flex-col rounded-none transition-all duration-300 lg:left-0 lg:top-16 lg:h-[calc(100vh_-_64px)]"
            >
                <div className="flex items-start justify-between border-b border-gray-300 px-4 py-5 lg:hidden">
                    <Link href="/" className="inline-block">
                        <img
                            src="/images/gulbahar-logodark.svg"
                            alt="Logo"
                            className="h-auto w-auto"
                        />
                    </Link>
                    <button type="button" onClick={toggleSidebarResponsive}>
                        <X className="-mr-2 -mt-2 ml-auto size-4 hover:text-black" />
                    </button>
                </div>

                {/* SIDEBAR NAVIGATION */}
                <div className="grow overflow-y-auto overflow-x-hidden px-2.5 pb-10 pt-2.5 transition-all">
                    <NavLink href="/" className={`nav-link`}>
                        <Home className="size-[18px] shrink-0" />
                        <span>Dashboard</span>
                    </NavLink>

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        Catalog
                    </h3>
                    <NavLink href="/brands" className={`nav-link`}>
                        <Package className="size-[18px] shrink-0" />
                        <span>Brands</span>
                    </NavLink>
                    <NavLink href="/products" className={`nav-link`}>
                        <Cigarette className="size-[18px] shrink-0" />
                        <span>Products</span>
                    </NavLink>
                    <NavLink href="/promotions" className={`nav-link`}>
                        <FileText className="size-[18px] shrink-0" />
                        <span>Promotions</span>
                    </NavLink>
                    <NavLink href="/generated-pdfs" className={`nav-link`}>
                        <FileText className="size-[18px] shrink-0" />
                        <span>Generated PDFs</span>
                    </NavLink>
                    <NavLink href="/orders" className={`nav-link`}>
                        <ListOrdered className="size-[18px] shrink-0" />
                        <span>Orders</span>
                    </NavLink>
                    <NavLink href="/notifications" className={`nav-link`}>
                        <MessageCircle className="size-[18px] shrink-0" />
                        <span>Notifications</span>
                    </NavLink>

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        Configuration
                    </h3>
                    <NavLink href="/setting" className={`nav-link`}>
                        <Settings className="size-[18px] shrink-0" />
                        <span>Settings</span>
                    </NavLink>
                    <NavLink href="/users" className={`nav-link`}>
                        <CircleUserRound className="size-[18px] shrink-0" />
                        <span>Users</span>
                    </NavLink>
                </div>

                {/* MOBILE ONLY PROFILE & LOGOUT */}
                <div className="border-t border-gray-300 px-4 py-5 lg:hidden">
                    <Link
                        href="/setting"
                        className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700 hover:text-black"
                    >
                        <CircleUserRound className="size-[18px]" />
                        Profile
                    </Link>
                    <button
                        type="button"
                        onClick={async () => {
                            await logout()
                            router.push('/login')
                            console.log('Logging out...')
                        }}
                        className="flex w-full items-center gap-2 py-2 text-sm font-medium text-gray-700 hover:text-black"
                    >
                        <LogOut className="size-[18px]" />
                        Sign Out
                    </button>
                </div>
            </Card>
        </>
    )
}

export default Sidebar
