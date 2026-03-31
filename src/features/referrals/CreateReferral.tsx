import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { mockFacilities } from '../../data/mockData'
import FormField from '../../components/FormField'
import {
    IconSend,
    IconCircleCheck,
    IconAlertTriangle,
} from '@tabler/icons-react'

interface FormState {
    patientName: string
    dateOfBirth: string
    gender: string
    phone: string
    receivingFacility: string
    priority: string
    reasonForReferral: string
    clinicalSummary: string
    primaryDiagnosis: string
    treatmentGiven: string
    vitalSigns: string
    allergies: string
    pastMedicalHistory: string
    currentMedications: string
    consent: boolean
}

const emptyForm: FormState = {
    patientName: '', dateOfBirth: '', gender: '', phone: '',
    receivingFacility: '', priority: '', reasonForReferral: '',
    clinicalSummary: '', primaryDiagnosis: '', treatmentGiven: '',
    vitalSigns: '', allergies: '', pastMedicalHistory: '',
    currentMedications: '', consent: false,
}

export default function CreateReferral() {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const [form, setForm] = useState<FormState>(emptyForm)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
    const [submitted, setSubmitted] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)

    const set = (key: keyof FormState, val: string | boolean) => {
        setForm(prev => ({ ...prev, [key]: val }))
        if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    }

    // Show service status for selected facility
    const selectedFacility = mockFacilities.find(f => f.id === form.receivingFacility)

    const validate = (): boolean => {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.patientName.trim()) e.patientName = t('common.required')
        if (!form.dateOfBirth) e.dateOfBirth = t('common.required')
        if (!form.gender) e.gender = t('common.required')
        if (!form.receivingFacility) e.receivingFacility = t('common.required')
        if (!form.priority) e.priority = t('common.required')
        if (!form.reasonForReferral.trim()) e.reasonForReferral = t('common.required')
        if (!form.clinicalSummary.trim()) e.clinicalSummary = t('common.required')
        if (!form.primaryDiagnosis.trim()) e.primaryDiagnosis = t('common.required')
        if (!form.consent) e.consent = 'Consent is required to proceed.'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return
        // TODO (Backend Team): POST /api/referrals { ...form, referringFacility: user.facility, referringUserId: userId }
        // Status = PENDING, auto-generate referral ID and timestamp
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4">
                    <IconCircleCheck size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t('cr.saved')}</h2>
                <p className={`text-sm text-center max-w-md ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    Referral for <strong>{form.patientName}</strong> has been saved with status <strong>PENDING</strong>.
                    It will be synced to {selectedFacility?.name || 'the receiving facility'} when connectivity is available.
                </p>
                <button
                    onClick={() => { setForm(emptyForm); setSubmitted(false); setStep(1) }}
                    className="mt-6 px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors"
                >
                    Create Another Referral
                </button>
            </div>
        )
    }

    const card = `rounded-2xl border p-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold">{t('cr.title')}</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    Referring from: <strong>{user?.facility}</strong> · {user?.name}
                </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${step === 1 ? 'bg-primary-500/15 text-primary-500' : isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary-600 text-white' : isDark ? 'bg-surface-800 text-surface-400' : 'bg-surface-200 text-surface-500'}`}>1</span>
                    {t('cr.patientSection')}
                </button>
                <div className={`w-8 h-px ${isDark ? 'bg-surface-700' : 'bg-surface-300'}`} />
                <button onClick={() => setStep(2)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${step === 2 ? 'bg-primary-500/15 text-primary-500' : isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary-600 text-white' : isDark ? 'bg-surface-800 text-surface-400' : 'bg-surface-200 text-surface-500'}`}>2</span>
                    {t('cr.clinicalSection')}
                </button>
            </div>

            {/* Step 1: Patient Details */}
            {step === 1 && (
                <div className={card}>
                    <h3 className="text-sm font-bold mb-5">{t('cr.patientSection')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label={t('ref.patientName')} required value={form.patientName} onChange={e => set('patientName', (e.target as HTMLInputElement).value)} error={errors.patientName} placeholder="Full name" />
                        <FormField label={t('ref.dateOfBirth')} required type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', (e.target as HTMLInputElement).value)} error={errors.dateOfBirth} />
                        <FormField label={t('ref.gender')} required as="select" value={form.gender} onChange={e => set('gender', (e.target as HTMLSelectElement).value)} error={errors.gender} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                        <FormField label={t('ref.phone')} value={form.phone} onChange={e => set('phone', (e.target as HTMLInputElement).value)} placeholder="+251-..." hint="Optional" />
                    </div>

                    {/* Read-only referring facility */}
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-surface-950 border border-surface-800' : 'bg-surface-50 border border-surface-200'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>{t('ref.referringFacility')}</p>
                        <p className="text-sm font-medium mt-0.5">{user?.facility} <span className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>(auto-filled, read-only)</span></p>
                    </div>

                    <div className="flex justify-end mt-5">
                        <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors">
                            Next: Clinical Details →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Clinical Details */}
            {step === 2 && (
                <div className={card}>
                    <h3 className="text-sm font-bold mb-5">{t('cr.clinicalSection')}</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label={t('ref.receivingFacility')}
                                required
                                as="select"
                                value={form.receivingFacility}
                                onChange={e => set('receivingFacility', (e.target as HTMLSelectElement).value)}
                                error={errors.receivingFacility}
                                options={mockFacilities.map(f => ({ value: f.id, label: `${f.name} (${f.location})` }))}
                            />
                            <FormField
                                label={t('ref.priority')}
                                required
                                as="select"
                                value={form.priority}
                                onChange={e => set('priority', (e.target as HTMLSelectElement).value)}
                                error={errors.priority}
                                options={[
                                    { value: 'routine', label: 'Routine' },
                                    { value: 'urgent', label: 'Urgent' },
                                    { value: 'emergency', label: 'Emergency' },
                                ]}
                            />
                        </div>

                        {/* Service status warning — FD-04 / FD-05 */}
                        {selectedFacility && (
                            <div className={`p-3 rounded-lg border space-y-1 ${isDark ? 'bg-surface-950 border-surface-800' : 'bg-surface-50 border-surface-200'}`}>
                                <p className="text-[10px] font-semibold uppercase text-surface-400 tracking-wide">Service Status — {selectedFacility.name}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedFacility.departments.map(d => (
                                        <span key={d.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                            d.status === 'available' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' :
                                            d.status === 'limited' ? 'bg-amber-500/15 text-amber-500 border-amber-500/25' :
                                            'bg-red-500/15 text-red-500 border-red-500/25'
                                        }`}>
                                            {d.status === 'unavailable' && <IconAlertTriangle size={9} />}
                                            {d.name}: {d.status}{d.estimatedDelayDays ? ` (${d.estimatedDelayDays}d)` : ''}
                                        </span>
                                    ))}
                                </div>
                                {selectedFacility.departments.some(d => d.status === 'unavailable') && (
                                    <p className="text-[11px] text-amber-500 font-medium mt-2 flex items-center gap-1">
                                        <IconAlertTriangle size={12} /> Some services are unavailable at this facility. You may proceed or choose another.
                                    </p>
                                )}
                            </div>
                        )}

                        <FormField label={t('ref.reason')} required as="textarea" rows={2} value={form.reasonForReferral} onChange={e => set('reasonForReferral', (e.target as HTMLTextAreaElement).value)} error={errors.reasonForReferral} placeholder="Why is this patient being referred?" />
                        <FormField label={t('ref.clinicalSummary')} required as="textarea" rows={3} value={form.clinicalSummary} onChange={e => set('clinicalSummary', (e.target as HTMLTextAreaElement).value)} error={errors.clinicalSummary} placeholder="History, examination findings, and investigations..." />
                        <FormField label={t('ref.primaryDiagnosis')} required value={form.primaryDiagnosis} onChange={e => set('primaryDiagnosis', (e.target as HTMLInputElement).value)} error={errors.primaryDiagnosis} placeholder="e.g. Pre-eclampsia with severe features" />
                        <FormField label={t('ref.treatmentGiven')} as="textarea" rows={2} value={form.treatmentGiven} onChange={e => set('treatmentGiven', (e.target as HTMLTextAreaElement).value)} placeholder="Treatment already provided before referral" hint="Optional" />

                        {/* Optional fields */}
                        <details className={`rounded-lg border p-3 ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
                            <summary className={`text-xs font-semibold cursor-pointer ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>Optional Clinical Fields</summary>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <FormField label="Vital Signs" value={form.vitalSigns} onChange={e => set('vitalSigns', (e.target as HTMLInputElement).value)} placeholder="BP, Pulse, Temp, SPO2..." />
                                <FormField label="Known Allergies" value={form.allergies} onChange={e => set('allergies', (e.target as HTMLInputElement).value)} placeholder="NKDA or list..." />
                                <FormField label="Past Medical History" as="textarea" rows={2} value={form.pastMedicalHistory} onChange={e => set('pastMedicalHistory', (e.target as HTMLTextAreaElement).value)} />
                                <FormField label="Current Medications" as="textarea" rows={2} value={form.currentMedications} onChange={e => set('currentMedications', (e.target as HTMLTextAreaElement).value)} />
                            </div>
                        </details>

                        {/* Consent checkbox — RC-08 */}
                        <div className={`p-4 rounded-lg border ${errors.consent ? 'border-red-500' : isDark ? 'border-surface-800' : 'border-surface-200'} ${isDark ? 'bg-surface-950' : 'bg-surface-50'}`}>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.consent}
                                    onChange={e => set('consent', e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded accent-primary-600"
                                />
                                <span className={`text-xs leading-relaxed ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                                    {t('ref.consent')}
                                </span>
                            </label>
                            {errors.consent && <p className="text-[11px] text-red-500 font-medium mt-2">{errors.consent}</p>}
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setStep(1)} className={`px-5 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>
                                ← Back
                            </button>
                            <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors">
                                <IconSend size={14} /> {t('cr.submit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
