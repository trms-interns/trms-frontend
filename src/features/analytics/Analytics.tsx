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
    IconSearch,
    IconDownload,
} from '@tabler/icons-react'

export default function Analytics() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { referrals } = useReferrals()
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [auditOffset, setAuditOffset] = useState(0)
    const [hasMoreAuditLogs, setHasMoreAuditLogs] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchAuditLogs = async (reset = false) => {
        if (!reset && !hasMoreAuditLogs) return
        if (!reset && loading) return

        try {
            if (reset) setLoading(true)
            const currentOffset = reset ? 0 : auditOffset
            // If searchQuery looks like a UUID, we can pass it to the backend
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery)
            const data = await trmsApi.getAuditLogs(isUuid ? searchQuery : undefined, 10, currentOffset)
            
            setAuditLogs(prev => {
                const combined = reset ? data : [...prev, ...data];
                // Use Map to filter duplicates by ID
                return Array.from(new Map(combined.map(item => [item.id, item])).values());
            });
            
            setAuditOffset(currentOffset + data.length)
            setHasMoreAuditLogs(data.length === 10)
        } catch (error) {
            console.error('Failed to fetch audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExportCsv = () => {
        if (auditLogs.length === 0) return
        
        const headers = ['User', 'Action', 'Record ID', 'Timestamp']
        const rows = auditLogs.map(log => [
            log.userName || log.userId || 'Unknown',
            log.action,
            log.targetId || '',
            log.timestamp ? new Date(log.timestamp).toISOString() : ''
        ])
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredLogs = searchQuery && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery)
        ? auditLogs.filter(log => 
            (log.userName && log.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : auditLogs

    // Grouping logic: Group consecutive logs by same user within 2 minutes
    const groupedLogs: any[] = []
    if (filteredLogs.length > 0) {
        let currentGroup: any = null
        
        filteredLogs.forEach((log) => {
            const logTime = new Date(log.timestamp).getTime()
            
            if (!currentGroup) {
                currentGroup = { ...log, actions: [log.action], ids: [log.id], count: 1, startTime: logTime }
                groupedLogs.push(currentGroup)
            } else {
                const timeDiff = Math.abs(currentGroup.startTime - logTime)
                const sameUser = currentGroup.userId === log.userId
                const isRecent = timeDiff < 2 * 60 * 1000 // 2 minutes window
                
                if (sameUser && isRecent) {
                    if (!currentGroup.actions.includes(log.action)) {
                        currentGroup.actions.push(log.action)
                    }
                    currentGroup.count++
                } else {
                    currentGroup = { ...log, actions: [log.action], ids: [log.id], count: 1, startTime: logTime }
                    groupedLogs.push(currentGroup)
                }
            }
        })
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <IconShield size={14} className="text-primary-400" />
                        {t('ana.complianceAudit')}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                            <input 
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && void fetchAuditLogs(true)}
                                className={`pl-9 pr-4 py-1.5 rounded-lg text-xs border outline-none transition-colors ${isDark ? 'bg-surface-900 border-surface-700 focus:border-primary-500' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                        </div>
                        <button 
                            onClick={handleExportCsv}
                            className={`p-1.5 rounded-lg border transition-colors ${isDark ? 'border-surface-700 hover:bg-surface-800 text-surface-400' : 'border-surface-200 hover:bg-surface-50 text-surface-500'}`}
                            title="Export to CSV"
                        >
                            <IconDownload size={16} />
                        </button>
                    </div>
                </div>
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
                                {groupedLogs.map((group) => (
                                    <tr key={group.id} className={`border-b last:border-0 ${isDark ? 'border-surface-700/50' : 'border-surface-100'}`}>
                                        <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-500/15 flex items-center justify-center">
                                                    <IconUser size={10} className="text-primary-400" />
                                                </div>
                                                <span className="font-medium">{group.userName || group.userId || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-surface-400">
                                            <div className="flex flex-wrap gap-1">
                                                {group.actions.map((act: string, idx: number) => (
                                                    <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${isDark ? 'bg-surface-700 text-surface-300' : 'bg-surface-100 text-surface-600'}`}>
                                                        {act}
                                                    </span>
                                                ))}
                                                {group.count > group.actions.length && (
                                                    <span className="text-[10px] text-surface-500 self-center ml-1">
                                                        (+{group.count - group.actions.length} more)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5">
                                            <code className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-surface-700' : 'bg-surface-100'}`}>
                                                {group.targetId ? group.targetId.slice(0, 8) + '...' : 'Global'}
                                            </code>
                                        </td>
                                        <td className="py-2.5 text-surface-500 text-right whitespace-nowrap">
                                            {new Date(group.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
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
