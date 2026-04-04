import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import StatusBadge from '../../components/StatusBadge'
import { mockReferrals, mockTriageActions } from '../../data/mockData'
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

export default function Triage() {
    const { t } = useLanguage()
    const { isDark } = useTheme()

    // TODO (Backend Team): Replace mockReferrals with an API call to fetch incoming priority referrals
    // E.g. GET /api/referrals?status=pending,synced
    const triageReferrals = mockReferrals.filter(r => ['synced', 'pending'].includes(r.status))
    // TODO (Backend Team): Replace mockTriageActions with an API call to fetch recent chronological triage history
    // E.g. GET /api/triage/actions
    const [actions, setActions] = useState<TriageActionRecord[]>(mockTriageActions)
    const [selectedRef, setSelectedRef] = useState<string | null>(null)

    // Modal state
    const [modal, setModal] = useState<ModalType>(null)
    const [actionRefId, setActionRefId] = useState('')
    // Reject / redirect
    const [rejectMsg, setRejectMsg] = useState('')
    const [redirectTo, setRedirectTo] = useState('')
    const [redirectReason, setRedirectReason] = useState('')
    // Accept message (auto-filled, editable)
    const [acceptMsg, setAcceptMsg] = useState('')
    // Report fields
    const [diagnosis, setDiagnosis] = useState('')
    const [treatment, setTreatment] = useState('')
    const [followUp, setFollowUp] = useState('')
    const [notes, setNotes] = useState('')

    const selected = mockReferrals.find(r => r.id === selectedRef)

    // Urgency groups
    const emergency = triageReferrals.filter(r => r.priority === 'emergency')
    const urgent = triageReferrals.filter(r => r.priority === 'urgent')
    const routine = triageReferrals.filter(r => r.priority === 'routine')

    const openModal = (type: ModalType, refId: string) => {
        setActionRefId(refId)
        const ref = mockReferrals.find(r => r.id === refId)
        if (type === 'accept' && ref) {
            setAcceptMsg(
                `Dear ${ref.referringFacility},\n\nWe are pleased to confirm the acceptance of your referral for patient ${ref.patientName} (${ref.mrn}). The patient has been scheduled for evaluation and admission.\n\nWarm regards,\nAyder Referral Hospital — Triage Team`
            )
        }
        setModal(type)
    }
    const closeModal = () => {
        setModal(null)
        setRejectMsg(''); setRedirectTo(''); setRedirectReason('')
        setDiagnosis(''); setTreatment(''); setFollowUp(''); setNotes('')
    }

    const handleAccept = () => {
        const ref = mockReferrals.find(r => r.id === actionRefId)
        if (!ref) return
        
        // TODO (Backend Team): Implement API call to accept referral and send notification to sender.
        // E.g. POST /api/referrals/{actionRefId}/accept with { notificationMessage: acceptMsg }
        
        setActions(prev => [
            { id: `TA-${Date.now()}`, referralId: actionRefId, patientName: ref.patientName, action: 'accepted', by: 'Ato Gebre', timestamp: new Date().toLocaleString(), note: acceptMsg.split('\n')[0] },
            ...prev,
        ])
        closeModal()
    }

    const handleReject = () => {
        const ref = mockReferrals.find(r => r.id === actionRefId)
        if (!ref || !rejectMsg) return
        
        // TODO (Backend Team): Implement API call to reject referral and send reason.
        // E.g. POST /api/referrals/{actionRefId}/reject with { reason: rejectMsg }
        
        setActions(prev => [
            { id: `TA-${Date.now()}`, referralId: actionRefId, patientName: ref.patientName, action: 'rejected', by: 'Ato Gebre', timestamp: new Date().toLocaleString(), note: rejectMsg },
            ...prev,
        ])
        closeModal()
    }

    const handleRedirect = () => {
        const ref = mockReferrals.find(r => r.id === actionRefId)
        if (!ref || !redirectTo) return
        
        // TODO (Backend Team): Implement API call to redirect referral.
        // E.g. POST /api/referrals/{actionRefId}/redirect with { targetLocation: redirectTo, reason: redirectReason }
        
        setActions(prev => [
            { id: `TA-${Date.now()}`, referralId: actionRefId, patientName: ref.patientName, action: 'redirected', by: 'Ato Gebre', timestamp: new Date().toLocaleString(), note: `Redirected to ${redirectTo}. ${redirectReason}` },
            ...prev,
        ])
        closeModal()
    }

    const handleReport = () => {
        // TODO (Backend Team): Implement API call to submit post-treatment clinical report.
        // E.g. POST /api/referrals/{selectedRef}/report with payload: { diagnosis, treatment, followUp, notes }
        closeModal()
    }

    const cardBase = `rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const panelBase = `rounded-2xl border p-4 shadow-sm ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const textareaCls = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none leading-relaxed ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'} transition-colors`
    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 placeholder-surface-500 focus:border-primary-400' : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'} transition-colors`

    function ReferralCard({ ref: r, i }: { ref: typeof mockReferrals[0]; i: number }) {
        const isSelected = selectedRef === r.id
        return (
            <button
                key={r.id}
                onClick={() => setSelectedRef(r.id)}
                className={`w-full text-left rounded-lg p-3.5 border transition-all duration-150 hover:-translate-y-0.5
                    ${isSelected
                        ? isDark ? 'border-[#2b4968]/60 bg-[#2b4968]/10 shadow-md shadow-[#2b4968]/20' : 'border-[#2b4968] bg-[#2b4968]/10 shadow-md shadow-[#2b4968]/10'
                        : isDark ? 'border-surface-800 bg-surface-950 hover:border-surface-700' : 'border-surface-200 bg-white hover:border-surface-300'
                    }
                    ${r.priority === 'emergency' ? 'border-l-4 border-l-red-600' : r.priority === 'urgent' ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-[#2b4968]'}`}
                style={{ animationDelay: `${i * 40}ms` }}
            >
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold truncate pr-2">{r.patientName}</span>
                    <StatusBadge type="priority" value={r.priority} />
                </div>
                <p className={`text-xs truncate ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>{r.chiefComplaint}</p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{t('tri.from')}: {r.referringFacility} · {r.date}</p>
            </button>
        )
    }

    function Section({ label, color, dot, items }: { label: string; color: string; dot: string; items: typeof mockReferrals }) {
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

    // ── Modal backdrop ──────────────────────────────────────────────────────
    function Modal({ title, icon, children, onClose }: { title: string; icon: React.ReactNode; children: React.ReactNode; onClose: () => void }) {
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

    return (
        <div className="space-y-5 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('tri.title')}</h2>

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
                    <div className={`rounded-xl border px-3 py-2 ${isDark ? 'border-amber-400/60 bg-amber-950/40' : 'border-amber-300 bg-amber-50'}`}>
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>Urgent</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>{urgent.length}</p>
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
                                <span className="text-sm font-semibold">{t('tri.incoming')} ({triageReferrals.length})</span>
                                <p className={`text-[11px] ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>Sorted by clinical urgency</p>
                            </div>
                        </div>
                        <Section label="Emergency" color="text-red-500" dot="bg-red-500" items={emergency} />
                        <Section label="Urgent" color="text-amber-400" dot="bg-amber-400" items={urgent} />
                        <Section label="Routine" color="text-[#2b4968]" dot="bg-[#2b4968]" items={routine} />
                        {triageReferrals.length === 0 && (
                            <div className="text-center py-8">
                                <IconCircleCheck size={24} className="mx-auto text-emerald-400 mb-2" />
                                <p className="text-sm text-surface-500">All referrals triaged</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Detail panel ────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    {selected ? (
                        <>
                            <div className={cardBase}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold ${selected.priority === 'emergency' ? 'bg-red-600' : selected.priority === 'urgent' ? 'bg-amber-400' : 'bg-[#2b4968]'}`}>
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

                            {/* Action buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => openModal('accept', selected.id)}
                                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all hover:-translate-y-0.5"
                                >
                                    <IconCircleCheck size={15} /> {t('tri.accept')}
                                </button>
                                <button
                                    onClick={() => openModal('reject', selected.id)}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all hover:-translate-y-0.5"
                                >
                                    <IconCircleX size={15} /> {t('tri.reject')}
                                </button>
                                <button
                                    onClick={() => openModal('redirect', selected.id)}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold border transition-all hover:-translate-y-0.5 ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                                >
                                    <IconArrowsLeftRight size={15} /> {t('tri.redirect')}
                                </button>
                            </div>

                            {/* Write Report button for already-accepted patients */}
                            <button
                                onClick={() => openModal('report', selected.id)}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:-translate-y-0.5 ${isDark ? 'border-[#2b4968]/40 text-[#2b4968] hover:bg-[#2b4968]/10' : 'border-[#2b4968]/60 text-[#2b4968] hover:bg-[#2b4968]/10'}`}
                            >
                                <IconFileText size={15} /> {t('tri.writeReport')}
                            </button>
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
                <Modal
                    title={t('tri.acceptMsg')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}><IconCircleCheck size={14} className={`${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} /></div>}
                    onClose={closeModal}
                >
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        The following acceptance notification will be sent to the referring facility.
                    </p>
                    <textarea
                        className={textareaCls}
                        rows={7}
                        value={acceptMsg}
                        onChange={e => setAcceptMsg(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleAccept} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
                            <IconSend size={14} /> IconSend & Confirm Acceptance
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </Modal>
            )}

            {/* ── REJECT MODAL ─────────────────────────────────────────────── */}
            {modal === 'reject' && (
                <Modal
                    title={t('tri.rejectReason')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}><IconCircleX size={14} className={`${isDark ? 'text-red-300' : 'text-red-600'}`} /></div>}
                    onClose={closeModal}
                >
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Write a clear rejection message that the referring facility will receive.
                    </p>
                    <textarea
                        className={textareaCls}
                        rows={5}
                        placeholder={`Dear [Facility],\n\nWe are unable to accept this referral at this time due to...\n\nReason: [clinical / capacity reason]\n\nRecommended next steps: ...`}
                        value={rejectMsg}
                        onChange={e => setRejectMsg(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleReject} disabled={!rejectMsg.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors">
                            <IconSend size={14} /> IconSend Rejection
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </Modal>
            )}

            {/* ── REDIRECT MODAL ───────────────────────────────────────────── */}
            {modal === 'redirect' && (
                <Modal
                    title={t('tri.redirectMsg')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2b4968]/20' : 'bg-[#2b4968]/10'}`}><IconArrowsLeftRight size={14} className={`${isDark ? 'text-[#2b4968]' : 'text-[#2b4968]'}`} /></div>}
                    onClose={closeModal}
                >
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Specify where the patient is being redirected and why.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-surface-400 mb-1 block">Redirect To (Department / Facility)</label>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="e.g. Orthopedics Dept. — Axum St. Mary Hospital"
                                value={redirectTo}
                                onChange={e => setRedirectTo(e.target.value)}
                            />
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
                        <button onClick={handleRedirect} disabled={!redirectTo.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2b4968] text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-[#2b4968]/90 transition-colors">
                            <IconSend size={14} /> IconSend Redirect Notice
                        </button>
                        <button onClick={closeModal} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                    </div>
                </Modal>
            )}

            {/* ── TREATMENT REPORT MODAL ───────────────────────────────────── */}
            {modal === 'report' && selected && (
                <Modal
                    title={t('tri.reportTitle')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconClipboardCheck size={14} className={`${isDark ? 'text-primary-300' : 'text-primary-600'}`} /></div>}
                    onClose={closeModal}
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
                </Modal>
            )}
        </div>
    )
}
