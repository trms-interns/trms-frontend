import React, { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useReferrals } from '../../context/ReferralContext'
import { trmsApi } from '../../lib/trmsApi'
import StatCard from '../../components/StatCard'
import {
    IconChartBar,
    IconClock,
    IconRefresh,
    IconShield,
    IconUser,
    IconFileText,
} from '@tabler/icons-react'

export default function Analytics() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { referrals } = useReferrals()
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAuditLogs = async () => {
            try {
                const data = await trmsApi.getAuditLogs()
                setAuditLogs(data)
            } catch (error) {
                console.error('Failed to fetch audit logs:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAuditLogs()
    }, [])

    // Calculate stats from real referral data
    const totalMonth = referrals.length
    const rejected = referrals.filter(r => r.status === 'rejected').length
    const rejectionRate = totalMonth > 0 ? Math.round((rejected / totalMonth) * 100) : 0

    const cardClass = `rounded-2xl border p-5 ${isDark ? 'bg-surface-800/60 border-surface-700/50' : 'bg-white border-surface-200'}`

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('ana.title')}</h2>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<IconFileText size={20} />} label={t('ana.totalMonth')} value={totalMonth} color="from-primary-500 to-primary-700" />
                <StatCard icon={<IconClock size={20} />} label={t('ana.avgTriageTime')} value="—" color="from-amber-500 to-amber-600" />
                <StatCard icon={<IconRefresh size={20} />} label={t('ana.feedbackRate')} value={`${rejectionRate}%`} color="from-accent-500 to-accent-600" />
            </div>

            {/* Audit log */}
            <div className={cardClass}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <IconShield size={14} className="text-primary-400" />
                    {t('ana.complianceAudit')}
                </h3>
                {loading ? (
                    <p className="text-sm text-surface-500">Loading audit logs...</p>
                ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-surface-500">No audit logs found</p>
                ) : (
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
                                {auditLogs.slice(0, 10).map((entry) => (
                                    <tr key={entry.id} className={`border-b last:border-0 ${isDark ? 'border-surface-700/50' : 'border-surface-100'}`}>
                                        <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-500/15 flex items-center justify-center">
                                                    <IconUser size={10} className="text-primary-400" />
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
                )}
            </div>
        </div>
    )
}
