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
    LogOut,
    Megaphone,
    Bell,
    Briefcase,
} from 'lucide-react'
import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NavLink from '@/components/layout/nav-link'
import { logout } from '@/lib/auth'
import { useUserRole } from '@/hooks/useUserRole'

const Sidebar = () => {
    const pathName = usePathname()
    const router = useRouter()
    const role = useUserRole()
    const CART_KEY = 'gti-products-cart'

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
            {/* overlay for mobile drawer */}
            <div
                id="overlay"
                className="fixed inset-0 z-40 hidden bg-black/50"
                onClick={toggleSidebarResponsive}
            />

            {/* drawer / sidebar */}
            <Card
                id="sidebar"
                className="
          sidebar fixed -left-[260px] top-0 z-50 flex h-screen w-[260px] flex-col rounded-none
          border-r border-black/5 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm
          transition-all duration-300
          lg:left-0 lg:top-16 lg:h-[calc(100vh_-_64px)]
        "
            >
                {/* mobile header (inside drawer) */}
                <div className="flex items-start justify-between border-b border-gray-200 px-4 py-5 lg:hidden">
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

                {/* nav */}
                <div className="grow overflow-y-auto overflow-x-hidden px-2.5 pb-10 pt-2.5">
                    <NavLink href="/" className="nav-link">
                        <Home className="size-[18px] shrink-0" />
                        <span>Dashboard</span>
                    </NavLink>

                    <h3 className="mt-2.5 rounded-lg bg-gray-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Catalog
                    </h3>

                    <NavLink href="/brands" className="nav-link">
                        <Package className="size-[18px] shrink-0" />
                        <span>Brands</span>
                    </NavLink>

                    <NavLink href="/products" className="nav-link">
                        <Cigarette className="size-[18px] shrink-0" />
                        <span>Products</span>
                    </NavLink>

                    <NavLink href="/non-product-pages" className="nav-link">
                        <Megaphone className="size-[18px] shrink-0" />
                        <span>Non Product Pages</span>
                    </NavLink>

                    <NavLink href="/generated-pdfs" className="nav-link">
                        <FileText className="size-[18px] shrink-0" />
                        <span>Generated PDFs</span>
                    </NavLink>

                    <NavLink href="/orders" className="nav-link">
                        <ListOrdered className="size-[18px] shrink-0" />
                        <span>Orders</span>
                    </NavLink>

                    <NavLink href="/notifications" className="nav-link">
                        <Bell className="size-[18px] shrink-0" />
                        <span>Notifications</span>
                    </NavLink>

                    <h3 className="mt-2.5 rounded-lg bg-gray-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Configuration
                    </h3>

                    <NavLink href="/setting" className="nav-link">
                        <Settings className="size-[18px] shrink-0" />
                        <span>Settings</span>
                    </NavLink>

                    {role === 'ADMIN' && (
                        <NavLink href="/users" className="nav-link">
                            <CircleUserRound className="size-[18px] shrink-0" />
                            <span>Users</span>
                        </NavLink>
                    )}

                    <NavLink href="/clients" className="nav-link">
                        <Briefcase className="size-[18px] shrink-0" />
                        <span>Clients</span>
                    </NavLink>
                </div>

                {/* mobile-only profile & logout */}
                <div className="border-t border-gray-200 px-4 py-5 lg:hidden">
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
                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem(CART_KEY)
                            }
                            router.push('/login')
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
