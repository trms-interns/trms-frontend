import React, { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { trmsApi, type ApiFacility, type ApiUser } from '../../lib/trmsApi'
import { useReferrals } from '../../context/ReferralContext'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import {
    IconBuilding,
    IconPlus,
    IconEdit,
    IconCircleCheck,
    IconCircleX,
    IconAlertTriangle,
    IconClock,
    IconChartBar,
    IconDownload,
    IconSettings,
} from '@tabler/icons-react'

export default function FacilityAdminDashboard() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals } = useReferrals()
    const [tab, setTab] = useState<'departments' | 'service' | 'reports'>('departments')
    const [showAddDept, setShowAddDept] = useState(false)
    const [facilities, setFacilities] = useState<ApiFacility[]>([])
    const [users, setUsers] = useState<ApiUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [facilitiesData, usersData] = await Promise.all([
                    trmsApi.getFacilities(),
                    trmsApi.getUsers(user?.facilityId),
                ])
                setFacilities(facilitiesData)
                setUsers(usersData)
            } catch (error) {
                console.error('Failed to fetch facility data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [user?.facilityId])

    const facility = facilities.find(f => f.id === user?.facilityId) || facilities[0]
    const facilityUsers = users

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`

    const statusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
        available: { icon: <IconCircleCheck size={11} />, cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
        limited: { icon: <IconClock size={11} />, cls: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
        unavailable: { icon: <IconCircleX size={11} />, cls: 'bg-red-500/15 text-red-500 border-red-500/25' },
    }

    // Report stats
    const facilityRefs = referrals
    const stats = {
        sent: facilityRefs.filter(r => r.referringFacility === facility?.name).length,
        received: facilityRefs.filter(r => r.receivingFacility === facility?.name).length,
        accepted: facilityRefs.filter(r => r.status === 'accepted').length,
        rejected: facilityRefs.filter(r => r.status === 'rejected').length,
        forwarded: facilityRefs.filter(r => r.status === 'forwarded').length,
        completed: facilityRefs.filter(r => r.status === 'completed').length,
    }

    const handleExportCSV = () => {
        const rows = [
            ['Metric', 'Count'],
            ['Sent', stats.sent],
            ['Received', stats.received],
            ['Accepted', stats.accepted],
            ['Rejected', stats.rejected],
            ['Forwarded', stats.forwarded],
            ['Completed', stats.completed],
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `facility-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('fa.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {facility.name} — {facility.location}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setTab('departments')} className={tabCls(tab === 'departments')}>
                        <span className="flex items-center gap-1.5"><IconBuilding size={14} />{t('fa.departments')}</span>
                    </button>
                    <button onClick={() => setTab('service')} className={tabCls(tab === 'service')}>
                        <span className="flex items-center gap-1.5"><IconSettings size={14} />{t('nav.serviceStatus')}</span>
                    </button>
                    <button onClick={() => setTab('reports')} className={tabCls(tab === 'reports')}>
                        <span className="flex items-center gap-1.5"><IconChartBar size={14} />{t('nav.reports')}</span>
                    </button>
                </div>
            </div>

            {/* ── DEPARTMENTS TAB ────────────────────────────────────────── */}
            {tab === 'departments' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">{t('fa.departments')} ({facility.services?.length || 0})</h3>
                        <button onClick={() => setShowAddDept(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors">
                            <IconPlus size={13} /> {t('fa.addDept')}
                        </button>
                    </div>
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.name')}</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.status')}</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Note</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facility.services?.map(dept => {
                                        const sc = statusConfig[dept.status]
                                        return (
                                            <tr key={dept.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                                <td className="py-3 font-medium">{dept.serviceType}</td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>{sc.icon} {dept.status}</span>
                                                </td>
                                                <td className="py-3 text-surface-500">
                                                    {dept.estimatedDelayDays ? `${dept.estimatedDelayDays}d delay` : '—'}
                                                </td>
                                                <td className="py-3">
                                                    <button className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}>
                                                        <IconEdit size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── SERVICE STATUS TAB ─────────────────────────────────────── */}
            {tab === 'service' && (
                <div className={card}>
                    <h3 className="text-sm font-bold mb-4">{t('dir.serviceStatus')} — {facility.name}</h3>
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading...</p>
                    ) : (
                        <div className="space-y-2">
                            {facility.services?.map(dept => {
                                const sc = statusConfig[dept.status]
                                return (
                                    <div key={dept.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{dept.serviceType}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>{sc.icon} {dept.status}</span>
                                        {/* TODO (Backend Team): PATCH /api/services/{dept.id} { status, estimated_delay_days } */}
                                        <select
                                            defaultValue={dept.status}
                                            className={`px-2 py-1 rounded-lg text-[11px] border outline-none ${isDark ? 'bg-surface-900 border-surface-700 text-surface-300' : 'bg-white border-surface-200 text-surface-700'}`}
                                            onChange={(e) => alert(`TODO: Update ${dept.serviceType} to ${e.target.value}`)}
                                        >
                                            <option value="available">Available</option>
                                            <option value="limited">Limited</option>
                                            <option value="unavailable">Unavailable</option>
                                        </select>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── REPORTS TAB ────────────────────────────────────────────── */}
            {tab === 'reports' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold">Monthly Report — {facility.name}</h3>
                        <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                            <IconDownload size={13} /> {t('ana.exportCSV')}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {Object.entries(stats).map(([key, val]) => (
                            <div key={key} className={`rounded-xl border p-3 text-center ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                <p className="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">{key}</p>
                                <p className="text-xl font-bold mt-1">{val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Department Modal */}
            {showAddDept && (
                <Modal
                    title={t('fa.addDept')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => setShowAddDept(false)}
                >
                    {/* TODO (Backend Team): POST /api/departments { name, facilityId, headId } */}
                    <form onSubmit={(e) => { e.preventDefault(); alert('TODO: POST /api/departments'); setShowAddDept(false) }} className="space-y-4">
                        <FormField label="Department Name" required placeholder="e.g. Oncology" />
                        <FormField
                            label="Assign Department Head"
                            as="select"
                            options={facilityUsers.filter(u => ['Doctor', 'Department Head'].includes(u.role)).map(u => ({ value: u.id, label: u.fullName }))}
                        />
                        <div className="flex gap-3 mt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors">Create Department</button>
                            <button type="button" onClick={() => setShowAddDept(false)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}
