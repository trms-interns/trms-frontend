import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { mockFacilities, mockAuditLog, mockReferrals } from '../../data/mockData'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import {
    IconServer,
    IconPlus,
    IconEdit,
    IconCircleCheck,
    IconCircleX,
    IconShield,
    IconUser,
    IconSearch,
    IconChartBar,
    IconDownload,
} from '@tabler/icons-react'

export default function SysAdminDashboard() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const [tab, setTab] = useState<'facilities' | 'audit' | 'reports'>('facilities')
    const [showAddFacility, setShowAddFacility] = useState(false)
    const [auditSearch, setAuditSearch] = useState('')

    const filteredAudit = mockAuditLog.filter(a =>
        auditSearch === '' || a.user.toLowerCase().includes(auditSearch.toLowerCase()) || a.action.toLowerCase().includes(auditSearch.toLowerCase()) || a.recordId.toLowerCase().includes(auditSearch.toLowerCase())
    )

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`

    // Report data — all facilities
    const stats = {
        totalFacilities: mockFacilities.length,
        totalReferrals: mockReferrals.length,
        accepted: mockReferrals.filter(r => r.status === 'accepted').length,
        rejected: mockReferrals.filter(r => r.status === 'rejected').length,
        completed: mockReferrals.filter(r => r.status === 'completed').length,
        pending: mockReferrals.filter(r => ['pending', 'synced'].includes(r.status)).length,
    }

    const handleExportCSV = () => {
        const rows = [
            ['Facility', 'Location', 'Type', 'Departments', 'Last Sync'],
            ...mockFacilities.map(f => [f.name, f.location, f.type, f.departments.length, f.lastSync])
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `system-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('sa.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Regional Health Bureau — System-wide Management
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setTab('facilities')} className={tabCls(tab === 'facilities')}>
                        <span className="flex items-center gap-1.5"><IconServer size={14} />{t('sa.facilities')}</span>
                    </button>
                    <button onClick={() => setTab('audit')} className={tabCls(tab === 'audit')}>
                        <span className="flex items-center gap-1.5"><IconShield size={14} />{t('sa.auditLogs')}</span>
                    </button>
                    <button onClick={() => setTab('reports')} className={tabCls(tab === 'reports')}>
                        <span className="flex items-center gap-1.5"><IconChartBar size={14} />{t('nav.reports')}</span>
                    </button>
                </div>
            </div>

            {/* ── FACILITIES TAB ──────────────────────────────────────────── */}
            {tab === 'facilities' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">{t('sa.facilities')} ({mockFacilities.length})</h3>
                        <button onClick={() => setShowAddFacility(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors">
                            <IconPlus size={13} /> {t('sa.addFacility')}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.name')}</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Location</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Type</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Departments</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Last Sync</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockFacilities.map(f => (
                                    <tr key={f.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {f.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="font-medium">{f.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-surface-400">{f.location}</td>
                                        <td className="py-3 text-surface-400">{f.type}</td>
                                        <td className="py-3">{f.departments.length}</td>
                                        <td className="py-3 text-surface-500">{f.lastSync}</td>
                                        <td className="py-3">
                                            <div className="flex gap-1">
                                                <button className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}><IconEdit size={13} /></button>
                                                <button className={`p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400`}><IconCircleX size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── AUDIT LOGS TAB ──────────────────────────────────────────── */}
            {tab === 'audit' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <IconShield size={14} className="text-primary-400" />
                            {t('sa.auditLogs')}
                        </h3>
                        <div className="relative">
                            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={auditSearch}
                                onChange={e => setAuditSearch(e.target.value)}
                                className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">User</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Action</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Record</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">IP</th>
                                    <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAudit.map(entry => (
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
                                        <td className="py-2.5 text-surface-500 font-mono text-[10px]">{entry.ipAddress || '—'}</td>
                                        <td className="py-2.5 text-surface-500">{entry.timestamp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── REPORTS TAB ────────────────────────────────────────────── */}
            {tab === 'reports' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold">System-wide Report</h3>
                        <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                            <IconDownload size={13} /> {t('ana.exportCSV')}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {Object.entries(stats).map(([key, val]) => (
                            <div key={key} className={`rounded-xl border p-3 text-center ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                <p className="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-xl font-bold mt-1">{val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Facility Modal */}
            {showAddFacility && (
                <Modal
                    title={t('sa.addFacility')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => setShowAddFacility(false)}
                >
                    {/* TODO (Backend Team): POST /api/facilities { name, location, type, contact, facilityAdminId } */}
                    <form onSubmit={(e) => { e.preventDefault(); alert('TODO: POST /api/facilities'); setShowAddFacility(false) }} className="space-y-4">
                        <FormField label="Facility Name" required placeholder="e.g. Mekelle General Hospital" />
                        <FormField label="Location" required placeholder="e.g. Mekelle" />
                        <FormField
                            label="Type"
                            as="select"
                            required
                            options={[
                                { value: 'health_center', label: 'Health Center' },
                                { value: 'primary_hospital', label: 'Primary Hospital' },
                                { value: 'general_hospital', label: 'General Hospital' },
                                { value: 'specialized_hospital', label: 'Specialized / Referral Hospital' },
                            ]}
                        />
                        <FormField label="Contact" placeholder="+251-..." />
                        <div className="flex gap-3 mt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors">Create Facility</button>
                            <button type="button" onClick={() => setShowAddFacility(false)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}
