import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { trmsApi, type ApiReferral, type DischargeSummary as ApiDischargeSummary } from '../lib/trmsApi'
import { useAuth } from './AuthContext'
import type { DischargeSummary, Referral } from '../types/referrals'

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
    isSyncing: boolean
    lastSyncedAt: string | null
    syncError: string | null
    completeReferral: (input: CompleteReferralInput) => Promise<void>
    refreshReferrals: () => Promise<void>
    syncNow: () => Promise<void>
}

const ReferralContext = createContext<ReferralContextType>({
    referrals: [],
    dischargeSummaries: [],
    loading: false,
    error: null,
    isSyncing: false,
    lastSyncedAt: null,
    syncError: null,
    completeReferral: async () => {},
    refreshReferrals: async () => {},
    syncNow: async () => {},
})

function resolveName(
    id: string | null | undefined,
    fallbackName: string | null | undefined,
    map?: Record<string, string>,
): string {
    if (fallbackName && fallbackName.trim()) return fallbackName.trim()
    if (id && map?.[id]) return map[id]
    return id || 'Unknown'
}

function apiReferralToReferral(
    apiReferral: ApiReferral,
    nameMaps?: {
        facilityNameById?: Record<string, string>
        departmentNameById?: Record<string, string>
    },
): Referral {
    const referringFacilityName = resolveName(
        apiReferral.referringFacilityId,
        apiReferral.referringFacility?.name,
        nameMaps?.facilityNameById,
    )
    const receivingFacilityName = resolveName(
        apiReferral.receivingFacilityId,
        apiReferral.receivingFacility?.name,
        nameMaps?.facilityNameById,
    )
    const receivingDepartmentName = apiReferral.receivingDepartmentId
        ? resolveName(
              apiReferral.receivingDepartmentId,
              apiReferral.receivingDepartment?.name,
              nameMaps?.departmentNameById,
          )
        : undefined

    return {
        id: apiReferral.id,
        referralCode: apiReferral.referralCode,
        patientId: apiReferral.patient?.id || 'UNKNOWN',
        patientName: apiReferral.patient?.fullName || 'Unknown Patient',
        mrn: 'MRN-' + apiReferral.id.slice(0, 8),
        age: 0, // Would need to calculate from DOB
        sex: apiReferral.patient?.gender === 'male' ? 'Male' : 'Female',
        dateOfBirth: apiReferral.patient?.dateOfBirth,
        phone: apiReferral.patient?.phoneNumber || undefined,
        referringFacilityId: apiReferral.referringFacilityId,
        referringFacility: referringFacilityName,
        referringUserId: apiReferral.referringUserId,
        referringUserName: apiReferral.referringUser?.fullName || undefined,
        referringUserDepartment: apiReferral.referringUser?.departmentName || undefined,
        referringUserPhone: apiReferral.referringUser?.phone || undefined,
        referringUserEmail: apiReferral.referringUser?.email || undefined,
        receivingFacilityId: apiReferral.receivingFacilityId,
        receivingFacility: receivingFacilityName,
        receivingDepartmentId: apiReferral.receivingDepartmentId,
        department: receivingDepartmentName,
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
        clinicianAcceptedAt: apiReferral.clinicianAcceptedAt,
        clinicianAcceptedByUserId: apiReferral.clinicianAcceptedByUserId,
        clinicianAcceptedByUserName: apiReferral.clinicianAcceptedByUser?.fullName || undefined,
        clinicianAcceptedByUserDepartment: apiReferral.clinicianAcceptedByUser?.departmentName || undefined,
        clinicianAcceptedByUserPhone: apiReferral.clinicianAcceptedByUser?.phone || undefined,
        clinicianAcceptedByUserEmail: apiReferral.clinicianAcceptedByUser?.email || undefined,
        acceptedByUserId: apiReferral.acceptedByUserId,
        acceptedByUserName: apiReferral.acceptedByUser?.fullName || undefined,
        acceptedByUserDepartment: apiReferral.acceptedByUser?.departmentName || undefined,
        acceptedByUserPhone: apiReferral.acceptedByUser?.phone || undefined,
        acceptedByUserEmail: apiReferral.acceptedByUser?.email || undefined,
        rejectedByUserId: apiReferral.rejectedByUserId,
        rejectedByUserName: apiReferral.rejectedByUser?.fullName || undefined,
        rejectedByUserDepartment: apiReferral.rejectedByUser?.departmentName || undefined,
        rejectedByUserPhone: apiReferral.rejectedByUser?.phone || undefined,
        rejectedByUserEmail: apiReferral.rejectedByUser?.email || undefined,
        rejectionReason: apiReferral.rejectionReason,
        forwardingNote: apiReferral.forwardingNote,
    }
}

