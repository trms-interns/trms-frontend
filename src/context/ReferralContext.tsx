import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { trmsApi, type ApiReferral, type DischargeSummary as ApiDischargeSummary } from '../lib/trmsApi'
import {
    mockDischargeSummaries,
    mockReferrals,
    type DischargeSummary,
    type Referral,
} from '../data/mockData'

const ENABLE_API_REFERRALS = import.meta.env.VITE_ENABLE_API_AUTH === 'true'

interface CompleteReferralInput {
    referralId: string
    treatmentSummary: string
    finalDiagnosis: string
    medicationsPrescribed: string
    followUpInstructions: string
    dischargeDate: string
    createdByUserId: string
    createdByName: string
}

interface ReferralContextType {
    referrals: Referral[]
    dischargeSummaries: DischargeSummary[]
    loading: boolean
    error: string | null
    completeReferral: (input: CompleteReferralInput) => Promise<void>
    refreshReferrals: () => Promise<void>
}

const ReferralContext = createContext<ReferralContextType>({
    referrals: [],
    dischargeSummaries: [],
    loading: false,
    error: null,
    completeReferral: async () => {},
    refreshReferrals: async () => {},
})

function apiReferralToReferral(apiReferral: ApiReferral): Referral {
    return {
        id: apiReferral.id,
        patientId: apiReferral.patient?.id || 'UNKNOWN',
        patientName: apiReferral.patient?.fullName || 'Unknown Patient',
        mrn: 'MRN-' + apiReferral.id.slice(0, 8),
        age: 0, // Would need to calculate from DOB
        sex: apiReferral.patient?.gender === 'male' ? 'Male' : 'Female',
        dateOfBirth: apiReferral.patient?.dateOfBirth,
        referringFacility: apiReferral.referringFacilityId,
        referringUserId: apiReferral.referringUserId,
        receivingFacility: apiReferral.receivingFacilityId,
        priority: apiReferral.priority === 'emergency' ? 'emergency' : apiReferral.priority === 'urgent' ? 'urgent' : 'routine',
        status: apiReferral.status as any,
        chiefComplaint: apiReferral.reasonForReferral,
        clinicalSummary: apiReferral.clinicalSummary,
        primaryDiagnosis: apiReferral.primaryDiagnosis,
        treatmentGiven: apiReferral.treatmentGiven,
        reasonForReferral: apiReferral.reasonForReferral,
        allergies: apiReferral.allergies,
        pastMedicalHistory: apiReferral.pastMedicalHistory,
        currentMedications: apiReferral.currentMedications,
        date: new Date(apiReferral.createdAt).toLocaleDateString(),
        hasImage: false,
        estimatedWaitingTime: apiReferral.waitingTime,
        appointmentDate: apiReferral.appointmentDate ? new Date(apiReferral.appointmentDate).toLocaleDateString() : undefined,
        rejectionReason: apiReferral.rejectionReason,
        forwardingNote: apiReferral.forwardingNote,
    }
}

function apiDischargeSummaryToDischargeSummary(apiSummary: ApiDischargeSummary): DischargeSummary {
    return {
        id: apiSummary.id,
        referralId: apiSummary.referralId,
        patientName: 'Patient', // Would need to fetch from referral
        treatmentSummary: apiSummary.summaryText,
        finalDiagnosis: apiSummary.finalDiagnosis,
        medicationsPrescribed: apiSummary.medicationsPrescribed,
        followUpInstructions: apiSummary.followUpInstructions,
        dischargeDate: apiSummary.dischargeDate,
        createdByUserId: apiSummary.createdByUserId,
        createdByName: 'Doctor',
        createdAt: new Date(apiSummary.createdAt).toLocaleString(),
    }
}

export function ReferralProvider({ children }: { children: ReactNode }) {
    const [referrals, setReferrals] = useState<Referral[]>(mockReferrals)
    const [dischargeSummaries, setDischargeSummaries] = useState<DischargeSummary[]>(mockDischargeSummaries)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const refreshReferrals = async () => {
        if (!ENABLE_API_REFERRALS) return

        setLoading(true)
        setError(null)
        try {
            const apiReferrals = await trmsApi.getReferrals()
            const convertedReferrals = apiReferrals.map(apiReferralToReferral)
            setReferrals(convertedReferrals)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch referrals')
            console.error('Error fetching referrals:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (ENABLE_API_REFERRALS) {
            refreshReferrals()
        }
    }, [])

    const completeReferral = async (input: CompleteReferralInput) => {
        if (ENABLE_API_REFERRALS) {
            try {
                await trmsApi.addDischargeSummary(input.referralId, {
                    summary: input.treatmentSummary,
                    finalDiagnosis: input.finalDiagnosis,
                    medicationsPrescribed: input.medicationsPrescribed,
                    followUpInstructions: input.followUpInstructions,
                    dischargeDate: input.dischargeDate,
                })
                await refreshReferrals()
                return
            } catch (err) {
                console.error('Error adding discharge summary:', err)
                setError(err instanceof Error ? err.message : 'Failed to add discharge summary')
                return
            }
        }

        // Mock fallback
        const targetReferral = referrals.find((referral) => referral.id === input.referralId)
        if (!targetReferral) return

        const createdAt = new Date().toLocaleString()

        setReferrals((current) =>
            current.map((referral) =>
                referral.id === input.referralId
                    ? {
                          ...referral,
                          status: 'completed',
                      }
                    : referral,
            ),
        )

        setDischargeSummaries((current) => {
            const nextSummary: DischargeSummary = {
                id: `DS-${Date.now()}`,
                referralId: input.referralId,
                patientName: targetReferral.patientName,
                treatmentSummary: input.treatmentSummary,
                finalDiagnosis: input.finalDiagnosis,
                medicationsPrescribed: input.medicationsPrescribed,
                followUpInstructions: input.followUpInstructions,
                dischargeDate: input.dischargeDate,
                createdByUserId: input.createdByUserId,
                createdByName: input.createdByName,
                createdAt,
            }

            const withoutPrevious = current.filter((summary) => summary.referralId !== input.referralId)
            return [nextSummary, ...withoutPrevious]
        })
    }

    const value = useMemo(
        () => ({
            referrals,
            dischargeSummaries,
            loading,
            error,
            completeReferral,
            refreshReferrals,
        }),
        [referrals, dischargeSummaries, loading, error],
    )

    return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>
}

export function useReferrals() {
    return useContext(ReferralContext)
}
