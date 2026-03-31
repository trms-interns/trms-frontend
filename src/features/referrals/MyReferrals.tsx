import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { mockReferrals, mockDischargeSummaries } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import {
    IconClipboardList,
    IconSearch,
    IconFileText,
} from '@tabler/icons-react'

export default function MyReferrals() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const [filter, setFilter] = useState<string>('all')
    const [selected, setSelected] = useState<string | null>(null)

    // TODO (Backend Team): GET /api/referrals?createdBy={userId}&status={filter}
    const myRefs = mockReferrals.filter(r => {
        if (filter !== 'all' && r.status !== filter) return false
        return true
    })

    const selectedRef = mockReferrals.find(r => r.id === selected)
    const selectedDS = selectedRef ? mockDischargeSummaries.find(ds => ds.referralId === selectedRef.id) : null

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const filterCls = (v: string) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === v
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{t('mr.title')}</h2>
                <div className="flex gap-1 flex-wrap">
                    {['all', 'pending', 'synced', 'accepted', 'completed', 'rejected'].map(v => (
                        <button key={v} onClick={() => setFilter(v)} className={filterCls(v)}>
                            {v === 'all' ? t('mr.all') : v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* List */}
                <div className="lg:col-span-2 space-y-2">
                    <div className={card}>
                        <div className="flex items-center gap-2 mb-3">
                            <IconClipboardList size={15} className="text-primary-400" />
                            <span className="text-sm font-semibold">{myRefs.length} referrals</span>
                        </div>
                        {myRefs.length === 0 ? (
                            <p className="text-sm text-surface-500 text-center py-8">{t('mr.empty')}</p>
                        ) : (
                            <div className="space-y-2">
                                {myRefs.map(ref => (
                                    <button
                                        key={ref.id}
                                        onClick={() => setSelected(ref.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selected === ref.id
                                            ? isDark ? 'border-primary-500/60 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                                            : isDark ? 'border-surface-800 bg-surface-950 hover:border-surface-700' : 'border-surface-200 hover:border-surface-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold truncate pr-2">{ref.patientName}</span>
                                            <StatusBadge type="priority" value={ref.priority} />
                                        </div>
                                        <p className={`text-xs truncate ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{ref.chiefComplaint}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <StatusBadge type="sync" value={ref.status} />
                                            <span className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{ref.date}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail */}
                <div className="lg:col-span-3">
                    {selectedRef ? (
                        <div className={card}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold">{selectedRef.patientName}</h3>
                                    <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{selectedRef.mrn} · {selectedRef.age}y, {selectedRef.sex}</p>
                                </div>
                                <div className="flex gap-2">
                                    <StatusBadge type="priority" value={selectedRef.priority} />
                                    <StatusBadge type="sync" value={selectedRef.status} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">{t('ref.chiefComplaint')}</p>
                                    <p className="text-sm mt-0.5">{selectedRef.chiefComplaint}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">{t('ref.clinicalSummary')}</p>
                                    <p className={`text-sm mt-0.5 leading-relaxed ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>{selectedRef.clinicalSummary}</p>
                                </div>
                                {selectedRef.primaryDiagnosis && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">{t('ref.primaryDiagnosis')}</p>
                                        <p className="text-sm mt-0.5">{selectedRef.primaryDiagnosis}</p>
                                    </div>
                                )}
                                <div className={`flex gap-4 text-xs ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                                    <span>{t('ref.referringFacility')}: <strong className={isDark ? 'text-surface-300' : 'text-surface-700'}>{selectedRef.referringFacility}</strong></span>
                                    <span>→ <strong className={isDark ? 'text-surface-300' : 'text-surface-700'}>{selectedRef.receivingFacility}</strong></span>
                                </div>
                            </div>

                            {/* Discharge summary if completed */}
                            {selectedDS && (
                                <div className={`mt-5 p-4 rounded-xl border ${isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <IconFileText size={14} className="text-emerald-500" />
                                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Discharge Summary</p>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <p><strong>Final Diagnosis:</strong> {selectedDS.finalDiagnosis}</p>
                                        <p><strong>Treatment:</strong> {selectedDS.treatmentSummary}</p>
                                        <p><strong>Medications:</strong> {selectedDS.medicationsPrescribed}</p>
                                        <p><strong>Follow-up:</strong> {selectedDS.followUpInstructions}</p>
                                        <p className="text-surface-500">Discharged: {selectedDS.dischargeDate} · By: {selectedDS.createdByName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`${card} text-center py-16`}>
                            <IconClipboardList size={32} className="mx-auto text-surface-500 mb-3" />
                            <p className="text-sm text-surface-500">Select a referral to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
