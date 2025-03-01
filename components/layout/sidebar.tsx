'use client'
import React, { useEffect, useState } from 'react'
import {
    Accordion
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import {
    ChevronDown,
    Minus,
    Settings,
    Home,
    X,
    Cigarette,
    Package,
    CircleUserRound,
    FileText,
    ListOrdered
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import NavLink from '@/components/layout/nav-link'

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathName = usePathname()

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
            mainContent.style.marginLeft = isSidebarOpen ? '260px' : '60px' // Adjust this value as needed
        }
    }

    const toggleSidebarResponsive = () => {
        document.getElementById('sidebar')?.classList.remove('open')
        document.getElementById('overlay')?.classList.toggle('open')
    }

    const isOpen = () => {
        if (['/blog-list', '/blog-details', '/add-blog'].includes(pathName)) {
            return 'item-2'
        } else if (
            [
                '/',
                '/crypto-dashboard',
                '/product-card',
                '/add-product',
                '/product-details',
                '/product-checkout',
            ].includes(pathName)
        ) {
            return 'item-1'
        } else if (
            ['/invoice', '/invoice-details', '/create-invoice'].includes(
                pathName,
            )
        ) {
            return 'item-3'
        } else if (
            [
                '/accordion-page',
                '/alert',
                '/alert-dialog',
                '/avatar',
                '/breadcrumbs',
                '/buttons',
                '/card-page',
                '/carousel',
                '/dropdown',
                '/empty-stats',
                '/hover-card',
                '/modal',
                '/popover',
                '/scroll-area',
                '/sonner',
                '/tabs',
                '/tag',
                '/toasts',
                '/toggle-group',
                '/tooltip',
            ].includes(pathName)
        ) {
            return 'item-4'
        } else if (
            [
                '/checkbox',
                '/combobox',
                '/command',
                '/form',
                '/inputs',
                '/input-otp',
            ].includes(pathName)
        ) {
            return 'item-5'
        } else {
            return ''
        }
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
                className={`sidebar fixed -left-[260px] top-0 z-40 flex h-screen w-[260px] flex-col rounded-none transition-all duration-300 lg:left-0 lg:top-16 lg:h-[calc(100vh_-_64px)] ${isSidebarOpen ? 'closed' : ''}`}
            >
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="absolute -right-2.5 -top-3.5 hidden size-6 place-content-center rounded-full border border-gray-300 bg-white text-black lg:grid"
                >
                    <ChevronDown
                        className={`h-4 w-4 rotate-90 ${isSidebarOpen ? 'hidden' : ''}`}
                    />
                    <ChevronDown
                        className={`hidden h-4 w-4 -rotate-90 ${isSidebarOpen ? '!block' : ''}`}
                    />
                </button>
                <div className="flex items-start justify-between border-b border-gray-300 px-4 py-5 lg:hidden">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/images/gulbahar-logodark.svg"
                            width={145}
                            height={34}
                            alt="Logo"
                            className="h-auto w-auto"
                        />
                    </Link>
                    <button type="button" onClick={toggleSidebarResponsive}>
                        <X className="-mr-2 -mt-2 ml-auto size-4 hover:text-black" />
                    </button>
                </div>
                <Accordion
                    type="single"
                    defaultValue={isOpen()}
                    collapsible
                    className="sidemenu grow overflow-y-auto overflow-x-hidden px-2.5 pb-10 pt-2.5 transition-all"
                    key={pathName}
                >
                    <NavLink href="/" className={`nav-link`}>
                        <Home className="size-[18px] shrink-0" />
                        <span>Dashboard</span>
                    </NavLink>

                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>Catalog</span>
                        <Minus className="hidden h-4 w-5 text-gray" />
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
                        <ListOrdered className="size-[18px] shrink-0" />
                        <span>Notifications</span>
                    </NavLink>
                    <h3 className="mt-2.5 whitespace-nowrap rounded-lg bg-gray-400 px-5 py-2.5 text-xs/tight font-semibold uppercase text-black">
                        <span>Configuration</span>
                        <Minus className="hidden h-4 w-5 text-gray" />
                    </h3>

                    <NavLink
                        href="/setting"
                        className={`nav-link ${pathName === '/setting' && '!text-black'}`}
                    >
                        <Settings className="size-[18px] shrink-0" />
                        <span>Settings</span>
                    </NavLink>
                    <NavLink
                        href="/users"
                        className={`nav-link ${pathName === '/setting' && '!text-black'}`}
                    >
                        <CircleUserRound className="size-[18px] shrink-0" />
                        <span>Users</span>
                    </NavLink>
                </Accordion>
            </Card>
        </>
    )
}

export default Sidebar
