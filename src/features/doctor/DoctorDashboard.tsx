import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useReferrals } from '../../context/ReferralContext'
import { trmsApi } from '../../lib/trmsApi'
import StatusBadge from '../../components/StatusBadge'
import DashboardMiniChart from '../../components/DashboardMiniChart'
import {
    IconStethoscope,
    IconClipboardCheck,
    IconUser,
    IconAlertTriangle,
    IconSend,
    IconX,
} from '@tabler/icons-react'

export default function DoctorDashboard() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals, dischargeSummaries, completeReferral, refreshReferrals } = useReferrals()
    const [activeReferralId, setActiveReferralId] = useState<string | null>(null)
    const [finalDiagnosis, setFinalDiagnosis] = useState('')
    const [treatmentSummary, setTreatmentSummary] = useState('')
    const [medicationsPrescribed, setMedicationsPrescribed] = useState('')
    const [followUpInstructions, setFollowUpInstructions] = useState('')
    const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().slice(0, 10))
    const [acceptingReferralId, setAcceptingReferralId] = useState<string | null>(null)
    const [acceptError, setAcceptError] = useState('')

    // Filter referrals to doctor's department (accepted referrals needing attention)
    const deptReferrals = referrals.filter((r) => {
        const inMyDept = user?.departmentId
            ? r.receivingDepartmentId === user.departmentId
            : true
        return inMyDept && ['accepted', 'pending', 'forwarded'].includes(r.status)
    })
    const completedReferrals = referrals.filter(
        r => (user?.departmentId ? r.receivingDepartmentId === user.departmentId : true) && r.status === 'completed'
    )

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'}`
    const textareaCls = `${inputCls} resize-none leading-relaxed`
    const activeReferral = deptReferrals.find(ref => ref.id === activeReferralId) || null
    const doctorChartData = [
        { label: 'Pending', value: deptReferrals.filter((r) => r.status === 'pending').length, colorClass: 'bg-amber-500' },
        { label: 'Accepted', value: deptReferrals.filter((r) => r.status === 'accepted').length, colorClass: 'bg-emerald-500' },
        { label: 'Forwarded', value: deptReferrals.filter((r) => r.status === 'forwarded').length, colorClass: 'bg-purple-500' },
        { label: 'Completed', value: completedReferrals.length, colorClass: 'bg-primary-600' },
    ]

    const openCompletionModal = (referralId: string) => {
        setActiveReferralId(referralId)
        setFinalDiagnosis('')
        setTreatmentSummary('')
        setMedicationsPrescribed('')
        setFollowUpInstructions('')
        setDischargeDate(new Date().toISOString().slice(0, 10))
    }

    const closeCompletionModal = () => {
        setActiveReferralId(null)
        setFinalDiagnosis('')
        setTreatmentSummary('')
        setMedicationsPrescribed('')
        setFollowUpInstructions('')
        setDischargeDate(new Date().toISOString().slice(0, 10))
    }

    const submitCompletion = () => {
        if (!activeReferralId || !finalDiagnosis.trim() || !treatmentSummary.trim() || !medicationsPrescribed.trim() || !followUpInstructions.trim() || !dischargeDate) return
        completeReferral({
            referralId: activeReferralId,
            finalDiagnosis: finalDiagnosis.trim(),
            treatmentSummary: treatmentSummary.trim(),
            medicationsPrescribed: medicationsPrescribed.trim(),
            followUpInstructions: followUpInstructions.trim(),
            dischargeDate,
            createdByUserId: user?.id || 'USR-UNKNOWN',
            createdByName: user?.name || 'Assigned Doctor',
        })
        closeCompletionModal()
    }

    const handleClinicianAccept = async (referralId: string) => {
        try {
            setAcceptingReferralId(referralId)
            setAcceptError('')
            await trmsApi.clinicianAcceptReferral(referralId)
            await refreshReferrals()
        } catch (error: any) {
            setAcceptError(error?.message || 'Failed to accept referral as clinician.')
        } finally {
            setAcceptingReferralId(null)
        }
    }

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
            {acceptError && <p className="text-xs text-red-500">{acceptError}</p>}

            <DashboardMiniChart title="Department Referral Snapshot" data={doctorChartData} />

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
                                {ref.status === 'accepted' && !ref.clinicianAcceptedAt && (
                                    <button
                                        onClick={() => handleClinicianAccept(ref.id)}
                                        disabled={acceptingReferralId === ref.id}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} disabled:opacity-60`}
                                    >
                                        {acceptingReferralId === ref.id ? 'Accepting...' : 'Accept Case'}
                                    </button>
                                )}
                                {ref.status === 'accepted' && ref.clinicianAcceptedAt && (
                                    <button
                                        onClick={() => openCompletionModal(ref.id)}
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
                            const ds = dischargeSummaries.find(d => d.referralId === ref.id)
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

            {activeReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`}>
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                            <div>
                                <h3 className="text-base font-bold">{t('doc.dischargeSummary')}</h3>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                    {activeReferral.patientName} · {activeReferral.id}
                                </p>
                            </div>
                            <button
                                onClick={closeCompletionModal}
                                className={`p-1.5 rounded-lg ${isDark ? 'text-surface-400 hover:bg-surface-800' : 'text-surface-500 hover:bg-surface-100'}`}
                            >
                                <IconX size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Final Diagnosis</label>
                                <textarea className={textareaCls} rows={2} value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Summary of Treatment</label>
                                <textarea className={textareaCls} rows={3} value={treatmentSummary} onChange={(e) => setTreatmentSummary(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Medications Prescribed</label>
                                <textarea className={textareaCls} rows={3} value={medicationsPrescribed} onChange={(e) => setMedicationsPrescribed(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Follow-Up Instructions</label>
                                <textarea className={textareaCls} rows={3} value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Discharge Date</label>
                                <input type="date" className={inputCls} value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={submitCompletion}
                                    disabled={!finalDiagnosis.trim() || !treatmentSummary.trim() || !medicationsPrescribed.trim() || !followUpInstructions.trim() || !dischargeDate}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary-800 transition-colors"
                                >
                                    <IconSend size={14} /> {t('tri.submitReport')}
                                </button>
                                <button
                                    onClick={closeCompletionModal}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
