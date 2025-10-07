'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PageHeading from '@/components/layout/page-heading'
import { Card } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { Users, Package, FileText, Image, Database, Share2 } from 'lucide-react'
import DashboardSkeleton from '@/components/DashboardSkeleton'

/** Small reusable glass card */
const GlassCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={[
        'rounded-2xl border border-white/20 bg-white/10',
        'backdrop-blur-xl shadow-[0_6px_24px_rgba(0,0,0,0.08)]',
        'hover:shadow-[0_12px_36px_rgba(0,0,0,0.10)] transition-shadow',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

/** Stateless KPI tile */
const Kpi = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) => {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-800">
          <div className="rounded-xl bg-white/30 p-2 border border-white/40">
            {icon}
          </div>
          <span className="text-sm font-medium text-zinc-700">{label}</span>
        </div>
        <span className="text-3xl font-semibold tracking-tight text-zinc-900">
          {value}
        </span>
      </div>
    </GlassCard>
  )
}

const Home = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBrands: 0,
    totalProducts: 0,
    totalBanners: 0,
    totalAds: 0,
    totalSharedPdfs: 0,
    totalOrders: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoadingStats(false)
    }
  }

  const data = [
    { name: 'Users', value: stats.totalUsers },
    { name: 'Brands', value: stats.totalBrands },
    { name: 'Products', value: stats.totalProducts },
    { name: 'Corporate Info', value: stats.totalBanners },
    { name: 'Ads', value: stats.totalAds },
    { name: 'Generated PDFs', value: stats.totalSharedPdfs },
    { name: 'Orders', value: stats.totalOrders },
  ]

  return (
    <div className="relative">
      {/* Background: soft gradient + radial light */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),rgba(255,255,255,0)_60%)]" />
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Dashboard
            </h1>
          </div>
        </div>

        {loadingStats ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Kpi
                icon={<Users size={18} className="text-zinc-800" />}
                label="Users"
                value={stats.totalUsers}
              />
              <Kpi
                icon={<FileText size={18} className="text-zinc-800" />}
                label="Brands"
                value={stats.totalBrands}
              />
              <Kpi
                icon={<Package size={18} className="text-zinc-800" />}
                label="Products"
                value={stats.totalProducts}
              />
              <Kpi
                icon={<Image size={18} className="text-zinc-800" />}
                label="Corporate Info"
                value={stats.totalBanners}
              />
              <Kpi
                icon={<Image size={18} className="text-zinc-800" />}
                label="Ads"
                value={stats.totalAds}
              />
              <Kpi
                icon={<Database size={18} className="text-zinc-800" />}
                label="Generated PDFs"
                value={stats.totalSharedPdfs}
              />
              <Kpi
                icon={<Share2 size={18} className="text-zinc-800" />}
                label="Orders"
                value={stats.totalOrders}
              />
           
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bar */}
              <GlassCard className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-zinc-900">
                    Statistics Overview
                  </h3>
                  <span className="rounded-full border border-white/30 bg-white/40 px-2 py-0.5 text-xs text-zinc-700">
                    Live
                  </span>
                </div>
                <div className="rounded-xl border border-white/30 bg-white/30 p-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                      <CartesianGrid stroke="#e9e9ee" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#3f3f46', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(8px)',
                        }}
                      />
                      <Bar dataKey="value" fill="#111827" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Line */}
              <GlassCard className="p-5">
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-zinc-900">
                    Growth Snapshot
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Simple trend preview across your top counters.
                  </p>
                </div>
                <div className="rounded-xl border border-white/30 bg-white/30 p-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                      <CartesianGrid stroke="#e9e9ee" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#3f3f46', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(8px)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Home
