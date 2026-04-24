import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useReferrals } from '../../context/ReferralContext'
import { trmsApi, type ApiFacility, type Department } from '../../lib/trmsApi'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import {
    IconClipboardList,
    IconFileText,
    IconHash,
} from '@tabler/icons-react'

type ConfirmAction = 'accept' | 'reject' | 'forward' | 'cancel'

export default function MyReferrals() {
    const navigate = useNavigate()
    const { referralId } = useParams<{ referralId?: string }>()
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals, dischargeSummaries, refreshReferrals } = useReferrals()
    const [filter, setFilter] = useState<string>('all')
    const [selected, setSelected] = useState<string | null>(referralId || null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [cancelLoading, setCancelLoading] = useState(false)
    const [cancelError, setCancelError] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState('')
    const [actionSuccess, setActionSuccess] = useState('')
    const [rejectReason, setRejectReason] = useState('')
    const [availableDepartments, setAvailableDepartments] = useState<Department[]>([])
    const [departmentLoading, setDepartmentLoading] = useState(false)
    const [departmentError, setDepartmentError] = useState('')
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
    const [facilities, setFacilities] = useState<ApiFacility[]>([])
    const [forwardFacilityId, setForwardFacilityId] = useState('')
    const [forwardingNote, setForwardingNote] = useState('')
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

    // TODO (Backend Team): GET /api/referrals?createdBy={userId}&status={filter}
    const myRefs = referrals.filter(r => {
        if (filter !== 'all' && r.status !== filter) return false
        return true
    })

    React.useEffect(() => {
        if (referralId) {
            setSelected(referralId)
        }
    }, [referralId])

    useEffect(() => {
        const loadDepartments = async () => {
            if (!user?.facilityId) {
                setAvailableDepartments([])
                return
            }
            try {
                setDepartmentLoading(true)
                setDepartmentError('')
                const list = await trmsApi.getDepartments(user.facilityId)
                setAvailableDepartments(Array.isArray(list) ? list : [])
            } catch (error: any) {
                setDepartmentError(error?.message || 'Failed to load departments.')
            } finally {
                setDepartmentLoading(false)
            }
        }

        void loadDepartments()
    }, [user?.facilityId])

    useEffect(() => {
        const loadFacilities = async () => {
            try {
                const list = await trmsApi.getFacilities()
                setFacilities(Array.isArray(list) ? list : [])
            } catch {
                setFacilities([])
            }
        }
        void loadFacilities()
    }, [])

    const selectedRef = referrals.find(r => r.id === selected)
    const selectedDS = selectedRef ? dischargeSummaries.find(ds => ds.referralId === selectedRef.id) : null
    const canReviewAnyFacility = user?.role === 'System Administrator'
    const isReceivingFacilityReferral = useMemo(() => {
        if (!selectedRef || !user) return false
        if (canReviewAnyFacility) return true
        if (selectedRef.receivingFacilityId && user.facilityId) {
            return selectedRef.receivingFacilityId === user.facilityId
        }
        return selectedRef.receivingFacility === user.facility
    }, [canReviewAnyFacility, selectedRef, user])
    const canTakeLifecycleAction = Boolean(
        selectedRef &&
        ['pending', 'forwarded'].includes(selectedRef.status) &&
        isReceivingFacilityReferral &&
        ['Liaison Officer', 'Doctor', 'System Administrator'].includes(user?.role || ''),
    )
    const canForwardReferral = Boolean(
        selectedRef &&
        ['pending', 'forwarded'].includes(selectedRef.status) &&
        isReceivingFacilityReferral &&
        ['Liaison Officer', 'System Administrator'].includes(user?.role || ''),
    )
    const canCancelSentReferral = Boolean(
        selectedRef &&
        ['draft', 'pending', 'pending_routing'].includes(selectedRef.status) &&
        selectedRef.referringUserId === user?.id,
    )
    const canEditSentReferral = Boolean(
        selectedRef &&
        ['draft', 'pending', 'pending_routing'].includes(selectedRef.status) &&
        selectedRef.referringUserId === user?.id,
    )

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const filterCls = (v: string) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === v
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`

    const handleSubmitDraft = async () => {
        if (!selectedRef || selectedRef.status !== 'draft') return
        try {
            setSubmitLoading(true)
            setSubmitError('')
            await trmsApi.submitReferral(selectedRef.id)
            await refreshReferrals()
        } catch (error: any) {
            setSubmitError(error?.message || 'Failed to submit draft referral.')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleCancelReferral = async (): Promise<boolean> => {
        if (!selectedRef || !canCancelSentReferral) return false
        try {
            setCancelLoading(true)
            setCancelError('')
            await trmsApi.removeReferral(selectedRef.id)
            await refreshReferrals()
            return true
        } catch (error: any) {
            setCancelError(error?.message || 'Failed to delete referral.')
            return false
        } finally {
            setCancelLoading(false)
        }
    }

    useEffect(() => {
        setActionError('')
        setActionSuccess('')
        setRejectReason('')
        setForwardingNote('')
        setForwardFacilityId('')
        setCancelError('')
        setSelectedDepartmentId(selectedRef?.receivingDepartmentId || user?.departmentId || '')
    }, [selectedRef?.id, selectedRef?.receivingDepartmentId, user?.departmentId])

    const handleAcceptReferral = async (): Promise<boolean> => {
        if (!selectedRef || !canTakeLifecycleAction || !selectedDepartmentId) return false
        try {
            setActionLoading(true)
            setActionError('')
            setActionSuccess('')
            await trmsApi.acceptReferral(selectedRef.id, {
                receivingDepartmentId: selectedDepartmentId,
            })
            await refreshReferrals()
            setActionSuccess('Referral accepted successfully.')
            return true
        } catch (error: any) {
            setActionError(error?.message || 'Failed to accept referral.')
            return false
        } finally {
            setActionLoading(false)
        }
    }

    const handleRejectReferral = async (): Promise<boolean> => {
        if (!selectedRef || !canTakeLifecycleAction || !rejectReason.trim()) return false
        try {
            setActionLoading(true)
            setActionError('')
            setActionSuccess('')
            await trmsApi.rejectReferral(selectedRef.id, {
                reason: rejectReason.trim(),
            })
            await refreshReferrals()
            setActionSuccess('Referral rejected successfully.')
            return true
        } catch (error: any) {
            setActionError(error?.message || 'Failed to reject referral.')
            return false
        } finally {
            setActionLoading(false)
        }
    }

    const handleForwardReferral = async (): Promise<boolean> => {
        if (!selectedRef || !canForwardReferral || !forwardFacilityId || !forwardingNote.trim()) {
            return false
        }

        try {
            setActionLoading(true)
            setActionError('')
            setActionSuccess('')
            await trmsApi.forwardReferral(selectedRef.id, {
                newReceivingFacilityId: forwardFacilityId,
                forwardingNote: forwardingNote.trim(),
            })
            await refreshReferrals()
            setActionSuccess('Referral forwarded successfully.')
            return true
        } catch (error: any) {
            setActionError(error?.message || 'Failed to forward referral.')
            return false
        } finally {
            setActionLoading(false)
        }
    }

    const handleConfirmAction = async () => {
        if (!confirmAction) return
        let ok = false

        if (confirmAction === 'accept') {
            ok = await handleAcceptReferral()
        } else if (confirmAction === 'reject') {
            ok = await handleRejectReferral()
        } else if (confirmAction === 'forward') {
            ok = await handleForwardReferral()
        } else if (confirmAction === 'cancel') {
            ok = await handleCancelReferral()
        }

        if (ok) {
            setConfirmAction(null)
        }
    }

    const confirmTitle =
        confirmAction === 'accept'
            ? 'Confirm Acceptance'
            : confirmAction === 'reject'
                ? 'Confirm Rejection'
                : confirmAction === 'forward'
                    ? 'Confirm Forward'
                : 'Confirm Deletion'

    const confirmMessage =
        confirmAction === 'accept'
            ? 'Are you sure you want to accept this referral?'
            : confirmAction === 'reject'
                ? 'Are you sure you want to reject this referral?'
                : confirmAction === 'forward'
                    ? 'Are you sure you want to forward this referral?'
                : 'Are you sure you want to delete this sent referral?'

    const confirmButtonLabel =
        confirmAction === 'accept'
            ? (actionLoading ? 'Accepting...' : 'Yes, Accept')
            : confirmAction === 'reject'
                ? (actionLoading ? 'Rejecting...' : 'Yes, Reject')
                : confirmAction === 'forward'
                    ? (actionLoading ? 'Forwarding...' : 'Yes, Forward')
                : (cancelLoading ? 'Deleting...' : 'Yes, Delete Referral')

    const confirmButtonClass =
        confirmAction === 'accept'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : confirmAction === 'reject'
                ? 'bg-red-600 hover:bg-red-700'
                : confirmAction === 'forward'
                    ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-red-700 hover:bg-red-800'

    const isConfirmBusy =
        confirmAction === 'cancel' ? cancelLoading : actionLoading
    const confirmError = confirmAction === 'cancel' ? cancelError : actionError

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{t('mr.title')}</h2>
                <div className="flex gap-1 flex-wrap">
                    {['all', 'draft', 'pending', 'pending_routing', 'accepted', 'forwarded', 'completed', 'rejected'].map(v => (
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
                                        onClick={() => {
                                            setSelected(ref.id)
                                            navigate(`/referrals/my/${ref.id}`)
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selected === ref.id
                                            ? isDark ? 'border-primary-500/60 bg-primary-500/10' : 'border-primary-400 bg-primary-50'
                                            : isDark ? 'border-surface-800 bg-surface-950 hover:border-surface-700' : 'border-surface-200 hover:border-surface-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold truncate pr-2">{ref.patientName}</span>
                                            <StatusBadge type="priority" value={ref.priority} />
                                        </div>
                                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
                                            Referral ID: {ref.id}
                                        </p>
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

                            <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 ${isDark ? 'border-primary-500/20 bg-primary-500/10' : 'border-primary-200 bg-primary-50'}`}>
                                <IconHash size={16} className="text-primary-500" />
                                <div>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>Referral ID</p>
                                    <p className="text-base font-bold tracking-wide">{selectedRef.id}</p>
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
                                {selectedRef.department && (
                                    <div className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                                        Receiving Department: <strong className={isDark ? 'text-surface-300' : 'text-surface-700'}>{selectedRef.department}</strong>
                                    </div>
                                )}

                                <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${isDark ? 'border-surface-700 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                    <p className="font-semibold uppercase tracking-wide text-surface-500">Referring User</p>
                                    <p>ID: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.referringUserId || '—'}</strong></p>
                                    <p>Name: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.referringUserName || '—'}</strong></p>
                                    <p>Department: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.referringUserDepartment || '—'}</strong></p>
                                    <p>Phone: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.referringUserPhone || '—'}</strong></p>
                                    <p>Email: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.referringUserEmail || '—'}</strong></p>
                                </div>

                                {(selectedRef.acceptedByUserId || selectedRef.acceptedByUserName) && (
                                    <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50'}`}>
                                        <p className="font-semibold uppercase tracking-wide text-emerald-600">Accepted By</p>
                                        <p>ID: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.acceptedByUserId || '—'}</strong></p>
                                        <p>Name: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.acceptedByUserName || '—'}</strong></p>
                                        <p>Department: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.acceptedByUserDepartment || '—'}</strong></p>
                                        <p>Phone: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.acceptedByUserPhone || '—'}</strong></p>
                                        <p>Email: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.acceptedByUserEmail || '—'}</strong></p>
                                    </div>
                                )}

                                {(selectedRef.rejectedByUserId || selectedRef.rejectedByUserName || selectedRef.rejectionReason) && (
                                    <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${isDark ? 'border-red-500/30 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
                                        <p className="font-semibold uppercase tracking-wide text-red-600">Rejected By</p>
                                        <p>ID: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.rejectedByUserId || '—'}</strong></p>
                                        <p>Name: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.rejectedByUserName || '—'}</strong></p>
                                        <p>Department: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.rejectedByUserDepartment || '—'}</strong></p>
                                        <p>Phone: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.rejectedByUserPhone || '—'}</strong></p>
                                        <p>Email: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.rejectedByUserEmail || '—'}</strong></p>
                                        <p>Reason: <strong className={isDark ? 'text-surface-200' : 'text-surface-800'}>{selectedRef.rejectionReason || '—'}</strong></p>
                                    </div>
                                )}
                            </div>

                            {selectedRef.status === 'draft' && (
                                <div className="mt-5">
                                    <button
                                        onClick={handleSubmitDraft}
                                        disabled={submitLoading}
                                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 disabled:opacity-60"
                                    >
                                        {submitLoading ? 'Submitting...' : 'Submit Draft Referral'}
                                    </button>
                                    {submitError && (
                                        <p className="text-xs text-red-500 mt-2">{submitError}</p>
                                    )}
                                </div>
                            )}

                            {canCancelSentReferral && (
                                <div className="mt-3">
                                    <div className="flex gap-2">
                                        {canEditSentReferral && (
                                            <button
                                                onClick={() => navigate(`/referrals/new?editReferralId=${selectedRef.id}`)}
                                                className="px-4 py-2 rounded-lg text-xs font-semibold border border-primary-400 text-primary-500 hover:bg-primary-500/10"
                                            >
                                                Edit Referral
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setConfirmAction('cancel')}
                                            disabled={cancelLoading}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                        >
                                            {cancelLoading ? 'Deleting...' : 'Delete Referral'}
                                        </button>
                                    </div>
                                    {cancelError && (
                                        <p className="text-xs text-red-500 mt-2">{cancelError}</p>
                                    )}
                                </div>
                            )}

                            {canTakeLifecycleAction && (
                                <div className={`mt-5 p-4 rounded-xl border space-y-3 ${isDark ? 'border-surface-700 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Receiving Facility Actions</p>

                                    <div>
                                        <label className="block text-xs font-medium mb-1">Receiving Department</label>
                                        <select
                                            value={selectedDepartmentId}
                                            onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                            className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-surface-900 border-surface-700 text-surface-100' : 'bg-white border-surface-300 text-surface-900'}`}
                                        >
                                            <option value="">Select department</option>
                                            {availableDepartments.map((department) => (
                                                <option key={department.id} value={department.id}>{department.name}</option>
                                            ))}
                                        </select>
                                        {departmentLoading && (
                                            <p className="mt-1 text-[11px] text-surface-500">Loading departments...</p>
                                        )}
                                        {departmentError && (
                                            <p className="mt-1 text-[11px] text-red-500">{departmentError}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium mb-1">Rejection Reason</label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            rows={3}
                                            placeholder="Provide reason if rejecting this referral..."
                                            className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500' : 'bg-white border-surface-300 text-surface-900 placeholder:text-surface-400'}`}
                                        />
                                    </div>

                                    {canForwardReferral && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Forward To Facility</label>
                                                <select
                                                    value={forwardFacilityId}
                                                    onChange={(e) => setForwardFacilityId(e.target.value)}
                                                    className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-surface-900 border-surface-700 text-surface-100' : 'bg-white border-surface-300 text-surface-900'}`}
                                                >
                                                    <option value="">Select facility</option>
                                                    {facilities
                                                        .filter((facility) => facility.id !== selectedRef.receivingFacilityId)
                                                        .map((facility) => (
                                                            <option key={facility.id} value={facility.id}>
                                                                {facility.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-1">Forwarding Note</label>
                                                <textarea
                                                    value={forwardingNote}
                                                    onChange={(e) => setForwardingNote(e.target.value)}
                                                    rows={3}
                                                    placeholder="Explain why the referral is being forwarded..."
                                                    className={`w-full rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500' : 'bg-white border-surface-300 text-surface-900 placeholder:text-surface-400'}`}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setConfirmAction('accept')}
                                            disabled={actionLoading || !selectedDepartmentId}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {actionLoading ? 'Processing...' : 'Accept Referral'}
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction('reject')}
                                            disabled={actionLoading || !rejectReason.trim()}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                        >
                                            {actionLoading ? 'Processing...' : 'Reject Referral'}
                                        </button>
                                        {canForwardReferral && (
                                            <button
                                                onClick={() => setConfirmAction('forward')}
                                                disabled={actionLoading || !forwardFacilityId || !forwardingNote.trim()}
                                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                                            >
                                                {actionLoading ? 'Processing...' : 'Forward Referral'}
                                            </button>
                                        )}
                                    </div>

                                    {actionError && (
                                        <p className="text-xs text-red-500">{actionError}</p>
                                    )}
                                    {actionSuccess && (
                                        <p className="text-xs text-emerald-500">{actionSuccess}</p>
                                    )}
                                </div>
                            )}

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

            {confirmAction && (
                <Modal
                    title={confirmTitle}
                    onClose={() => setConfirmAction(null)}
                    maxWidth="max-w-md"
                    position="center"
                >
                    <div className="space-y-4">
                        <p className={`text-sm ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {confirmMessage}
                        </p>
                        {selectedRef && (
                            <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                Patient: <strong>{selectedRef.patientName}</strong> · Referral ID: <strong>{selectedRef.id}</strong>
                            </p>
                        )}
                        {confirmAction === 'reject' && rejectReason.trim() && (
                            <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                Reason: <strong>{rejectReason.trim()}</strong>
                            </p>
                        )}
                        {confirmAction === 'forward' && (
                            <>
                                <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                    Destination facility ID: <strong>{forwardFacilityId || '—'}</strong>
                                </p>
                                {forwardingNote.trim() && (
                                    <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                        Note: <strong>{forwardingNote.trim()}</strong>
                                    </p>
                                )}
                            </>
                        )}
                        {confirmError && (
                            <p className="text-xs text-red-500">{confirmError}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleConfirmAction}
                                disabled={isConfirmBusy}
                                className={`flex-1 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-60 ${confirmButtonClass}`}
                            >
                                {confirmButtonLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
