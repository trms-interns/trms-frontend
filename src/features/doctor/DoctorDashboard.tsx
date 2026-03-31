import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { mockReferrals, mockDischargeSummaries } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import {
    IconStethoscope,
    IconClipboardCheck,
    IconUser,
    IconAlertTriangle,
} from '@tabler/icons-react'

export default function DoctorDashboard() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()

    // Filter referrals to doctor's department (accepted referrals needing attention)
    const deptReferrals = mockReferrals.filter(
        r => r.department === user?.department && ['accepted', 'synced', 'pending'].includes(r.status)
    )
    const completedReferrals = mockReferrals.filter(
        r => r.department === user?.department && r.status === 'completed'
    )

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{t('doc.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {t('doc.dept')}: <strong>{user?.department}</strong>
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <IconAlertTriangle size={12} /> {deptReferrals.length} awaiting review
                    </span>
                </div>
            </div>

            {/* Active referrals for this department */}
            <div className={card}>
                <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/15 text-primary-300' : 'bg-primary-100 text-primary-600'}`}>
                        <IconStethoscope size={15} />
                    </div>
                    <h3 className="text-sm font-bold">Incoming Referrals — {user?.department}</h3>
                </div>

                {deptReferrals.length === 0 ? (
                    <div className="text-center py-10">
                        <IconClipboardCheck size={28} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-sm text-surface-500">No pending referrals for your department</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {deptReferrals.map(ref => (
                            <div key={ref.id} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${isDark ? 'border-surface-800 bg-surface-950 hover:border-surface-700' : 'border-surface-200 bg-surface-50 hover:border-surface-300'}
                                ${ref.priority === 'emergency' ? 'border-l-4 border-l-red-600' : ref.priority === 'urgent' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-[#2b4968]'}`}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${ref.priority === 'emergency' ? 'bg-red-600' : ref.priority === 'urgent' ? 'bg-amber-500' : 'bg-[#2b4968]'}`}>
                                    {ref.patientName.split(' ').map(w => w[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{ref.patientName}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{ref.chiefComplaint}</p>
                                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>From: {ref.referringFacility} · {ref.date}</p>
                                </div>
                                <StatusBadge type="priority" value={ref.priority} />
                                <StatusBadge type="sync" value={ref.status} />
                                {ref.status === 'accepted' && (
                                    <button
                                        onClick={() => alert('TODO: Open discharge summary form for ' + ref.id)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-primary-500/15 text-primary-300 hover:bg-primary-500/25' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}
                                    >
                                        {t('doc.dischargeSummary')}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed referrals with discharge summaries */}
            <div className={card}>
                <h3 className="text-sm font-semibold mb-4">Recently Completed</h3>
                {completedReferrals.length === 0 ? (
                    <p className="text-sm text-surface-500 text-center py-6">{t('common.noData')}</p>
                ) : (
                    <div className="space-y-2">
                        {completedReferrals.map(ref => {
                            const ds = mockDischargeSummaries.find(d => d.referralId === ref.id)
                            return (
                                <div key={ref.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-surface-950' : 'bg-surface-50'}`}>
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                                        <IconClipboardCheck size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ref.patientName}</p>
                                        <p className={`text-[11px] ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                            {ds ? `Discharged ${ds.dischargeDate} — ${ds.finalDiagnosis}` : 'Discharge summary pending'}
                                        </p>
                                    </div>
                                    <StatusBadge type="sync" value="completed" />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