function apiDischargeSummaryToDischargeSummary(
    apiSummary: ApiDischargeSummary,
    patientName?: string,
): DischargeSummary {
    return {
        id: apiSummary.id,
        referralId: apiSummary.referralId,
        patientName: patientName || 'Patient',
        treatmentSummary: apiSummary.summaryText,
        finalDiagnosis: apiSummary.finalDiagnosis,
        medicationsPrescribed: apiSummary.medicationsPrescribed,
        followUpInstructions: apiSummary.followUpInstructions,
        dischargeDate: apiSummary.dischargeDate,
        createdByUserId: apiSummary.createdByUserId,
        createdByName: 'Doctor', // Could be enriched if API includes creator info
        createdAt: new Date(apiSummary.createdAt).toLocaleString(),
    }
}

export function ReferralProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth()
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [dischargeSummaries, setDischargeSummaries] = useState<DischargeSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncError, setSyncError] = useState<string | null>(null)
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
        () => localStorage.getItem('trms-last-sync-at'),
    )
    const [facilityNames, setFacilityNames] = useState<Record<string, string>>({})
    const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({})
    const [enrichmentLoaded, setEnrichmentLoaded] = useState(false)

    const refreshReferrals = async () => {
        const hasApiSession = isAuthenticated && Boolean(trmsApi.getToken())
        if (!hasApiSession) {
            setReferrals([])
            setDischargeSummaries([])
            return
        }

        setLoading(true)
        setError(null)
        try {
            const apiReferrals = await trmsApi.getReferrals()

            const convertedReferrals = apiReferrals.map((referral) =>
                apiReferralToReferral(referral, {
                    facilityNameById: facilityNames,
                    departmentNameById: departmentNames,
                }),
            )
            setReferrals(convertedReferrals)


            const fetchedSummaries: DischargeSummary[] = []
            for (const apiRef of apiReferrals) {
                if (apiRef.dischargeSummary) {
                    fetchedSummaries.push(
                        apiDischargeSummaryToDischargeSummary(
                            {
                                ...apiRef.dischargeSummary,
                                referralId: apiRef.id,
                            },
                            apiRef.patient?.fullName || 'Unknown Patient'
                        )
                    )
                }
            }
            setDischargeSummaries(fetchedSummaries)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch referrals')
            console.error('Error fetching referrals:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadEnrichmentData = async () => {
        if (!isAuthenticated || enrichmentLoaded) return
        try {
            const facilities = await trmsApi.getFacilities()
            const fNames: Record<string, string> = {}
            facilities.forEach(f => { fNames[f.id] = f.name })
            setFacilityNames(fNames)

            // Fetch departments for all facilities (now allowed in backend)
            const deptLists = await Promise.all(
                facilities.map(f => trmsApi.getDepartments(f.id).catch(() => []))
            )
            const dNames: Record<string, string> = {}
            deptLists.flat().forEach(d => { dNames[d.id] = d.name })
            setDepartmentNames(dNames)
        } catch (err) {
            console.error('Failed to load enrichment data:', err)
        } finally {
            setEnrichmentLoaded(true)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            void loadEnrichmentData().then(() => refreshReferrals())
        } else {
            setEnrichmentLoaded(false)
            setFacilityNames({})
            setDepartmentNames({})
        }
    }, [isAuthenticated])

  useEffect(() => {
    const hasApiSession = isAuthenticated && Boolean(trmsApi.getToken())
    if (!hasApiSession) return

    const timer = window.setInterval(() => {
      void refreshReferrals()
    }, 10000)

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshReferrals()
      }
    }

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
  }, [isAuthenticated])

    const syncNow = async () => {
        const hasApiSession = isAuthenticated && Boolean(trmsApi.getToken())
        if (!hasApiSession) return

        const baseCursor = lastSyncedAt || new Date(0).toISOString()
        const existingDeviceId = localStorage.getItem('trms-device-id')
        const deviceId =
            existingDeviceId ||
            `web-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
        localStorage.setItem('trms-device-id', deviceId)

        try {
            setIsSyncing(true)
            setSyncError(null)
            const response = await trmsApi.pushUnsyncedReferrals({
                syncVersion: 1,
                clientRequestId: `sync-${Date.now().toString(36)}`,
                deviceId,
                retryCount: 0,
                lastSyncAt: baseCursor,
                pullLimit: 200,
                pushedReferrals: [],
            })

            const nextSyncAt =
                response.syncCursor?.nextSince ||
                response.syncCursor?.serverTime ||
                new Date().toISOString()
            setLastSyncedAt(nextSyncAt)
            localStorage.setItem('trms-last-sync-at', nextSyncAt)
            await refreshReferrals()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sync failed.'
            setSyncError(message)
        } finally {
            setIsSyncing(false)
        }
    }

    const completeReferral = async (input: CompleteReferralInput) => {
        const hasApiSession = isAuthenticated && Boolean(trmsApi.getToken())
        if (hasApiSession) {
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
            isSyncing,
            lastSyncedAt,
            syncError,
            completeReferral,
            refreshReferrals,
            syncNow,
        }),
        [referrals, dischargeSummaries, loading, error, isSyncing, lastSyncedAt, syncError],
    )

    return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>
}

export function useReferrals() {
    return useContext(ReferralContext)
}
