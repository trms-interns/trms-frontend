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
    const [auditOffset, setAuditOffset] = useState(0)
    const [hasMoreAuditLogs, setHasMoreAuditLogs] = useState(true)

    const fetchAuditLogs = async (reset = false) => {
        if (!reset && !hasMoreAuditLogs) return
        if (!reset && loading) return

        try {
            if (reset) setLoading(true)
            const currentOffset = reset ? 0 : auditOffset
            const data = await trmsApi.getAuditLogs(undefined, 10, currentOffset)
            
            if (reset) {
                setAuditLogs(data)
            } else {
                setAuditLogs(prev => [...prev, ...data])
            }
            
            setAuditOffset(currentOffset + data.length)
            setHasMoreAuditLogs(data.length === 10)
        } catch (error) {
            console.error('Failed to fetch audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchAuditLogs(true)
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
                {loading && auditLogs.length === 0 ? (
                    <p className="text-sm text-surface-500">Loading audit logs...</p>
                ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-surface-500">No audit logs found</p>
                ) : (
                    <div className="overflow-x-auto flex flex-col gap-4">
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
                                {auditLogs.map((entry) => (
                                    <tr key={entry.id} className={`border-b last:border-0 ${isDark ? 'border-surface-700/50' : 'border-surface-100'}`}>
                                        <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-500/15 flex items-center justify-center">
                                                    <IconUser size={10} className="text-primary-400" />
                                                </div>
                                                <span className="font-medium">{entry.user || entry.userId || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-surface-400">{entry.action}</td>
                                        <td className="py-2.5"><code className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-surface-700' : 'bg-surface-100'}`}>{entry.recordId || entry.targetId || '—'}</code></td>
                                        <td className="py-2.5 text-surface-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {hasMoreAuditLogs && (
                            <div className="flex justify-center mt-2">
                                <button 
                                    onClick={() => void fetchAuditLogs()} 
                                    disabled={loading && auditLogs.length > 0}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                                >
                                    {loading && auditLogs.length > 0 ? 'Loading...' : 'Load More Logs'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
