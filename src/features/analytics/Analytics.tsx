import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import StatCard from '../../components/StatCard'
import { mockAuditLog, referralVolumeData, topReasonsData, rejectionRateData } from '../../data/mockData'
import { BarChart3, Clock, RefreshCw, Shield, User, FileText } from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Filler, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

export default function Analytics() {
    const { t } = useLanguage()
    const { isDark } = useTheme()

    const baseChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } } },
            y: { grid: { color: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.6)' }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } } },
        },
    }

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 }, padding: 15, usePointStyle: true },
            },
        },
    }

    const cardClass = `rounded-2xl border p-5 ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('ana.title')}</h2>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<FileText size={20} />} label={t('ana.totalMonth')} value={210} trend="11% vs last month" trendUp={true} color="from-primary-500 to-primary-700" />
                <StatCard icon={<Clock size={20} />} label={t('ana.avgTriageTime')} value="2.4h" color="from-amber-500 to-amber-600" />
                <StatCard icon={<RefreshCw size={20} />} label={t('ana.feedbackRate')} value="73%" trend="5% improvement" trendUp={true} color="from-accent-500 to-accent-600" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Referral volume */}
                <div className={cardClass}>
                    <h3 className="text-sm font-semibold mb-4">{t('ana.referralVolume')}</h3>
                    <div className="h-56">
                        <Line data={referralVolumeData} options={baseChartOptions} />
                    </div>
                </div>

                {/* Top reasons */}
                <div className={cardClass}>
                    <h3 className="text-sm font-semibold mb-4">{t('ana.topReasons')}</h3>
                    <div className="h-56">
                        <Bar data={topReasonsData} options={{
                            ...baseChartOptions,
                            indexAxis: 'y' as const,
                            scales: {
                                ...baseChartOptions.scales,
                                x: { ...baseChartOptions.scales.x, grid: { color: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.6)' } },
                                y: { ...baseChartOptions.scales.y, grid: { display: false } },
                            },
                        }} />
                    </div>
                </div>
            </div>

            {/* Rejection rate + audit */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Doughnut */}
                <div className={`lg:col-span-2 ${cardClass}`}>
                    <h3 className="text-sm font-semibold mb-4">{t('ana.rejectionRate')}</h3>
                    <div className="h-64">
                        <Doughnut data={rejectionRateData} options={doughnutOptions} />
                    </div>
                </div>

                {/* Audit log */}
                <div className={`lg:col-span-3 ${cardClass}`}>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Shield size={14} className="text-primary-400" />
                        {t('ana.complianceAudit')}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">User</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Action</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Record</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockAuditLog.map((entry, i) => (
                                    <tr key={entry.id} className={`border-b last:border-0 ${isDark ? 'border-surface-700/50' : 'border-surface-100'}`}>
                                        <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-500/15 flex items-center justify-center">
                                                    <User size={10} className="text-primary-400" />
                                                </div>
                                                <span className="font-medium">{entry.user}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-surface-400">{entry.action}</td>
                                        <td className="py-2.5"><code className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-surface-700' : 'bg-surface-100'}`}>{entry.recordId}</code></td>
                                        <td className="py-2.5 text-surface-500">{entry.timestamp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
