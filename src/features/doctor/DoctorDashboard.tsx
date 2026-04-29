import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useReferrals } from '../../context/ReferralContext'
import { trmsApi, type Department } from '../../lib/trmsApi'
import StatusBadge from '../../components/StatusBadge'
import {
    IconStethoscope,
    IconClipboardCheck,
    IconUser,
    IconAlertTriangle,
    IconSend,
    IconX,
    IconCircleX,
    IconArrowsLeftRight,
    IconSearch,
    IconArrowRight,
} from '@tabler/icons-react'

/**
 * Doctor Dashboard Component
 * Implements a high-density clinical queue with split-pane detail view.
 */
export default function DoctorDashboard() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals, refreshReferrals, dischargeSummaries, completeReferral } = useReferrals()

    // ── Primary State Hooks ──────────────────────────────────────────────────
    const [selectedRefId, setSelectedRefId] = useState<string | null>(null)
    const [activeReferralId, setActiveReferralId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'forwarded' | 'completed'>('all')
    const [visibleCount, setVisibleCount] = useState(10)

    // Form/Action States
    const [finalDiagnosis, setFinalDiagnosis] = useState('')
    const [treatmentSummary, setTreatmentSummary] = useState('')
    const [medicationsPrescribed, setMedicationsPrescribed] = useState('')
    const [followUpInstructions, setFollowUpInstructions] = useState('')
    const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().slice(0, 10))
    const [acceptingReferralId, setAcceptingReferralId] = useState<string | null>(null)
    const [acceptError, setAcceptError] = useState('')

    // Modal states for rejection/forwarding
    const [departments, setDepartments] = useState<Department[]>([])
    const [actionModal, setActionModal] = useState<'reject' | 'forward' | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [forwardDepartmentId, setForwardDepartmentId] = useState('')
    const [forwardNote, setForwardNote] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    // ── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (user?.facilityId) {
            trmsApi.getDepartments(user.facilityId).then(setDepartments).catch(console.error)
        }
    }, [user?.facilityId])

    // ── Helper Components ────────────────────────────────────────────────────
    function ListCard({ refData: r }: { refData: typeof referrals[0] }) {
        const isSelected = selectedRefId === r.id
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRefId(r.id)}
                className={`w-full text-left rounded-xl p-3.5 border transition-all cursor-pointer relative overflow-hidden
                    ${isSelected
                        ? isDark ? 'border-primary-500/60 bg-primary-500/10 shadow-lg' : 'border-primary-400 bg-primary-50 shadow-md'
                        : isDark ? 'border-surface-800 bg-surface-950 hover:border-surface-700' : 'border-surface-200 bg-white hover:border-surface-300'
                    }
                    ${r.priority === 'emergency' ? 'border-l-4 border-l-red-600' : r.priority === 'urgent' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-[#2b4968]'}`}
            >
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold truncate pr-2">{r.patientName}</span>
                    <StatusBadge type="priority" value={r.priority} />
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
                        {r.referralCode || r.id.slice(0, 8)}
                    </p>
                    <p className={`text-[10px] font-semibold ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{r.date}</p>
                </div>
                <p className={`text-xs truncate mt-2 italic ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>"{r.chiefComplaint}"</p>
                {r.clinicianAcceptedAt && (
                    <div className="absolute top-0 right-0">
                        <div className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">
                            Active
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ── Logic ────────────────────────────────────────────────────────────────
    const deptReferrals = referrals.filter((r) => {
        return user?.departmentId ? r.receivingDepartmentId === user.departmentId : true
    })

    const counts = {
        all: deptReferrals.length,
        pending: deptReferrals.filter(r => ['pending_receiving', 'forwarded'].includes(r.status) && !r.clinicianAcceptedAt).length,
        accepted: deptReferrals.filter(r => r.clinicianAcceptedAt && r.status !== 'completed').length,
        rejected: deptReferrals.filter(r => r.status === 'rejected').length,
        forwarded: deptReferrals.filter(r => r.status === 'forwarded').length,
        completed: deptReferrals.filter(r => r.status === 'completed').length,
    }

    // "Notification" counts: items needing initial action (not accepted/rejected/forwarded out/completed)
    const attentionNeeded = {
        all: deptReferrals.filter(r => !r.clinicianAcceptedAt && r.status === 'pending_receiving').length,
        pending: deptReferrals.filter(r => !r.clinicianAcceptedAt && ['pending_receiving', 'forwarded'].includes(r.status)).length,
        accepted: 0,
        rejected: 0,
        forwarded: 0,
        completed: 0
    }

    const filteredReferrals = deptReferrals.filter(r => {
        const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.referralCode && r.referralCode.toLowerCase().includes(searchQuery.toLowerCase()))

        let matchesStatus = true
        if (statusFilter === 'pending') matchesStatus = ['pending_receiving', 'forwarded'].includes(r.status) && !r.clinicianAcceptedAt
        else if (statusFilter === 'accepted') matchesStatus = !!r.clinicianAcceptedAt && r.status !== 'completed'
        else if (statusFilter !== 'all') matchesStatus = r.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const sortedReferrals = [...filteredReferrals].sort((a, b) => {
        const pMap = { emergency: 0, urgent: 1, routine: 2 }
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority]
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    const visibleReferrals = sortedReferrals.slice(0, visibleCount)
    const hasMore = sortedReferrals.length > visibleCount

    const emergency = visibleReferrals.filter(r => r.priority === 'emergency')
    const urgent = visibleReferrals.filter(r => r.priority === 'urgent')
    const routine = visibleReferrals.filter(r => r.priority === 'routine')

    const panelBase = `rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'}`
    const textareaCls = `${inputCls} resize-none leading-relaxed`

    const selectedRef = referrals.find(ref => ref.id === selectedRefId) || null
    const selectedRefDS = selectedRef ? dischargeSummaries.find(ds => ds.referralId === selectedRef.id) : null
    const activeReferral = referrals.find(ref => ref.id === activeReferralId) || null

    // ── Action Handlers ──────────────────────────────────────────────────────
    const openCompletionModal = (referralId: string) => {
        setActiveReferralId(referralId)
        setFinalDiagnosis('')
        setTreatmentSummary('')
        setMedicationsPrescribed('')
        setFollowUpInstructions('')
        setDischargeDate(new Date().toISOString().slice(0, 10))
    }

    const closeCompletionModal = () => setActiveReferralId(null)

    const openActionModal = (type: 'reject' | 'forward', refId: string) => {
        setActiveReferralId(refId)
        setActionModal(type)
        setRejectReason('')
        setForwardDepartmentId('')
        setForwardNote('')
    }

    const closeActionModal = () => {
        setActiveReferralId(null)
        setActionModal(null)
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

    const handleReject = async () => {
        if (!activeReferralId || !rejectReason.trim()) return
        try {
            setActionLoading(true)
            await trmsApi.rejectReferral(activeReferralId, { reason: rejectReason.trim() })
            await refreshReferrals()
            closeActionModal()
        } catch (error) {
            console.error('Failed to reject referral:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleForward = async () => {
        if (!activeReferralId || !forwardDepartmentId || !forwardNote.trim()) return
        try {
            setActionLoading(true)
            await trmsApi.internalForwardReferral(activeReferralId, {
                departmentId: forwardDepartmentId,
                reason: forwardNote.trim(),
            })
            await refreshReferrals()
            closeActionModal()
        } catch (error) {
            console.error('Failed to forward referral:', error)
        } finally {
            setActionLoading(false)
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{t('doc.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {t('doc.dept')}: <strong>{user?.department || 'General Medicine'}</strong>
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <IconAlertTriangle size={12} /> {deptReferrals.length} awaiting review
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Queue */}
                <div className="lg:col-span-2 space-y-4">
                    <div className={panelBase + " flex flex-col h-[750px]"}>
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                <IconStethoscope size={16} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-tight">Incoming Queue ({deptReferrals.length})</h3>
                        </div>

                        <div className="space-y-3 mb-4 shrink-0">
                            <div className={`relative rounded-lg border ${isDark ? 'border-surface-700 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-surface-500' : 'text-surface-400'}`} />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search patient..."
                                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-transparent outline-none ${isDark ? 'text-surface-100' : 'text-surface-900'}`}
                                />
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {(['all', 'pending', 'accepted', 'rejected', 'forwarded', 'completed'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setVisibleCount(10); }}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-2 ${statusFilter === s
                                            ? isDark ? 'border-primary-500/60 bg-primary-500/15 text-primary-300' : 'border-primary-400 bg-primary-50 text-primary-700'
                                            : isDark ? 'border-surface-800 text-surface-500 hover:bg-surface-900 hover:text-surface-300' : 'border-surface-200 text-surface-500 hover:bg-surface-50'
                                            }`}
                                    >
                                        <span>{s}</span>
                                        <div className="flex items-center gap-1">
                                            {attentionNeeded[s as keyof typeof attentionNeeded] > 0 && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Needs Attention" />
                                            )}
                                            <span className={`text-[9px] opacity-70 ${statusFilter === s ? 'text-primary-500' : ''}`}>
                                                {counts[s]}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            {emergency.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-red-500 mb-2 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Emergency
                                    </h4>
                                    <div className="space-y-2">
                                        {emergency.map(r => <ListCard key={r.id} refData={r} />)}
                                    </div>
                                </div>
                            )}
                            {urgent.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-amber-500 mb-2 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Urgent
                                    </h4>
                                    <div className="space-y-2">
                                        {urgent.map(r => <ListCard key={r.id} refData={r} />)}
                                    </div>
                                </div>
                            )}
                            {routine.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-primary-500 mb-2 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Routine
                                    </h4>
                                    <div className="space-y-2">
                                        {routine.map(r => <ListCard key={r.id} refData={r} />)}
                                    </div>
                                </div>
                            )}

                            {filteredReferrals.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <IconClipboardCheck size={32} className="mx-auto mb-2" />
                                    <p className="text-xs">No matching referrals</p>
                                </div>
                            )}

                            {hasMore && (
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 10)}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${isDark ? 'border-surface-800 text-surface-400 hover:bg-surface-900 hover:text-surface-200' : 'border-surface-200 text-surface-500 hover:bg-surface-50'}`}
                                >
                                    See More Patients ({sortedReferrals.length - visibleCount} remaining)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Details */}
                <div className="lg:col-span-3">
                    {selectedRef ? (
                        <div className={panelBase + " h-[750px] flex flex-col animate-scale-in"}>
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${selectedRef.priority === 'emergency' ? 'bg-red-600 shadow-red-900/20' : selectedRef.priority === 'urgent' ? 'bg-amber-500 shadow-amber-900/20' : 'bg-[#2b4968] shadow-surface-900/20'}`}>
                                        {selectedRef.patientName.split(' ').map(w => w[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedRef.patientName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StatusBadge type="priority" value={selectedRef.priority} />
                                            <span className={`text-xs font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                                MRN: {selectedRef.mrn} · ID: {selectedRef.referralCode || selectedRef.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>Received</p>
                                    <p className="text-sm font-bold">{selectedRef.date}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <section>
                                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>Clinical Presentation</h4>
                                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-surface-950 border border-surface-800' : 'bg-surface-50 border border-surface-200'}`}>
                                            <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Chief Complaint</p>
                                            <p className="text-sm font-semibold mb-4 italic">"{selectedRef.chiefComplaint}"</p>
                                            <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Clinical Summary</p>
                                            <p className="text-sm leading-relaxed">{selectedRef.clinicalSummary}</p>
                                        </div>
                                    </section>
                                    <section className="space-y-6">
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>Diagnosis & Referral</h4>
                                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-surface-950 border border-surface-800' : 'bg-surface-50 border border-surface-200'}`}>
                                                <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Primary Diagnosis</p>
                                                <p className="text-sm font-bold text-emerald-500 mb-3">{selectedRef.primaryDiagnosis || 'Awaiting evaluation'}</p>
                                                <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Reason for Referral</p>
                                                <p className="text-sm">{selectedRef.reasonForReferral}</p>
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-2xl border ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                                            <p className={`text-[10px] font-bold uppercase mb-2 ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>Source Facility</p>
                                            <p className="text-xs font-bold">{selectedRef.referringFacility}</p>
                                            <p className="text-[11px] mt-1 opacity-70">Dr. {selectedRef.referringUserName || 'Staff'} · {selectedRef.referringUserPhone || 'No contact'}</p>
                                        </div>
                                    </section>
                                </div>

                                {selectedRefDS && (
                                    <section className="mt-8 animate-fade-in pb-4">
                                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Outcome & Discharge Summary</h4>
                                        <div className={`p-5 rounded-2xl border-2 ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Final Diagnosis</p>
                                                    <p className="text-sm font-bold text-emerald-500">{selectedRefDS.finalDiagnosis}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Discharge Date</p>
                                                    <p className="text-sm font-medium">{new Date(selectedRefDS.dischargeDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Summary of Care</p>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedRefDS.treatmentSummary}</p>
                                                </div>
                                                {selectedRefDS.medicationsPrescribed && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Medications Prescribed</p>
                                                        <p className="text-sm leading-relaxed">{selectedRefDS.medicationsPrescribed}</p>
                                                    </div>
                                                )}
                                                {selectedRefDS.followUpInstructions && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Follow-up Instructions</p>
                                                        <p className="text-sm leading-relaxed p-3 rounded-lg bg-surface-500/5 border border-surface-500/10 italic">
                                                            {selectedRefDS.followUpInstructions}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-surface-800 shrink-0">
                                <div className="flex flex-wrap gap-2">
                                    {selectedRef.status === 'completed' || selectedRef.status === 'rejected' ? (
                                        <div className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border ${selectedRef.status === 'completed' 
                                            ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                            <IconClipboardCheck size={16} /> 
                                            Referral {selectedRef.status === 'completed' ? 'Completed & Discharged' : 'Rejected'}
                                        </div>
                                    ) : (
                                        <>
                                            {!selectedRef.clinicianAcceptedAt ? (
                                                <button
                                                    onClick={() => handleClinicianAccept(selectedRef.id)}
                                                    disabled={acceptingReferralId === selectedRef.id}
                                                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10 disabled:opacity-50"
                                                >
                                                    <IconClipboardCheck size={14} />
                                                    {acceptingReferralId === selectedRef.id ? 'Accepting...' : 'Accept Responsibility'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openCompletionModal(selectedRef.id)}
                                                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-900/10"
                                                >
                                                    <IconClipboardCheck size={14} /> Complete Discharge
                                                </button>
                                            )}
                                            <div className="flex gap-1.5">
                                                <button 
                                                    onClick={() => openActionModal('forward', selectedRef.id)} 
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-200 text-surface-600 hover:bg-surface-50'}`}
                                                >
                                                    <IconArrowsLeftRight size={14} /> Transfer
                                                </button>
                                                <button 
                                                    onClick={() => openActionModal('reject', selectedRef.id)} 
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${isDark ? 'border-red-500/20 text-red-400 hover:bg-red-500/5' : 'border-red-500/10 text-red-600 hover:bg-red-50'}`}
                                                >
                                                    <IconCircleX size={14} /> Reject
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        navigate('/referrals/new', {
                                                            state: {
                                                                prefill: {
                                                                    patientName: selectedRef.patientName,
                                                                    dateOfBirth: selectedRef.dateOfBirth,
                                                                    gender: selectedRef.sex,
                                                                    phone: selectedRef.phone,
                                                                    priority: selectedRef.priority,
                                                                    parentReferralId: selectedRef.id,
                                                                    clinicalSummary: `Patient referred from ${selectedRef.referringFacility}. Original summary: ${selectedRef.clinicalSummary}`,
                                                                    primaryDiagnosis: selectedRef.primaryDiagnosis
                                                                }
                                                            }
                                                        })
                                                    }}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${isDark ? 'border-primary-500/30 text-primary-400 hover:bg-primary-500/5' : 'border-primary-200 text-primary-700 hover:bg-primary-50'}`}
                                                >
                                                    <IconArrowRight size={14} /> Refer to Specialized Hospital
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={panelBase + " h-[750px] flex flex-col items-center justify-center text-center opacity-40 border-dashed"}>
                            <div className="w-20 h-20 rounded-full bg-surface-500/10 flex items-center justify-center mb-4"><IconUser size={40} /></div>
                            <h3 className="text-lg font-bold">Select a Patient</h3>
                            <p className="text-sm max-w-[240px]">Select a referral from the list on the left to view full clinical details and take action.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {activeReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`}>
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                            <div>
                                <h3 className="text-base font-bold">{t('doc.dischargeSummary')}</h3>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{activeReferral.patientName} · {activeReferral.id}</p>
                            </div>
                            <button onClick={closeCompletionModal} className={`p-1.5 rounded-lg ${isDark ? 'text-surface-400 hover:bg-surface-800' : 'text-surface-500 hover:bg-surface-100'}`}><IconX size={16} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div><label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Final Diagnosis</label><textarea className={textareaCls} rows={2} value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} /></div>
                            <div><label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Summary of Treatment</label><textarea className={textareaCls} rows={3} value={treatmentSummary} onChange={(e) => setTreatmentSummary(e.target.value)} /></div>
                            <div><label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Medications Prescribed</label><textarea className={textareaCls} rows={3} value={medicationsPrescribed} onChange={(e) => setMedicationsPrescribed(e.target.value)} /></div>
                            <div><label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Follow-Up Instructions</label><textarea className={textareaCls} rows={3} value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} /></div>
                            <div><label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">Discharge Date</label><input type="date" className={inputCls} value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} /></div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={submitCompletion} disabled={!finalDiagnosis.trim() || !treatmentSummary.trim() || !medicationsPrescribed.trim() || !followUpInstructions.trim() || !dischargeDate} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary-800 transition-colors"><IconSend size={14} /> {t('tri.submitReport')}</button>
                                <button onClick={closeCompletionModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}>{t('common.cancel')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {actionModal === 'reject' && activeReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`}>
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                            <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}><IconCircleX size={16} /></div><h3 className="text-base font-bold">Reject Referral</h3></div>
                            <button onClick={closeActionModal} className={`p-1.5 rounded-lg ${isDark ? 'text-surface-400 hover:bg-surface-800' : 'text-surface-500 hover:bg-surface-100'}`}><IconX size={16} /></button>
                        </div>
                        <div className="p-5">
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Reason for Rejection</label>
                            <textarea className={textareaCls} rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Please provide a clinical reason..." />
                            <div className="flex gap-3 mt-4">
                                <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">Confirm Rejection</button>
                                <button onClick={closeActionModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {actionModal === 'forward' && activeReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`}>
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                            <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2b4968]/20 text-[#7ba0c8]' : 'bg-[#2b4968]/10 text-[#2b4968]'}`}><IconArrowsLeftRight size={16} /></div><h3 className="text-base font-bold">Internal Forward</h3></div>
                            <button onClick={closeActionModal} className={`p-1.5 rounded-lg ${isDark ? 'text-surface-400 hover:bg-surface-800' : 'text-surface-500 hover:bg-surface-100'}`}><IconX size={16} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1 block">Target Department</label>
                                <select className={inputCls} value={forwardDepartmentId} onChange={e => setForwardDepartmentId(e.target.value)}>
                                    <option value="">Select department</option>
                                    {departments.filter(d => d.id !== user?.departmentId).map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-surface-400 mb-1 block">Reason for Forwarding <span className="text-red-500">*</span></label>
                                <textarea className={textareaCls} rows={3} value={forwardNote} onChange={e => setForwardNote(e.target.value)} placeholder="e.g. Patient requires cardiology consultation not available in general surgery." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleForward} disabled={actionLoading || !forwardDepartmentId || !forwardNote.trim()} className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50">Transfer Patient</button>
                                <button onClick={closeActionModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
