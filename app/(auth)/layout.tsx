import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <Sidebar />
            {/* header = h-16 (64px) */}
            <div id="main-content" className="mt-16 p-4 transition-all lg:ml-[260px]">
                {children}
            </div>
        </>
    )
}
