import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
    mockDischargeSummaries,
    mockReferrals,
    type DischargeSummary,
    type Referral,
} from '../data/mockData'

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
    completeReferral: (input: CompleteReferralInput) => void
}

const ReferralContext = createContext<ReferralContextType>({
    referrals: [],
    dischargeSummaries: [],
    completeReferral: () => {},
})

export function ReferralProvider({ children }: { children: ReactNode }) {
    const [referrals, setReferrals] = useState<Referral[]>(mockReferrals)
    const [dischargeSummaries, setDischargeSummaries] = useState<DischargeSummary[]>(mockDischargeSummaries)

    const completeReferral = (input: CompleteReferralInput) => {
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
            completeReferral,
        }),
        [referrals, dischargeSummaries],
    )

    return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>
}

export function useReferrals() {
    return useContext(ReferralContext)
}
