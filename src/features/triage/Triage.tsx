import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useReferrals } from '../../context/ReferralContext'
import { TrmsApiError, trmsApi, toDisplayReferralId, type ApiFacility, type Department } from '../../lib/trmsApi'
import StatusBadge from '../../components/StatusBadge'
import {
    IconCircleCheck,
    IconCircleX,
    IconArrowsLeftRight,
    IconAlertTriangle,
    IconUser,
    IconFileText,
    IconSend,
    IconX,
    IconClipboardCheck,
    IconExternalLink,
    IconSearch,
} from '@tabler/icons-react'

type ModalType = 'accept' | 'reject' | 'redirect' | 'report' | null

interface TriageActionRecord {
    id: string
    referralId: string
    patientName: string
    action: 'accepted' | 'rejected' | 'redirected'
    by: string
    timestamp: string
    note?: string
}

interface ActionFeedback {
    type: 'accepted' | 'rejected' | 'redirected'
    patientName: string
    referralId: string
    message: string
}

function TriageModal({
    title,
    icon,
    children,
    onClose,
    isDark,
}: {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    onClose: () => void
    isDark: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'} animate-fade-in`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-surface-700' : 'border-surface-100'}`}>
                    <div className="flex items-center gap-2.5">
                        {icon}
                        <h3 className="text-base font-bold">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-700/60 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                    >
                        <IconX size={16} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    )
}

export default function Triage() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals, completeReferral, refreshReferrals } = useReferrals()

    const [actions, setActions] = useState<TriageActionRecord[]>([])
    const [selectedRef, setSelectedRef] = useState<string | null>(null)
    const [resolvedReferrals, setResolvedReferrals] = useState<Record<string, 'accepted' | 'rejected' | 'redirected'>>({})
    const [feedback, setFeedback] = useState<ActionFeedback | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState('')
    const [queueFilter, setQueueFilter] = useState<'all' | 'emergency' | 'urgent' | 'routine'>('all')
    const [queueSearch, setQueueSearch] = useState('')

    // Modal state
    const [modal, setModal] = useState<ModalType>(null)
    const [actionRefId, setActionRefId] = useState('')
    // Reject / redirect
    const [rejectMsg, setRejectMsg] = useState('')
    const [redirectToFacilityId, setRedirectToFacilityId] = useState('')
    const [redirectReason, setRedirectReason] = useState('')
    const [departments, setDepartments] = useState<Department[]>([])
    const [facilities, setFacilities] = useState<ApiFacility[]>([])
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
    const [acceptWaitingTime, setAcceptWaitingTime] = useState('')
    const [acceptAppointmentDate, setAcceptAppointmentDate] = useState('')
    // Accept message (auto-filled, editable)
    const [acceptMsg, setAcceptMsg] = useState('')
    // Report fields
    const [diagnosis, setDiagnosis] = useState('')
    const [treatment, setTreatment] = useState('')
    const [followUp, setFollowUp] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        const loadActionMeta = async () => {
            if (!user?.facilityId) return
            try {
                const [deptResult, facilityResult] = await Promise.all([
                    trmsApi.getDepartments(user.facilityId),
                    trmsApi.getFacilities(),
                ])
                setDepartments(deptResult.filter((dept) => dept.active !== false))
                setFacilities(facilityResult)
            } catch (error) {
                console.error('Failed to load triage metadata:', error)
            }
        }

        void loadActionMeta()
    }, [user?.facilityId])

    const triageReferrals = referrals.filter(
        r => ['pending', 'forwarded'].includes(r.status) && !resolvedReferrals[r.id]
    )
    const filteredQueueReferrals = triageReferrals.filter((referral) => {
        if (queueFilter !== 'all' && referral.priority !== queueFilter) return false
        const search = queueSearch.trim().toLowerCase()
        if (!search) return true
        const displayId = toDisplayReferralId(referral.referralCode, referral.id).toLowerCase()
        return (
            referral.patientName.toLowerCase().includes(search) ||
            referral.id.toLowerCase().includes(search) ||
            displayId.includes(search)
        )
    })

    const selected = filteredQueueReferrals.find(r => r.id === selectedRef) || null

    // Urgency groups
    const emergency = filteredQueueReferrals.filter(r => r.priority === 'emergency')
    const urgent = filteredQueueReferrals.filter(r => r.priority === 'urgent')
    const routine = filteredQueueReferrals.filter(r => r.priority === 'routine')

    const openModal = (type: ModalType, refId: string) => {
        setActionRefId(refId)
        const ref = referrals.find(r => r.id === refId)
        if (type === 'accept' && ref) {
            setAcceptMsg(
                `Dear ${ref.referringFacility},\n\nWe are pleased to confirm the acceptance of your referral for patient ${ref.patientName} (${ref.mrn}). The patient has been scheduled for evaluation and admission.\n\nWarm regards,\nAyder Referral Hospital — Triage Team`
            )
        }
        if (type === 'accept') {
            const defaultDepartment = departments[0]?.id || ''
            setSelectedDepartmentId(defaultDepartment)
            setAcceptWaitingTime('')
            setAcceptAppointmentDate('')
        }
        if (type === 'reject' && ref) {
            setRejectMsg(
                `Dear ${ref.referringFacility},\n\nWe are unable to accept the referral for patient ${ref.patientName} at this time.\n\nReason:\n\nRecommended next steps:\n\nWarm regards,\nAyder Referral Hospital — Triage Team`
            )
        }
        setModal(type)
    }
    const closeModal = () => {
        setModal(null)
        setRejectMsg(''); setRedirectToFacilityId(''); setRedirectReason('')
        setSelectedDepartmentId(''); setAcceptWaitingTime(''); setAcceptAppointmentDate('')
        setDiagnosis(''); setTreatment(''); setFollowUp(''); setNotes('')
    }

    const handleAccept = async () => {
        const ref = referrals.find(r => r.id === actionRefId)
        if (!ref || !selectedDepartmentId) return

        try {
            setActionLoading(true)
            setActionError('')
            await trmsApi.acceptReferral(actionRefId, {
                receivingDepartmentId: selectedDepartmentId,
                waitingTime: acceptWaitingTime.trim() || undefined,
                appointmentDate: acceptAppointmentDate || undefined,
            })
            await refreshReferrals()
        } catch (error: any) {
            setActionError(error?.message || 'Failed to accept referral.')
            setActionLoading(false)
            return
        }

        setActions(prev => [
            { id: `TA-${Date.now()}`, referralId: actionRefId, patientName: ref.patientName, action: 'accepted', by: 'Ato Gebre', timestamp: new Date().toLocaleString(), note: acceptMsg.split('\n')[0] },
            ...prev,
        ])
        setResolvedReferrals(prev => ({ ...prev, [actionRefId]: 'accepted' }))
        setFeedback({
            type: 'accepted',
            patientName: ref.patientName,
            referralId: actionRefId,
            message: `${ref.patientName} has been accepted and removed from the live queue.`,
        })
        setSelectedRef(null)
        closeModal()
        setActionLoading(false)
    }

    const handleReject = async () => {
        const ref = referrals.find(r => r.id === actionRefId)
        if (!ref || !rejectMsg) return

        try {
            setActionLoading(true)
            setActionError('')
            await trmsApi.rejectReferral(actionRefId, { reason: rejectMsg.trim() })
            await refreshReferrals()
        } catch (error: any) {
            setActionError(error?.message || 'Failed to reject referral.')
            setActionLoading(false)
            return
        }

        setActions(prev => [
            { id: `TA-${Date.now()}`, referralId: actionRefId, patientName: ref.patientName, action: 'rejected', by: 'Ato Gebre', timestamp: new Date().toLocaleString(), note: rejectMsg },
            ...prev,
        ])
        setResolvedReferrals(prev => ({ ...prev, [actionRefId]: 'rejected' }))
        setFeedback({
            type: 'rejected',
            patientName: ref.patientName,
            referralId: actionRefId,
            message: `${ref.patientName} has been rejected and the referring facility has been notified.`,
        })
        setSelectedRef(null)
        closeModal()
        setActionLoading(false)
    }

    const handleRedirect = async () => {
        const ref = referrals.find(r => r.id === actionRefId)
        if (!ref || !redirectToFacilityId || !redirectReason.trim()) return

        const targetFacility = facilities.find((facility) => facility.id === redirectToFacilityId)

        try {
            setActionLoading(true)
            setActionError('')
            await trmsApi.forwardReferral(actionRefId, {
                newReceivingFacilityId: redirectToFacilityId,
                forwardingNote: redirectReason.trim(),
            })
            await refreshReferrals()
        } catch (error: unknown) {
            setActionError(getForwardErrorMessage(error))
            setActionLoading(false)
            return
        }

        setActions(prev => [
            { id: `TA-${Date.now()}`, referralId: actionRefId, patientName: ref.patientName, action: 'redirected', by: 'Ato Gebre', timestamp: new Date().toLocaleString(), note: `Redirected to ${targetFacility?.name || 'selected facility'}. ${redirectReason}` },
            ...prev,
        ])
        setResolvedReferrals(prev => ({ ...prev, [actionRefId]: 'redirected' }))
        setFeedback({
            type: 'redirected',
            patientName: ref.patientName,
            referralId: actionRefId,
            message: `${ref.patientName} has been forwarded to ${targetFacility?.name || 'the selected facility'}.`,
        })
        setSelectedRef(null)
        closeModal()
        setActionLoading(false)
    }

    const handleReport = () => {
        if (!selectedRef || !diagnosis.trim() || !treatment.trim() || !followUp.trim()) return
        completeReferral({
            referralId: selectedRef,
            finalDiagnosis: diagnosis.trim(),
            treatmentSummary: treatment.trim(),
            medicationsPrescribed: notes.trim() || 'No medications documented.',
            followUpInstructions: followUp.trim(),
            dischargeDate: new Date().toISOString().slice(0, 10),
            createdByUserId: user?.id || 'USR-UNKNOWN',
            createdByName: user?.name || 'Assigned Clinician',
        })
        setFeedback({
            type: 'accepted',
            patientName: selected?.patientName || 'Patient',
            referralId: selectedRef,
            message: `Discharge summary submitted for ${selected?.patientName || 'the patient'}. Referral marked as completed.`,
        })
        setSelectedRef(null)
        closeModal()
    }

    const cardBase = `rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const panelBase = `rounded-2xl border p-4 shadow-sm ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const textareaCls = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none leading-relaxed ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'} transition-colors`
    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'} transition-colors`
    const getForwardErrorMessage = (error: unknown): string => {
        if (error instanceof TrmsApiError) {
            if (error.status === 403) return 'You are not allowed to forward this referral.'
            if (error.status === 404) return 'Referral or destination facility not found. Refresh and try again.'
            if (error.status === 400) return error.message || 'Please select facility and enter forwarding reason.'
            return error.message || 'Failed to forward referral.'
        }
        if (error instanceof Error && error.message) return error.message
        return 'Failed to forward referral. Please try again.'
    }
    const openReferralDetails = (referralId: string) => {
        navigate(`/referrals/my/${referralId}`)
    }

    function ReferralCard({ ref: r, i }: { ref: typeof referrals[number]; i: number }) {
        const isSelected = selectedRef === r.id
        const displayReferralId = toDisplayReferralId(r.referralCode, r.id)
        return (
            <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRef(r.id)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedRef(r.id)
                    }
                }}
                className={`w-full text-left rounded-lg p-3.5 border transition-all duration-150 hover:-translate-y-0.5 cursor-pointer
                    ${isSelected
                        ? isDark ? 'border-primary-500/60 bg-primary-500/10 shadow-md shadow-primary-500/20' : 'border-primary-400 bg-primary-50 shadow-md shadow-primary-500/10'
                        : isDark ? 'border-surface-800 bg-surface-950 hover:border-surface-700' : 'border-surface-200 bg-white hover:border-surface-300'
                    }
                    ${r.priority === 'emergency' ? 'border-l-4 border-l-red-600' : r.priority === 'urgent' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-[#2b4968]'}`}
                style={{ animationDelay: `${i * 40}ms` }}
            >
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold truncate pr-2">{r.patientName}</span>
                    <StatusBadge type="priority" value={r.priority} />
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {displayReferralId}
                    </p>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            openReferralDetails(r.id)
                        }}
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors ${isDark ? 'border-surface-700 text-primary-300 hover:bg-surface-900' : 'border-surface-300 text-primary-700 hover:bg-primary-50'}`}
                    >
                        <IconExternalLink size={11} />
                        Open Details
                    </button>
                </div>
                <p className={`text-xs truncate mt-2 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>{r.chiefComplaint}</p>
                <p className={`text-[10px] mt-1.5 ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{t('tri.from')}: {r.referringFacility} · {r.date}</p>
            </div>
        )
    }

    function Section({ label, color, dot, items }: { label: string; color: string; dot: string; items: typeof referrals }) {
        if (items.length === 0) return null
        return (
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${dot.replace('bg-', 'bg-').replace('500', '500/15')} ${color}`}>{items.length}</span>
                </div>
                <div className="space-y-2">
                    {items.map((r, i) => <ReferralCard key={r.id} ref={r} i={i} />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('tri.title')}</h2>
            {actionError && <p className="text-xs text-red-500">{actionError}</p>}

            {feedback && (
                <div className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${feedback.type === 'accepted'
                    ? isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
                    : feedback.type === 'rejected'
                        ? isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'
                        : isDark ? 'border-[#2b4968]/40 bg-[#2b4968]/10' : 'border-[#2b4968]/20 bg-[#2b4968]/10'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${feedback.type === 'accepted'
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        : feedback.type === 'rejected'
                            ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                            : isDark ? 'bg-[#2b4968]/20 text-[#7ba0c8]' : 'bg-[#2b4968]/10 text-[#2b4968]'
                        }`}>
                        {feedback.type === 'accepted' ? <IconCircleCheck size={16} /> : feedback.type === 'rejected' ? <IconCircleX size={16} /> : <IconArrowsLeftRight size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{feedback.message}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                            Referral ID: <strong>{toDisplayReferralId(undefined, feedback.referralId)}</strong>
                        </p>
                    </div>
                    <button
                        onClick={() => setFeedback(null)}
                        className={`p-1 rounded-lg ${isDark ? 'text-surface-400 hover:bg-surface-800' : 'text-surface-500 hover:bg-white/70'}`}
                        aria-label="Dismiss confirmation"
                    >
                        <IconX size={16} />
                    </button>
                </div>
            )}

            <div className={`${cardBase} flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4`}>
                <div className="space-y-1">
                    <p className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>Triage Operations</p>
                    <h3 className="text-lg font-bold">Live Referral Queue</h3>
                    <p className={`text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>Prioritize admissions, manage capacity, and maintain clinical SLAs.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                    <div className={`rounded-xl border px-3 py-2 ${isDark ? 'bg-surface-950 border-surface-800' : 'bg-surface-50 border-surface-200'}`}>
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>Incoming</p>
                        <p className="text-lg font-bold">{triageReferrals.length}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 ${isDark ? 'border-red-900/60 bg-red-950/40' : 'border-red-200 bg-red-50'}`}>
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>Emergency</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-red-200' : 'text-red-700'}`}>{emergency.length}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 ${isDark ? 'border-amber-900/60 bg-amber-950/40' : 'border-amber-200 bg-amber-50'}`}>
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Urgent</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>{urgent.length}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 ${isDark ? 'border-[#2b4968]/60 bg-[#2b4968]/40' : 'border-[#2b4968]/20 bg-[#2b4968]/10'}`}>
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-[#2b4968]' : 'text-[#2b4968]'}`}>Routine</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-[#2b4968]' : 'text-[#2b4968]'}`}>{routine.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* ── Queue — urgency sections ────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">
                    <div className={`${panelBase} space-y-5`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                <IconAlertTriangle size={14} />
                            </div>
                            <div>
                                <span className="text-sm font-semibold">{t('tri.incoming')} ({filteredQueueReferrals.length})</span>
                                <p className={`text-[11px] ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>Sorted by clinical urgency</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className={`relative rounded-lg border ${isDark ? 'border-surface-700 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-surface-500' : 'text-surface-400'}`} />
                                <input
                                    value={queueSearch}
                                    onChange={(event) => setQueueSearch(event.target.value)}
                                    placeholder="Search patient or referral ID..."
                                    className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-lg bg-transparent outline-none ${isDark ? 'text-surface-100 placeholder:text-surface-500' : 'text-surface-900 placeholder:text-surface-400'}`}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'emergency', label: 'Emergency' },
                                    { id: 'urgent', label: 'Urgent' },
                                    { id: 'routine', label: 'Routine' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setQueueFilter(tab.id as 'all' | 'emergency' | 'urgent' | 'routine')}
                                        className={`px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                                            queueFilter === tab.id
                                                ? isDark
                                                    ? 'border-primary-500/60 bg-primary-500/15 text-primary-300'
                                                    : 'border-primary-400 bg-primary-50 text-primary-700'
                                                : isDark
                                                    ? 'border-surface-700 text-surface-400 hover:bg-surface-900'
                                                    : 'border-surface-200 text-surface-600 hover:bg-surface-100'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Section label="Emergency" color="text-red-500" dot="bg-red-500" items={emergency} />
                        <Section label="Urgent" color="text-amber-500" dot="bg-amber-500" items={urgent} />
                        <Section label="Routine" color="text-[#2b4968]" dot="bg-[#2b4968]" items={routine} />
                        {filteredQueueReferrals.length === 0 && (
                            <div className="text-center py-8">
                                <IconCircleCheck size={24} className="mx-auto text-emerald-400 mb-2" />
                                <p className="text-sm text-surface-500">{queueSearch || queueFilter !== 'all' ? 'No referrals match your filters.' : 'All referrals triaged'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Detail panel ────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    {selected ? (
                        <>
                            <div className={`sticky top-4 z-20 rounded-xl border p-3 backdrop-blur ${isDark ? 'border-surface-700 bg-surface-900/90' : 'border-surface-200 bg-white/95'}`}>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        onClick={() => openModal('accept', selected.id)}
                                        className="flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all"
                                    >
                                        <IconCircleCheck size={14} /> {t('tri.accept')}
                                    </button>
                                    <button
                                        onClick={() => openModal('reject', selected.id)}
                                        className="flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all"
                                    >
                                        <IconCircleX size={14} /> {t('tri.reject')}
                                    </button>
                                    <button
                                        onClick={() => openModal('redirect', selected.id)}
                                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                                    >
                                        <IconArrowsLeftRight size={14} /> {t('tri.redirect')}
                                    </button>
                                    <button
                                        onClick={() => openModal('report', selected.id)}
                                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all ${isDark ? 'border-primary-500/40 text-primary-300 hover:bg-primary-500/10' : 'border-primary-300 text-primary-700 hover:bg-primary-50'}`}
                                    >
                                        <IconFileText size={14} /> {t('tri.writeReport')}
                                    </button>
                                </div>
                            </div>
                            <div className={cardBase}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold ${selected.priority === 'emergency' ? 'bg-red-600' : selected.priority === 'urgent' ? 'bg-amber-500' : 'bg-[#2b4968]'}`}>
                                            {selected.patientName.split(' ').map(w => w[0]).join('')}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold">{selected.patientName}</h3>
                                            <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>{selected.mrn} · {selected.age}y, {selected.sex}</p>
                                        </div>
                                    </div>
                                    <StatusBadge type="priority" value={selected.priority} />
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">{t('ref.chiefComplaint')}</label>
                                        <p className="text-sm mt-0.5">{selected.chiefComplaint}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">{t('ref.clinicalSummary')}</label>
                                        <p className={`text-sm mt-0.5 leading-relaxed ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>{selected.clinicalSummary}</p>
                                    </div>
                                    <div className={`flex gap-4 text-xs ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                                        <span>{t('ref.referringFacility')}: <strong className={isDark ? 'text-surface-300' : 'text-surface-700'}>{selected.referringFacility}</strong></span>
                                        <span>→ <strong className={isDark ? 'text-surface-300' : 'text-surface-700'}>{selected.receivingFacility}</strong></span>
                                    </div>
                                    {selected.hasImage && (
                                        <div className={`p-3 rounded-lg text-[11px] ${isDark ? 'bg-surface-950 text-surface-400' : 'bg-surface-50 text-surface-500'}`}>
                                            📎 1 image attachment
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={`${cardBase} text-center py-16`}>
                            <IconUser size={32} className="mx-auto text-surface-500 mb-3" />
                            <p className="text-sm text-surface-500">Select a referral to review</p>
                        </div>
                    )}

                    {/* Recent actions */}
                    <div className={cardBase}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold">{t('tri.recentActions')}</h3>
                            <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>Last 24 hours</span>
                        </div>
                        <div className="space-y-2">
                            {actions.slice(0, 6).map(a => (
                                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg text-xs border ${isDark ? 'bg-surface-950 border-surface-800' : 'bg-surface-50 border-surface-200'}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${a.action === 'accepted' ? 'bg-emerald-600' : a.action === 'rejected' ? 'bg-red-600' : 'bg-[#2b4968]'}`}>
                                        {a.action === 'accepted' ? <IconCircleCheck size={12} /> : a.action === 'rejected' ? <IconCircleX size={12} /> : <IconArrowsLeftRight size={12} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{a.patientName} — <span className={a.action === 'accepted' ? 'text-emerald-500' : a.action === 'rejected' ? 'text-red-500' : 'text-[#2b4968]'}>{a.action}</span></p>
                                        {a.note && <p className={`truncate ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>{a.note}</p>}
                                    </div>
                                    <span className={`shrink-0 text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>{a.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ACCEPT MODAL ─────────────────────────────────────────────── */}
            {modal === 'accept' && (
                <TriageModal
                    title={t('tri.acceptMsg')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}><IconCircleCheck size={14} className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} /></div>}
                    onClose={closeModal}
                    isDark={isDark}
                >
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        The following acceptance notification will be sent to the referring facility.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Receiving Department</label>
                            <select
                                className={inputCls}
                                value={selectedDepartmentId}
                                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                            >
                                <option value="">Select department</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>{department.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Estimated Waiting Time</label>
                            <input
                                className={inputCls}
                                placeholder="e.g. 30 minutes"
                                value={acceptWaitingTime}
                                onChange={(e) => setAcceptWaitingTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Appointment Date (optional)</label>
                            <input
                                type="date"
                                className={inputCls}
                                value={acceptAppointmentDate}
                                onChange={(e) => setAcceptAppointmentDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <textarea
                        className={textareaCls}
                        rows={7}
                        value={acceptMsg}
                        onChange={e => setAcceptMsg(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleAccept} disabled={actionLoading || !selectedDepartmentId} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                            <IconSend size={14} /> IconSend & Confirm Acceptance
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </TriageModal>
            )}

            {/* ── REJECT MODAL ─────────────────────────────────────────────── */}
            {modal === 'reject' && (
                <TriageModal
                    title={t('tri.rejectReason')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}><IconCircleX size={14} className={`${isDark ? 'text-red-300' : 'text-red-600'}`} /></div>}
                    onClose={closeModal}
                    isDark={isDark}
                >
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Edit the message below and send it to the referring facility.
                    </p>
                    <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">
                        Rejection Message
                    </label>
                    <textarea
                        className={textareaCls}
                        rows={5}
                        autoFocus
                        value={rejectMsg}
                        onChange={e => setRejectMsg(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleReject} disabled={actionLoading || !rejectMsg.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors">
                            <IconSend size={14} /> IconSend Rejection
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </TriageModal>
            )}

            {/* ── REDIRECT MODAL ───────────────────────────────────────────── */}
            {modal === 'redirect' && (
                <TriageModal
                    title={t('tri.redirectMsg')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2b4968]/20' : 'bg-[#2b4968]/10'}`}><IconArrowsLeftRight size={14} className={`${isDark ? 'text-[#2b4968]' : 'text-[#2b4968]'}`} /></div>}
                    onClose={closeModal}
                    isDark={isDark}
                >
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Specify where the patient is being redirected and why.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Redirect To Facility</label>
                            <select
                                className={inputCls}
                                value={redirectToFacilityId}
                                onChange={e => setRedirectToFacilityId(e.target.value)}
                            >
                                <option value="">Select facility</option>
                                {facilities
                                    .filter((facility) => facility.id !== user?.facilityId)
                                    .map((facility) => (
                                        <option key={facility.id} value={facility.id}>{facility.name}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Reason for Redirection</label>
                            <textarea
                                className={textareaCls}
                                rows={4}
                                placeholder="Clinical reason and any additional instructions for the referring facility..."
                                value={redirectReason}
                                onChange={e => setRedirectReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleRedirect} disabled={actionLoading || !redirectToFacilityId || !redirectReason.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2b4968] text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-[#2b4968]/90 transition-colors">
                            <IconSend size={14} /> IconSend Redirect Notice
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </TriageModal>
            )}

            {/* ── TREATMENT REPORT MODAL ───────────────────────────────────── */}
            {modal === 'report' && selected && (
                <TriageModal
                    title={t('tri.reportTitle')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconClipboardCheck size={14} className={`${isDark ? 'text-primary-300' : 'text-primary-600'}`} /></div>}
                    onClose={closeModal}
                    isDark={isDark}
                >
                    <p className={`text-xs mb-4 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        This report will be sent to <strong className={isDark ? 'text-surface-300' : 'text-surface-700'}>{selected.referringFacility}</strong> and added to the patient record for {selected.patientName}.
                    </p>
                    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">{t('tri.diagnosis')}</label>
                            <textarea className={textareaCls} rows={2} placeholder="Final confirmed diagnosis..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">{t('tri.treatment')}</label>
                            <textarea className={textareaCls} rows={3} placeholder="Procedures performed, medications administered, interventions..." value={treatment} onChange={e => setTreatment(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">{t('tri.followUp')}</label>
                            <textarea className={textareaCls} rows={3} placeholder="Follow-up appointments, medications to continue, warning signs to watch..." value={followUp} onChange={e => setFollowUp(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1.5 block uppercase tracking-wide">{t('tri.additionalNotes')}</label>
                            <textarea className={textareaCls} rows={2} placeholder="Any additional notes for the referring team..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleReport}
                            disabled={!diagnosis.trim() || !treatment.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary-800 transition-colors"
                        >
                            <IconSend size={14} /> {t('tri.submitReport')}
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </TriageModal>
            )}
        </div>
    )
}
