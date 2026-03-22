import React from 'react'
import { Link } from 'react-router-dom' // used by quickActions
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { mockReferrals, referralTrendData } from '../../data/mockData'
import { FileText, Clock, ClipboardList, CheckCircle, Building2, BarChart3 } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Filler, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function Dashboard() {
    const { t } = useLanguage()
    const { isDark } = useTheme()

    // TODO (Backend Team): Replace with API call to fetch recent dashboard activity and statistics
    // E.g. GET /api/dashboard/recent-referrals
    const recentRefs = mockReferrals.slice(0, 5)

    // TODO (Backend Team): Replace referralTrendData with live metrics from the server
    // E.g. GET /api/dashboard/trends
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } } },
            y: { grid: { color: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.6)' }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } } },
        },
    }

    const quickActions = [
        { icon: ClipboardList, label: t('nav.triage'), to: '/', color: 'from-red-500 to-red-600' },
        { icon: Building2, label: t('nav.directory'), to: '/directory', color: 'from-accent-500 to-accent-600' },
        { icon: BarChart3, label: t('nav.analytics'), to: '/analytics', color: 'from-purple-500 to-purple-700' },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('dash.title')}</h2>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={<FileText size={20} />} label={t('dash.totalReferrals')} value={248} trend="12% vs last week" trendUp={true} color="from-primary-500 to-primary-700" />
                <StatCard icon={<Clock size={20} />} label={t('dash.pendingSync')} value={3} trend="2 less than yesterday" trendUp={false} color="from-amber-500 to-amber-600" />
                <StatCard icon={<ClipboardList size={20} />} label={t('dash.activeTriage')} value={7} color="from-red-500 to-red-600" />
                <StatCard icon={<CheckCircle size={20} />} label={t('dash.completedToday')} value={14} trend="18% more than avg" trendUp={true} color="from-accent-500 to-accent-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className={`lg:col-span-2 rounded-2xl p-5 border ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`}>
                    <h3 className="text-sm font-semibold mb-4">{t('dash.referralTrend')}</h3>
                    <div className="h-56">
                        <Line data={referralTrendData} options={chartOptions} />
                    </div>
                </div>

                {/* Quick actions */}
                <div className={`rounded-2xl p-5 border ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`}>
                    <h3 className="text-sm font-semibold mb-4">{t('dash.quickActions')}</h3>
                    <div className="space-y-3">
                        {quickActions.map(qa => (
                            <Link
                                key={qa.to}
                                to={qa.to}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isDark ? 'bg-surface-850 hover:bg-surface-700/60' : 'bg-surface-50 hover:bg-surface-100'}`}
                            >
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${qa.color} flex items-center justify-center text-white`}>
                                    <qa.icon size={16} />
                                </div>
                                <span className="text-sm font-medium">{qa.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent activity */}
            <div className={`rounded-2xl p-5 border ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">{t('dash.recentActivity')}</h3>
                </div>
                <div className="space-y-3">
                    {recentRefs.map((ref, i) => (
                        <div
                            key={ref.id}
                            className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-surface-700/40' : 'hover:bg-surface-50'}`}
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${ref.priority === 'emergency' ? 'bg-red-500' : ref.priority === 'urgent' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                {ref.patientName.split(' ').map(w => w[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{ref.patientName}</p>
                                <p className="text-xs text-surface-500 truncate">{ref.chiefComplaint}</p>
                            </div>
                            <StatusBadge type="priority" value={ref.priority} />
                            <StatusBadge type="sync" value={ref.status} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
