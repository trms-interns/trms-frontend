import React, { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { trmsApi, type ApiFacility, type ApiUser, type Department, type ApiUserRole, type AuditChainVerificationResult, apiRoleToAppRole } from '../../lib/trmsApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import ToastStack, { type ToastItem } from '../../components/ToastStack'
import DashboardMiniChart from '../../components/DashboardMiniChart'
import {
    IconServer,
    IconPlus,
    IconEdit,
    IconCircleCheck,
    IconCircleX,
    IconShield,
    IconUser,
    IconSearch,
    IconChartBar,
    IconDownload,
    IconUsers,
    IconKey,
} from '@tabler/icons-react'

interface UiNotice {
    type: 'success' | 'error'
    message: string
}

interface BackendReportSummary {
    totalFacilities: number
    totalReferrals: number
    accepted: number
    rejected: number
    completed: number
    pending: number
}

interface SystemReportRow {
    facilityId: string
    facilityName: string
    period: string
    priority: 'routine' | 'urgent' | 'emergency' | 'all'
    sent: number
    received: number
    accepted: number
    rejected: number
    forwarded: number
    completed: number
    pending: number
}

function monthOffsetValue(offset: number): string {
    const date = new Date()
    date.setMonth(date.getMonth() + offset)
    return date.toISOString().slice(0, 7)
}

export default function SysAdminDashboard() {
    type SortDirection = 'asc' | 'desc'
    type FacilitySortKey = 'name' | 'location' | 'type' | 'status' | 'services'
    type UserSortKey = 'fullName' | 'username' | 'role' | 'facilityId' | 'status'
    const PAGE_SIZE = 10

    const resolveBackendAssetUrl = (value?: string) => {
        if (!value) return ''
        if (value.startsWith('http://') || value.startsWith('https://')) return value

        const base = import.meta.env.VITE_API_BASE_URL
        if (typeof base === 'string' && base.startsWith('http')) {
            try {
                return new URL(value, base).toString()
            } catch {
                return value
            }
        }

        // In same-origin deployments, backend assets like `/api/v1/uploads/...` should work as-is.
        return value
    }

    const { t } = useLanguage()
    const { isDark } = useTheme()
    const [tab, setTab] = useState<'facilities' | 'users' | 'audit' | 'reports'>('facilities')
    const [showAddFacility, setShowAddFacility] = useState(false)
    const [showAddUser, setShowAddUser] = useState(false)
    const [editingFacility, setEditingFacility] = useState<ApiFacility | null>(null)
    const [editingUser, setEditingUser] = useState<ApiUser | null>(null)
    const [confirmDeleteFacility, setConfirmDeleteFacility] = useState<ApiFacility | null>(null)
    const [confirmDeleteUser, setConfirmDeleteUser] = useState<ApiUser | null>(null)
    const [resetPasswordUser, setResetPasswordUser] = useState<ApiUser | null>(null)
    const [saving, setSaving] = useState(false)
    const [deletingFacilityId, setDeletingFacilityId] = useState<string | null>(null)
    const [reactivatingFacilityId, setReactivatingFacilityId] = useState<string | null>(null)
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [showInactiveFacilities, setShowInactiveFacilities] = useState(false)
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const [uploadingFacilityImage, setUploadingFacilityImage] = useState<'new' | 'edit' | null>(null)
    const [uploadingUserImage, setUploadingUserImage] = useState(false)
    const [resettingUserPassword, setResettingUserPassword] = useState(false)
    const [resetPasswordError, setResetPasswordError] = useState('')
    const [resetPasswordForm, setResetPasswordForm] = useState({
        password: '',
        confirmPassword: '',
    })
    const [newFacility, setNewFacility] = useState({
        name: '',
        type: 'general_hospital' as 'health_center' | 'primary_hospital' | 'general_hospital' | 'specialized_hospital',
        location: '',
        contact: '',
        adminUsername: '',
        adminPassword: '',
        profileImageUrl: '',
    })
    const [newFacilityErrors, setNewFacilityErrors] = useState<Partial<Record<'name' | 'type' | 'adminUsername' | 'adminPassword', string>>>({})
    const [newUser, setNewUser] = useState({
        fullName: '',
        username: '',
        role: 'doctor' as ApiUserRole,
        facilityId: '',
        departmentId: '',
        initialPassword: '',
        profileImageUrl: '',
    })
    const [newUserErrors, setNewUserErrors] = useState<Partial<Record<'fullName' | 'username' | 'role' | 'facilityId' | 'departmentId' | 'initialPassword', string>>>({})
    const [facilitySearch, setFacilitySearch] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [facilityPage, setFacilityPage] = useState(1)
    const [userPage, setUserPage] = useState(1)
    const [facilitySortKey, setFacilitySortKey] = useState<FacilitySortKey>('name')
    const [facilitySortDirection, setFacilitySortDirection] = useState<SortDirection>('asc')
    const [userSortKey, setUserSortKey] = useState<UserSortKey>('fullName')
    const [userSortDirection, setUserSortDirection] = useState<SortDirection>('asc')
    const [auditSearch, setAuditSearch] = useState('')
    const [verifyingAuditChain, setVerifyingAuditChain] = useState(false)
    const [facilities, setFacilities] = useState<ApiFacility[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [loadingDepartments, setLoadingDepartments] = useState(false)
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [users, setUsers] = useState<ApiUser[]>([])
    const [loading, setLoading] = useState(true)
    const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().slice(0, 7))
    const [reportPriority, setReportPriority] = useState<'' | 'routine' | 'urgent' | 'emergency'>('')
    const [reportLoading, setReportLoading] = useState(false)
    const [systemReportRows, setSystemReportRows] = useState<SystemReportRow[]>([])
    const [backendReportSummary, setBackendReportSummary] = useState<BackendReportSummary>({
        totalFacilities: 0,
        totalReferrals: 0,
        accepted: 0,
        rejected: 0,
        completed: 0,
        pending: 0,
    })

    const showNotice = (next: UiNotice) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        setToasts((current) => [...current, { id, ...next }])
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id))
        }, 3500)
    }

    const dismissToast = (id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }

    const loadAdminData = async () => {
        setLoading(true)
        try {
            const [facilitiesData, auditData, usersData] = await Promise.all([
                trmsApi.getFacilities(),
                trmsApi.getAuditLogs(),
                trmsApi.getUsers(),
            ])
            setFacilities(facilitiesData)
            setAuditLogs(auditData)
            setUsers(usersData)
        } catch (error) {
            console.error('Failed to fetch admin data:', error)
            showNotice({ type: 'error', message: 'Failed to fetch admin data.' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAdminData()
    }, [])

    const handleDeleteFacility = async (facility: ApiFacility) => {
        try {
            setDeletingFacilityId(facility.id)
            await trmsApi.deleteFacility(facility.id)
            setFacilities((current) => current.filter((item) => item.id !== facility.id))
            showNotice({ type: 'success', message: `"${facility.name}" was deactivated.` })
            setConfirmDeleteFacility(null)
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to delete facility.' })
        } finally {
            setDeletingFacilityId(null)
        }
    }

    const handleReactivateFacility = async (facility: ApiFacility) => {
        try {
            setReactivatingFacilityId(facility.id)
            await trmsApi.updateFacility(facility.id, { active: true })
            await loadAdminData()
            showNotice({ type: 'success', message: `"${facility.name}" was reactivated.` })
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to reactivate facility.' })
        } finally {
            setReactivatingFacilityId(null)
        }
    }

    const resetNewFacilityForm = () => {
        setNewFacility({
            name: '',
            type: 'general_hospital',
            location: '',
            contact: '',
            adminUsername: '',
            adminPassword: '',
            profileImageUrl: '',
        })
        setNewFacilityErrors({})
    }

    const resetNewUserForm = () => {
        setNewUser({
            fullName: '',
            username: '',
            role: 'doctor',
            facilityId: '',
            departmentId: '',
            initialPassword: '',
            profileImageUrl: '',
        })
        setDepartments([])
        setNewUserErrors({})
    }

    const handleFacilityImageUpload = async (mode: 'new' | 'edit', file?: File | null) => {
        if (!file) return

        try {
            setUploadingFacilityImage(mode)
            const uploaded = await trmsApi.uploadImage(file)
            if (mode === 'new') {
                setNewFacility((current) => ({ ...current, profileImageUrl: uploaded.url }))
            } else {
                setEditingFacility((current) =>
                    current ? { ...current, profileImageUrl: uploaded.url } : current,
                )
            }
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to upload image.' })
        } finally {
            setUploadingFacilityImage(null)
        }
    }

    const handleUserImageUpload = async (file?: File | null) => {
        if (!file) return

        try {
            setUploadingUserImage(true)
            const uploaded = await trmsApi.uploadImage(file)
            setNewUser((current) => ({ ...current, profileImageUrl: uploaded.url }))
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to upload image.' })
        } finally {
            setUploadingUserImage(false)
        }
    }

    const handleCreateFacility = async () => {
        const errors: Partial<Record<'name' | 'type' | 'adminUsername' | 'adminPassword', string>> = {}
        if (!newFacility.name.trim()) errors.name = 'Facility name is required.'
        if (!newFacility.type) errors.type = 'Facility type is required.'
        if (!newFacility.adminUsername.trim()) errors.adminUsername = 'Admin username is required.'
        if (!newFacility.adminPassword.trim()) errors.adminPassword = 'Admin password is required.'
        setNewFacilityErrors(errors)

        if (Object.keys(errors).length > 0) {
            showNotice({ type: 'error', message: 'Please fill in all required facility fields.' })
            return
        }

        try {
            setSaving(true)
            const createdFacility = await trmsApi.createFacility({
                name: newFacility.name.trim(),
                type: newFacility.type,
                location: newFacility.location.trim() || undefined,
                contact: newFacility.contact.trim() || undefined,
                adminUsername: newFacility.adminUsername.trim(),
                adminPassword: newFacility.adminPassword,
            })
            if (newFacility.profileImageUrl) {
                await trmsApi.updateFacility(createdFacility.id, {
                    profileImageUrl: newFacility.profileImageUrl,
                })
            }
            await loadAdminData()
            setShowAddFacility(false)
            resetNewFacilityForm()
            showNotice({ type: 'success', message: 'Facility created successfully.' })
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to create facility.' })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveFacility = async () => {
        if (!editingFacility) return

        try {
            setSaving(true)
            const updated = await trmsApi.updateFacility(editingFacility.id, {
                name: editingFacility.name,
                location: editingFacility.location,
                contact: editingFacility.contact,
                profileImageUrl: editingFacility.profileImageUrl,
            })
            setFacilities((current) =>
                current.map((facility) => (facility.id === updated.id ? updated : facility)),
            )
            setEditingFacility(null)
            showNotice({ type: 'success', message: 'Facility updated successfully.' })
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to update facility.' })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async (userToDelete: ApiUser) => {
        try {
            setDeletingUserId(userToDelete.id)
            await trmsApi.deleteUser(userToDelete.id)
            setUsers((current) => current.filter((user) => user.id !== userToDelete.id))
            showNotice({ type: 'success', message: `User "${userToDelete.fullName}" deleted.` })
            setConfirmDeleteUser(null)
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to delete user.' })
        } finally {
            setDeletingUserId(null)
        }
    }

    const handleVerifyAuditChain = async () => {
        try {
            setVerifyingAuditChain(true)
            const result: AuditChainVerificationResult = await trmsApi.verifyAuditChain()
            if (result.valid) {
                showNotice({
                    type: 'success',
                    message: `Audit chain verified. Checked ${result.checkedEntries} entries with no breaks.`,
                })
                return
            }

            const brokenCount = result.brokenEntryIds.length
            const sample = result.brokenEntryIds.slice(0, 3).join(', ')
            showNotice({
                type: 'error',
                message: `Audit chain check found ${brokenCount} broken entries (checked ${result.checkedEntries}).${sample ? ` Sample IDs: ${sample}` : ''}`,
            })
        } catch (error: any) {
            showNotice({
                type: 'error',
                message: error?.message || 'Failed to verify audit chain.',
            })
        } finally {
            setVerifyingAuditChain(false)
        }
    }

    const handleSaveUser = async () => {
        if (!editingUser) return

        try {
            setSaving(true)
            const updated = await trmsApi.updateUser(editingUser.id, {
                fullName: editingUser.fullName,
                role: editingUser.role,
                active: editingUser.active,
            })
            setUsers((current) =>
                current.map((user) => (user.id === updated.id ? updated : user)),
            )
            setEditingUser(null)
            showNotice({ type: 'success', message: 'User updated successfully.' })
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to update user.' })
        } finally {
            setSaving(false)
        }
    }

    const openResetPasswordModal = (targetUser: ApiUser) => {
        setResetPasswordUser(targetUser)
        setResetPasswordError('')
        setResetPasswordForm({
            password: '',
            confirmPassword: '',
        })
    }

    const handleResetUserPassword = async () => {
        if (!resetPasswordUser) return
        const password = resetPasswordForm.password.trim()
        const confirmPassword = resetPasswordForm.confirmPassword.trim()

        if (!password) {
            setResetPasswordError('Temporary password is required.')
            return
        }
        if (password.length < 8) {
            setResetPasswordError('Temporary password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setResetPasswordError('Passwords do not match.')
            return
        }

        try {
            setResettingUserPassword(true)
            setResetPasswordError('')
            await trmsApi.updateUser(resetPasswordUser.id, { password })
            setResetPasswordUser(null)
            setResetPasswordForm({ password: '', confirmPassword: '' })
            showNotice({
                type: 'success',
                message: `Password reset for "${resetPasswordUser.fullName}". User must change it on next login.`,
            })
            await loadAdminData()
        } catch (error: any) {
            setResetPasswordError(error?.message || 'Failed to reset password.')
        } finally {
            setResettingUserPassword(false)
        }
    }

    const handleCreateUser = async () => {
        const requiresDepartment = newUser.role !== 'facility_admin'
        const errors: Partial<Record<'fullName' | 'username' | 'role' | 'facilityId' | 'departmentId' | 'initialPassword', string>> = {}
        if (!newUser.fullName.trim()) errors.fullName = 'Full name is required.'
        if (!newUser.username.trim()) errors.username = 'Username is required.'
        if (!newUser.role) errors.role = 'Role is required.'
        if (!newUser.facilityId) errors.facilityId = 'Facility is required.'
        if (requiresDepartment && !newUser.departmentId) errors.departmentId = 'Department is required for this role.'
        if (!newUser.initialPassword.trim()) errors.initialPassword = 'Initial password is required.'
        setNewUserErrors(errors)

        if (Object.keys(errors).length > 0) {
            showNotice({ type: 'error', message: 'Please complete all required user fields.' })
            return
        }

        try {
            setSaving(true)
            await trmsApi.createUser({
                fullName: newUser.fullName.trim(),
                username: newUser.username.trim(),
                role: newUser.role,
                facilityId: newUser.facilityId,
                departmentId: requiresDepartment ? newUser.departmentId : undefined,
                initialPassword: newUser.initialPassword,
                profileImageUrl: newUser.profileImageUrl || undefined,
            })
            await loadAdminData()
            setShowAddUser(false)
            resetNewUserForm()
            showNotice({ type: 'success', message: 'User created successfully.' })
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Failed to create user.' })
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        const loadDepartments = async () => {
            if (!showAddUser || !newUser.facilityId) {
                setDepartments([])
                return
            }

            try {
                setLoadingDepartments(true)
                const result = await trmsApi.getDepartments(newUser.facilityId)
                setDepartments(result)
            } catch {
                setDepartments([])
                showNotice({ type: 'error', message: 'Failed to load departments for selected facility.' })
            } finally {
                setLoadingDepartments(false)
            }
        }

        loadDepartments()
    }, [showAddUser, newUser.facilityId])

    const normalizedAudit = auditLogs.map((entry) => {
        const userValue = String(entry.user ?? entry.userId ?? 'Unknown')
        const actionValue = String(entry.action ?? 'Unknown action')
        const recordValue = String(entry.recordId ?? entry.targetId ?? '—')
        const timestampValue = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString()
            : '—'

        return {
            ...entry,
            userValue,
            actionValue,
            recordValue,
            timestampValue,
        }
    })

    const filteredAudit = normalizedAudit.filter(a =>
        auditSearch === '' ||
        a.userValue.toLowerCase().includes(auditSearch.toLowerCase()) ||
        a.actionValue.toLowerCase().includes(auditSearch.toLowerCase()) ||
        a.recordValue.toLowerCase().includes(auditSearch.toLowerCase())
    )

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`
    const activeFacilities = useMemo(
        () => facilities.filter((facility) => (facility as any).active !== false),
        [facilities],
    )
    const inactiveFacilities = useMemo(
        () => facilities.filter((facility) => (facility as any).active === false),
        [facilities],
    )
    const visibleFacilities = useMemo(
        () => (showInactiveFacilities ? inactiveFacilities : activeFacilities),
        [showInactiveFacilities, inactiveFacilities, activeFacilities],
    )
    const facilityNameById = useMemo(
        () =>
            facilities.reduce<Record<string, string>>((acc, facility) => {
                acc[facility.id] = facility.name
                return acc
            }, {}),
        [facilities],
    )
    const filteredFacilities = useMemo(
        () =>
            visibleFacilities.filter((facility) => {
                const q = facilitySearch.trim().toLowerCase()
                if (!q) return true
                return (
                    facility.name.toLowerCase().includes(q) ||
                    String(facility.location || '').toLowerCase().includes(q) ||
                    String(facility.type || '').toLowerCase().includes(q)
                )
            }),
        [visibleFacilities, facilitySearch],
    )
    const filteredUsers = useMemo(
        () =>
            users.filter((u) => {
                const q = userSearch.trim().toLowerCase()
                if (!q) return true
                return (
                    u.fullName.toLowerCase().includes(q) ||
                    u.username.toLowerCase().includes(q) ||
                    String(u.role).toLowerCase().includes(q) ||
                    String(u.facilityId || '').toLowerCase().includes(q)
                )
            }),
        [users, userSearch],
    )

    useEffect(() => {
        setFacilityPage(1)
    }, [facilitySearch, showInactiveFacilities, facilities.length])

    useEffect(() => {
        setUserPage(1)
    }, [userSearch, users.length])

    const toggleFacilitySort = (key: FacilitySortKey) => {
        if (facilitySortKey === key) {
            setFacilitySortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
            return
        }
        setFacilitySortKey(key)
        setFacilitySortDirection('asc')
    }

    const toggleUserSort = (key: UserSortKey) => {
        if (userSortKey === key) {
            setUserSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
            return
        }
        setUserSortKey(key)
        setUserSortDirection('asc')
    }

    const sortedFacilities = useMemo(() => {
        const items = [...filteredFacilities]
        const direction = facilitySortDirection === 'asc' ? 1 : -1
        return items.sort((a, b) => {
            let left: string | number = ''
            let right: string | number = ''

            if (facilitySortKey === 'name') {
                left = a.name || ''
                right = b.name || ''
            } else if (facilitySortKey === 'location') {
                left = a.location || ''
                right = b.location || ''
            } else if (facilitySortKey === 'type') {
                left = a.type || ''
                right = b.type || ''
            } else if (facilitySortKey === 'services') {
                left = a.services?.length || 0
                right = b.services?.length || 0
            } else {
                left = (a as any).active === false ? 0 : 1
                right = (b as any).active === false ? 0 : 1
            }

            if (typeof left === 'number' && typeof right === 'number') {
                return (left - right) * direction
            }
            return String(left).localeCompare(String(right)) * direction
        })
    }, [filteredFacilities, facilitySortDirection, facilitySortKey])

    const sortedUsers = useMemo(() => {
        const items = [...filteredUsers]
        const direction = userSortDirection === 'asc' ? 1 : -1
        return items.sort((a, b) => {
            let left: string | number = ''
            let right: string | number = ''

            if (userSortKey === 'fullName') {
                left = a.fullName || ''
                right = b.fullName || ''
            } else if (userSortKey === 'username') {
                left = a.username || ''
                right = b.username || ''
            } else if (userSortKey === 'role') {
                left = apiRoleToAppRole(a.role)
                right = apiRoleToAppRole(b.role)
            } else if (userSortKey === 'facilityId') {
                left = facilityNameById[a.facilityId] || a.facilityId || ''
                right = facilityNameById[b.facilityId] || b.facilityId || ''
            } else {
                left = a.active === false ? 0 : 1
                right = b.active === false ? 0 : 1
            }

            if (typeof left === 'number' && typeof right === 'number') {
                return (left - right) * direction
            }
            return String(left).localeCompare(String(right)) * direction
        })
    }, [facilityNameById, filteredUsers, userSortDirection, userSortKey])

    const facilityTotalPages = Math.max(1, Math.ceil(sortedFacilities.length / PAGE_SIZE))
    const userTotalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))

    const pagedFacilities = sortedFacilities.slice((facilityPage - 1) * PAGE_SIZE, facilityPage * PAGE_SIZE)
    const pagedUsers = sortedUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE)

    useEffect(() => {
        if (facilityPage > facilityTotalPages) {
            setFacilityPage(facilityTotalPages)
        }
    }, [facilityPage, facilityTotalPages])

    useEffect(() => {
        if (userPage > userTotalPages) {
            setUserPage(userTotalPages)
        }
    }, [userPage, userTotalPages])

    const loadReportSummary = async (
        period: string,
        facilityList: ApiFacility[],
        priority?: 'routine' | 'urgent' | 'emergency',
    ) => {
        if (facilityList.length === 0) {
            setBackendReportSummary({
                totalFacilities: 0,
                totalReferrals: 0,
                accepted: 0,
                rejected: 0,
                completed: 0,
                pending: 0,
            })
            setSystemReportRows([])
            return
        }

        setReportLoading(true)
        try {
            const reportRows = await Promise.all(
                facilityList.map((facility) =>
                    trmsApi.getReport({
                        period,
                        facilityId: facility.id,
                        priority,
                    }),
                ),
            )

            const rows: SystemReportRow[] = facilityList.map((facility, index) => {
                const row: any = reportRows[index]
                const sent = Number(row?.sent ?? 0)
                const accepted = Number(row?.accepted ?? 0)
                const rejected = Number(row?.rejected ?? 0)
                const completed = Number(row?.completed ?? 0)
                const forwarded = Number(row?.forwarded ?? 0)
                return {
                    facilityId: facility.id,
                    facilityName: facility.name,
                    period,
                    priority: priority || 'all',
                    sent,
                    received: Number(row?.received ?? 0),
                    accepted,
                    rejected,
                    forwarded,
                    completed,
                    pending: Math.max(0, sent - accepted - rejected - completed - forwarded),
                }
            })
            setSystemReportRows(rows)

            const summary = rows.reduce(
                (acc, row) => {
                    acc.totalReferrals += row.sent
                    acc.accepted += row.accepted
                    acc.rejected += row.rejected
                    acc.completed += row.completed
                    acc.pending += row.pending
                    return acc
                },
                {
                    totalFacilities: facilityList.length,
                    totalReferrals: 0,
                    accepted: 0,
                    rejected: 0,
                    completed: 0,
                    pending: 0,
                } as BackendReportSummary,
            )

            setBackendReportSummary(summary)
        } catch (error: any) {
            setSystemReportRows([])
            showNotice({ type: 'error', message: error?.message || 'Failed to load report summary.' })
        } finally {
            setReportLoading(false)
        }
    }

    useEffect(() => {
        if (tab !== 'reports') return
        void loadReportSummary(reportPeriod, activeFacilities, reportPriority || undefined)
    }, [tab, reportPeriod, reportPriority, activeFacilities])

    const handleExportCSV = () => {
        try {
            if (systemReportRows.length === 0) {
                showNotice({ type: 'error', message: 'No report rows to export for the selected filters.' })
                return
            }
            const rows = [
                ['Facility ID', 'Facility Name', 'Period', 'Priority', 'Sent', 'Received', 'Accepted', 'Rejected', 'Forwarded', 'Completed', 'Pending'],
                ...systemReportRows.map((row) => [
                    row.facilityId,
                    row.facilityName,
                    row.period,
                    row.priority,
                    row.sent,
                    row.received,
                    row.accepted,
                    row.rejected,
                    row.forwarded,
                    row.completed,
                    row.pending,
                ]),
            ]
            const csv = rows.map(r => r.join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `system-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
            URL.revokeObjectURL(url)
            showNotice({ type: 'success', message: 'Report export completed.' })
        } catch (error: any) {
            showNotice({ type: 'error', message: error?.message || 'Report export failed.' })
        }
    }

    const hasSystemReportData = Object.values(backendReportSummary).some((value) => Number(value) > 0)
    const sysAdminChartData = [
        { label: 'Facilities', value: facilities.length, colorClass: 'bg-primary-600' },
        { label: 'Users', value: users.length, colorClass: 'bg-emerald-500' },
        { label: 'Audit Logs', value: auditLogs.length, colorClass: 'bg-amber-500' },
        {
            label: 'Inactive Facilities',
            value: facilities.filter((facility) => (facility as any).active === false).length,
            colorClass: 'bg-red-500',
        },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('sa.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        Regional Health Bureau — System-wide Management
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setTab('facilities')} className={tabCls(tab === 'facilities')}>
                        <span className="flex items-center gap-1.5"><IconServer size={14} />{t('sa.facilities')}</span>
                    </button>
                    <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}>
                        <span className="flex items-center gap-1.5"><IconUsers size={14} />Users</span>
                    </button>
                    <button onClick={() => setTab('audit')} className={tabCls(tab === 'audit')}>
                        <span className="flex items-center gap-1.5"><IconShield size={14} />{t('sa.auditLogs')}</span>
                    </button>
                    <button onClick={() => setTab('reports')} className={tabCls(tab === 'reports')}>
                        <span className="flex items-center gap-1.5"><IconChartBar size={14} />{t('nav.reports')}</span>
                    </button>
                </div>
            </div>

            <DashboardMiniChart title="System Overview Snapshot" data={sysAdminChartData} />

            {/* ── FACILITIES TAB ──────────────────────────────────────────── */}
            {tab === 'facilities' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">
                            {showInactiveFacilities ? 'Inactive Facilities' : t('sa.facilities')} ({filteredFacilities.length})
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowInactiveFacilities((current) => !current)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isDark
                                    ? 'border-surface-700 text-surface-300 hover:bg-surface-800'
                                    : 'border-surface-300 text-surface-700 hover:bg-surface-100'
                                }`}
                            >
                                {showInactiveFacilities ? 'Show Active' : 'Show Inactive'}
                            </button>
                            <button onClick={() => setShowAddFacility(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors">
                                <IconPlus size={13} /> {t('sa.addFacility')}
                            </button>
                        </div>
                    </div>
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Search facilities..."
                            value={facilitySearch}
                            onChange={(e) => setFacilitySearch(e.target.value)}
                            className={`w-full sm:w-80 px-3 py-2 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                        />
                    </div>
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading facilities...</p>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleFacilitySort('name')} className="hover:text-primary-500 transition-colors">
                                                {t('common.name')}{facilitySortKey === 'name' ? (facilitySortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleFacilitySort('location')} className="hover:text-primary-500 transition-colors">
                                                Location{facilitySortKey === 'location' ? (facilitySortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleFacilitySort('type')} className="hover:text-primary-500 transition-colors">
                                                Type{facilitySortKey === 'type' ? (facilitySortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleFacilitySort('status')} className="hover:text-primary-500 transition-colors">
                                                Status{facilitySortKey === 'status' ? (facilitySortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleFacilitySort('services')} className="hover:text-primary-500 transition-colors">
                                                Services{facilitySortKey === 'services' ? (facilitySortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedFacilities.map(f => (
                                        <tr key={f.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    {f.profileImageUrl ? (
                                                        <img
                                                            src={resolveBackendAssetUrl(f.profileImageUrl)}
                                                            alt={`${f.name} logo`}
                                                            className="w-7 h-7 rounded-lg object-cover border border-surface-300"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[10px] font-bold">
                                                            {f.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{f.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-surface-400">{f.location}</td>
                                            <td className="py-3 text-surface-400">{f.type}</td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${(f as any).active === false
                                                    ? 'bg-surface-500/15 text-surface-400 border-surface-500/25'
                                                    : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                                }`}>
                                                    {(f as any).active === false ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3">{f.services?.length || 0}</td>
                                            <td className="py-3">
                                                <div className="flex gap-1">
                                                    {showInactiveFacilities ? (
                                                        <button
                                                            onClick={() => handleReactivateFacility(f)}
                                                            disabled={reactivatingFacilityId === f.id}
                                                            className="px-2.5 h-8 rounded-lg text-[11px] font-semibold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                                            title="Reactivate facility"
                                                        >
                                                            {reactivatingFacilityId === f.id ? 'Restoring...' : 'Restore'}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setEditingFacility({ ...f })}
                                                                className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                                title="Edit facility"
                                                            >
                                                                <IconEdit size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteFacility(f)}
                                                                disabled={deletingFacilityId === f.id}
                                                                className="w-8 h-8 rounded-lg transition-colors hover:bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-60"
                                                                title="Delete facility"
                                                            >
                                                                <IconCircleX size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <p className={`${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                Showing {pagedFacilities.length} of {sortedFacilities.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFacilityPage((current) => Math.max(1, current - 1))}
                                    disabled={facilityPage === 1}
                                    className={`px-2.5 py-1 rounded border disabled:opacity-50 ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}
                                >
                                    Prev
                                </button>
                                <span className={`${isDark ? 'text-surface-300' : 'text-surface-600'}`}>
                                    Page {facilityPage} of {facilityTotalPages}
                                </span>
                                <button
                                    onClick={() => setFacilityPage((current) => Math.min(facilityTotalPages, current + 1))}
                                    disabled={facilityPage === facilityTotalPages}
                                    className={`px-2.5 py-1 rounded border disabled:opacity-50 ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                        </>
                    )}
                </div>
            )}

            {/* ── USERS TAB ─────────────────────────────────────────────── */}
            {tab === 'users' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">Users ({filteredUsers.length})</h3>
                        <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors">
                            <IconPlus size={13} /> Add User
                        </button>
                    </div>
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className={`w-full sm:w-80 px-3 py-2 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                        />
                    </div>
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading users...</p>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('fullName')} className="hover:text-primary-500 transition-colors">
                                                Name{userSortKey === 'fullName' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('username')} className="hover:text-primary-500 transition-colors">
                                                Username{userSortKey === 'username' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('role')} className="hover:text-primary-500 transition-colors">
                                                Role{userSortKey === 'role' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('facilityId')} className="hover:text-primary-500 transition-colors">
                                                Facility{userSortKey === 'facilityId' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('status')} className="hover:text-primary-500 transition-colors">
                                                Status{userSortKey === 'status' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedUsers.map(u => (
                                        <tr key={u.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                        {u.fullName.split(' ').filter(w => !['Dr.', 'Sr.', 'Ato'].includes(w)).map(w => w[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span className="font-medium">{u.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-surface-400">{u.username}</td>
                                            <td className="py-3 text-surface-400">{apiRoleToAppRole(u.role)}</td>
                                            <td className="py-3 text-surface-400">{facilityNameById[u.facilityId] || u.facilityId || '—'}</td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.active
                                                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                                    : 'bg-surface-500/15 text-surface-400 border-surface-500/25'
                                                }`}>
                                                    {u.active ? <IconCircleCheck size={9} /> : null} {u.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setEditingUser({ ...u })}
                                                        className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                        title="Edit user"
                                                    >
                                                        <IconEdit size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => openResetPasswordModal(u)}
                                                        className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                        title="Reset password"
                                                    >
                                                        <IconKey size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteUser(u)}
                                                        disabled={deletingUserId === u.id}
                                                        className="w-8 h-8 rounded-lg transition-colors hover:bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-60"
                                                        title="Delete user"
                                                    >
                                                        <IconCircleX size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <p className={`${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                Showing {pagedUsers.length} of {sortedUsers.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setUserPage((current) => Math.max(1, current - 1))}
                                    disabled={userPage === 1}
                                    className={`px-2.5 py-1 rounded border disabled:opacity-50 ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}
                                >
                                    Prev
                                </button>
                                <span className={`${isDark ? 'text-surface-300' : 'text-surface-600'}`}>
                                    Page {userPage} of {userTotalPages}
                                </span>
                                <button
                                    onClick={() => setUserPage((current) => Math.min(userTotalPages, current + 1))}
                                    disabled={userPage === userTotalPages}
                                    className={`px-2.5 py-1 rounded border disabled:opacity-50 ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                        </>
                    )}
                </div>
            )}

            {/* ── AUDIT LOGS TAB ──────────────────────────────────────────── */}
            {tab === 'audit' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <IconShield size={14} className="text-primary-400" />
                            {t('sa.auditLogs')}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => void handleVerifyAuditChain()}
                                disabled={verifyingAuditChain}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                            >
                                {verifyingAuditChain ? 'Verifying...' : 'Verify Audit Chain'}
                            </button>
                            <div className="relative">
                                <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={auditSearch}
                                    onChange={e => setAuditSearch(e.target.value)}
                                    className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                                />
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading audit logs...</p>
                    ) : filteredAudit.length === 0 ? (
                        <p className="text-sm text-surface-500">No audit logs found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">User</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Action</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Record</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">IP</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAudit.map(entry => (
                                        <tr key={entry.id} className={`border-b last:border-0 ${isDark ? 'border-surface-700/50' : 'border-surface-100'}`}>
                                            <td className="py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary-500/15 flex items-center justify-center">
                                                        <IconUser size={10} className="text-primary-400" />
                                                    </div>
                                                    <span className="font-medium">{entry.userValue}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 text-surface-400">{entry.actionValue}</td>
                                            <td className="py-2.5"><code className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-surface-700' : 'bg-surface-100'}`}>{entry.recordValue}</code></td>
                                            <td className="py-2.5 text-surface-500 font-mono text-[10px]">{entry.ipAddress || '—'}</td>
                                            <td className="py-2.5 text-surface-500">{entry.timestampValue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── REPORTS TAB ────────────────────────────────────────────── */}
            {tab === 'reports' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-sm font-bold">System-wide Report</h3>
                            <input
                                type="month"
                                value={reportPeriod}
                                onChange={(e) => setReportPeriod(e.target.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                            <select
                                value={reportPriority}
                                onChange={(e) => setReportPriority(e.target.value as typeof reportPriority)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            >
                                <option value="">All Priorities</option>
                                <option value="routine">Routine</option>
                                <option value="urgent">Urgent</option>
                                <option value="emergency">Emergency</option>
                            </select>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setReportPeriod(monthOffsetValue(0))}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => setReportPeriod(monthOffsetValue(-1))}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                                >
                                    Last Month
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadReportSummary(reportPeriod, activeFacilities, reportPriority || undefined)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                            >
                                Refresh
                            </button>
                            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                <IconDownload size={13} /> {t('ana.exportCSV')}
                            </button>
                        </div>
                    </div>
                    {reportLoading ? (
                        <p className="text-sm text-surface-500">Loading backend report summary...</p>
                    ) : activeFacilities.length === 0 ? (
                        <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-surface-800 bg-surface-950 text-surface-300' : 'border-surface-200 bg-surface-50 text-surface-600'}`}>
                            No active facilities found. Add or reactivate facilities to generate report results.
                        </div>
                    ) : !hasSystemReportData ? (
                        <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-surface-800 bg-surface-950 text-surface-300' : 'border-surface-200 bg-surface-50 text-surface-600'}`}>
                            No report data for <strong>{reportPeriod}</strong>{reportPriority ? ` with ${reportPriority} priority` : ''}. Try another month, priority, or refresh after new activity.
                        </div>
                    ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {Object.entries(backendReportSummary).map(([key, val]) => (
                            <div key={key} className={`rounded-xl border p-3 text-center ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                <p className="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-xl font-bold mt-1">{val}</p>
                            </div>
                        ))}
                    </div>
                    )}
                </div>
            )}

            {/* Add Facility Modal */}
            {showAddFacility && (
                <Modal
                    title={t('sa.addFacility')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowAddFacility(false)
                        resetNewFacilityForm()
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleCreateFacility()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Facility Name"
                            required
                            placeholder="e.g. Mekelle General Hospital"
                            value={newFacility.name}
                            onChange={(e) => {
                                setNewFacility((current) => ({ ...current, name: e.target.value }))
                                setNewFacilityErrors((current) => ({ ...current, name: undefined }))
                            }}
                            error={newFacilityErrors.name}
                        />
                        <FormField
                            label="Location"
                            placeholder="e.g. Mekelle"
                            value={newFacility.location}
                            onChange={(e) => setNewFacility((current) => ({ ...current, location: e.target.value }))}
                        />
                        <FormField
                            label="Type"
                            as="select"
                            required
                            value={newFacility.type}
                            onChange={(e) => {
                                setNewFacility((current) => ({ ...current, type: e.target.value as typeof current.type }))
                                setNewFacilityErrors((current) => ({ ...current, type: undefined }))
                            }}
                            error={newFacilityErrors.type}
                            options={[
                                { value: 'health_center', label: 'Health Center' },
                                { value: 'primary_hospital', label: 'Primary Hospital' },
                                { value: 'general_hospital', label: 'General Hospital' },
                                { value: 'specialized_hospital', label: 'Specialized / Referral Hospital' },
                            ]}
                        />
                        <FormField
                            label="Contact"
                            placeholder="+251-..."
                            value={newFacility.contact}
                            onChange={(e) => setNewFacility((current) => ({ ...current, contact: e.target.value }))}
                        />
                        <div className="space-y-1.5">
                            <label className={`block text-xs font-semibold ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                                Facility Image (optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFacilityImageUpload('new', e.target.files?.[0])}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark
                                    ? 'bg-surface-950 border-surface-800 text-surface-100 file:bg-surface-800 file:border-0 file:text-surface-200 file:rounded file:px-2 file:py-1 file:mr-3'
                                    : 'bg-surface-50 border-surface-200 text-surface-900 file:bg-surface-200 file:border-0 file:text-surface-700 file:rounded file:px-2 file:py-1 file:mr-3'
                                }`}
                            />
                            {uploadingFacilityImage === 'new' && (
                                <p className="text-[11px] text-surface-500">Uploading image...</p>
                            )}
                            {newFacility.profileImageUrl && (
                                <img
                                    src={resolveBackendAssetUrl(newFacility.profileImageUrl)}
                                    alt="Facility preview"
                                    className="w-20 h-20 rounded-lg object-cover border border-surface-300"
                                />
                            )}
                        </div>
                        <FormField
                            label="Admin Username"
                            required
                            placeholder="e.g. ayder.admin"
                            value={newFacility.adminUsername}
                            onChange={(e) => {
                                setNewFacility((current) => ({ ...current, adminUsername: e.target.value }))
                                setNewFacilityErrors((current) => ({ ...current, adminUsername: undefined }))
                            }}
                            error={newFacilityErrors.adminUsername}
                        />
                        <FormField
                            label="Admin Password"
                            required
                            type="password"
                            placeholder="Set initial password"
                            value={newFacility.adminPassword}
                            onChange={(e) => {
                                setNewFacility((current) => ({ ...current, adminPassword: e.target.value }))
                                setNewFacilityErrors((current) => ({ ...current, adminPassword: undefined }))
                            }}
                            error={newFacilityErrors.adminPassword}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Creating...' : 'Create Facility'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddFacility(false)
                                    resetNewFacilityForm()
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Add User Modal */}
            {showAddUser && (
                <Modal
                    title="Add User"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowAddUser(false)
                        resetNewUserForm()
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleCreateUser()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Full Name"
                            required
                            placeholder="e.g. Dr. John Doe"
                            value={newUser.fullName}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, fullName: e.target.value }))
                                setNewUserErrors((current) => ({ ...current, fullName: undefined }))
                            }}
                            error={newUserErrors.fullName}
                        />
                        <FormField
                            label="Username"
                            required
                            placeholder="e.g. jdoe"
                            value={newUser.username}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, username: e.target.value }))
                                setNewUserErrors((current) => ({ ...current, username: undefined }))
                            }}
                            error={newUserErrors.username}
                        />
                        <FormField
                            label="Role"
                            as="select"
                            required
                            value={newUser.role}
                            onChange={(e) => {
                                const nextRole = e.target.value as ApiUserRole
                                setNewUser((current) => ({
                                    ...current,
                                    role: nextRole,
                                    departmentId: nextRole === 'facility_admin' ? '' : current.departmentId,
                                }))
                                setNewUserErrors((current) => ({ ...current, role: undefined, departmentId: undefined }))
                            }}
                            error={newUserErrors.role}
                            options={[
                                { value: 'system_admin', label: 'System Administrator' },
                                { value: 'facility_admin', label: 'Facility Administrator' },
                                { value: 'department_head', label: 'Department Head' },
                                { value: 'doctor', label: 'Doctor' },
                                { value: 'liaison_officer', label: 'Liaison Officer' },
                                { value: 'hew', label: 'HEW' },
                            ]}
                        />
                        <FormField
                            label="Facility"
                            as="select"
                            required
                            value={newUser.facilityId}
                            onChange={(e) =>
                                {
                                    setNewUser((current) => ({
                                        ...current,
                                        facilityId: e.target.value,
                                        departmentId: '',
                                    }))
                                    setNewUserErrors((current) => ({
                                        ...current,
                                        facilityId: undefined,
                                        departmentId: undefined,
                                    }))
                                }
                            }
                            error={newUserErrors.facilityId}
                            options={activeFacilities.map(f => ({ value: f.id, label: f.name }))}
                        />
                        <FormField
                            label="Department"
                            as="select"
                            required={newUser.role !== 'facility_admin'}
                            value={newUser.departmentId}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, departmentId: e.target.value }))
                                setNewUserErrors((current) => ({ ...current, departmentId: undefined }))
                            }}
                            error={newUserErrors.departmentId}
                            options={departments.map((department) => ({ value: department.id, label: department.name }))}
                            disabled={newUser.role === 'facility_admin'}
                            hint={newUser.role === 'facility_admin' ? 'Facility administrators can be created without assigning a department.' : undefined}
                        />
                        {loadingDepartments && (
                            <p className="text-[11px] text-surface-500">Loading departments...</p>
                        )}
                        <FormField
                            label="Initial Password"
                            required
                            type="password"
                            placeholder="Set initial password"
                            value={newUser.initialPassword}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, initialPassword: e.target.value }))
                                setNewUserErrors((current) => ({ ...current, initialPassword: undefined }))
                            }}
                            error={newUserErrors.initialPassword}
                        />
                        <div className="space-y-1.5">
                            <label className={`block text-xs font-semibold ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                                Profile Image (optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUserImageUpload(e.target.files?.[0])}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark
                                    ? 'bg-surface-950 border-surface-800 text-surface-100 file:bg-surface-800 file:border-0 file:text-surface-200 file:rounded file:px-2 file:py-1 file:mr-3'
                                    : 'bg-surface-50 border-surface-200 text-surface-900 file:bg-surface-200 file:border-0 file:text-surface-700 file:rounded file:px-2 file:py-1 file:mr-3'
                                }`}
                            />
                            {uploadingUserImage && (
                                <p className="text-[11px] text-surface-500">Uploading image...</p>
                            )}
                            {newUser.profileImageUrl && (
                                <img
                                    src={resolveBackendAssetUrl(newUser.profileImageUrl)}
                                    alt="User profile preview"
                                    className="w-20 h-20 rounded-lg object-cover border border-surface-300"
                                />
                            )}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Creating...' : 'Create User'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddUser(false)
                                    resetNewUserForm()
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Confirm Delete Facility Modal */}
            {confirmDeleteFacility && (
                <Modal
                    title="Confirm Facility Deactivation"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}><IconCircleX size={14} className={isDark ? 'text-red-300' : 'text-red-600'} /></div>}
                    onClose={() => setConfirmDeleteFacility(null)}
                    maxWidth="max-w-md"
                >
                    <div className="space-y-4">
                        <p className={`text-sm ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            This will deactivate <strong>{confirmDeleteFacility.name}</strong>. You can restore it later from the inactive facilities view.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleDeleteFacility(confirmDeleteFacility)}
                                disabled={deletingFacilityId === confirmDeleteFacility.id}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                {deletingFacilityId === confirmDeleteFacility.id ? 'Deactivating...' : 'Deactivate Facility'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteFacility(null)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Confirm Delete User Modal */}
            {confirmDeleteUser && (
                <Modal
                    title="Confirm User Deletion"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}><IconCircleX size={14} className={isDark ? 'text-red-300' : 'text-red-600'} /></div>}
                    onClose={() => setConfirmDeleteUser(null)}
                    maxWidth="max-w-md"
                >
                    <div className="space-y-4">
                        <p className={`text-sm ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            This will permanently delete user <strong>{confirmDeleteUser.fullName}</strong>.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleDeleteUser(confirmDeleteUser)}
                                disabled={deletingUserId === confirmDeleteUser.id}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                {deletingUserId === confirmDeleteUser.id ? 'Deleting...' : 'Delete User'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteUser(null)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reset User Password Modal */}
            {resetPasswordUser && (
                <Modal
                    title="Reset User Password"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconKey size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setResetPasswordUser(null)
                        setResetPasswordError('')
                        setResetPasswordForm({ password: '', confirmPassword: '' })
                    }}
                    maxWidth="max-w-md"
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            void handleResetUserPassword()
                        }}
                        className="space-y-4"
                    >
                        <p className={`text-sm ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            Set a temporary password for <strong>{resetPasswordUser.fullName}</strong>.
                        </p>
                        <FormField
                            label="Temporary Password"
                            type="password"
                            required
                            value={resetPasswordForm.password}
                            onChange={(e) => {
                                setResetPasswordForm((current) => ({ ...current, password: e.target.value }))
                                setResetPasswordError('')
                            }}
                        />
                        <FormField
                            label="Confirm Password"
                            type="password"
                            required
                            value={resetPasswordForm.confirmPassword}
                            onChange={(e) => {
                                setResetPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))
                                setResetPasswordError('')
                            }}
                        />
                        {resetPasswordError && (
                            <p className="text-xs text-red-500 font-medium">{resetPasswordError}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={resettingUserPassword}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {resettingUserPassword ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setResetPasswordUser(null)
                                    setResetPasswordError('')
                                    setResetPasswordForm({ password: '', confirmPassword: '' })
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Facility Modal */}
            {editingFacility && (
                <Modal
                    title="Edit Facility"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconEdit size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => setEditingFacility(null)}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveFacility()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Facility Name"
                            required
                            value={editingFacility.name}
                            onChange={(e) =>
                                setEditingFacility((current) =>
                                    current ? { ...current, name: e.target.value } : current,
                                )
                            }
                        />
                        <FormField
                            label="Location"
                            value={editingFacility.location || ''}
                            onChange={(e) =>
                                setEditingFacility((current) =>
                                    current ? { ...current, location: e.target.value } : current,
                                )
                            }
                        />
                        <FormField
                            label="Contact"
                            value={editingFacility.contact || ''}
                            onChange={(e) =>
                                setEditingFacility((current) =>
                                    current ? { ...current, contact: e.target.value } : current,
                                )
                            }
                        />
                        <div className="space-y-1.5">
                            <label className={`block text-xs font-semibold ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                                Facility Image (optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFacilityImageUpload('edit', e.target.files?.[0])}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors ${isDark
                                    ? 'bg-surface-950 border-surface-800 text-surface-100 file:bg-surface-800 file:border-0 file:text-surface-200 file:rounded file:px-2 file:py-1 file:mr-3'
                                    : 'bg-surface-50 border-surface-200 text-surface-900 file:bg-surface-200 file:border-0 file:text-surface-700 file:rounded file:px-2 file:py-1 file:mr-3'
                                }`}
                            />
                            {uploadingFacilityImage === 'edit' && (
                                <p className="text-[11px] text-surface-500">Uploading image...</p>
                            )}
                            {editingFacility.profileImageUrl && (
                                <img
                                    src={resolveBackendAssetUrl(editingFacility.profileImageUrl)}
                                    alt="Facility preview"
                                    className="w-20 h-20 rounded-lg object-cover border border-surface-300"
                                />
                            )}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setEditingFacility(null)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <Modal
                    title="Edit User"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconEdit size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => setEditingUser(null)}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveUser()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Full Name"
                            required
                            value={editingUser.fullName}
                            onChange={(e) =>
                                setEditingUser((current) =>
                                    current ? { ...current, fullName: e.target.value } : current,
                                )
                            }
                        />
                        <FormField
                            label="Role"
                            as="select"
                            required
                            value={editingUser.role}
                            onChange={(e) =>
                                setEditingUser((current) =>
                                    current ? { ...current, role: e.target.value as ApiUser['role'] } : current,
                                )
                            }
                            options={[
                                { value: 'system_admin', label: 'System Administrator' },
                                { value: 'facility_admin', label: 'Facility Administrator' },
                                { value: 'department_head', label: 'Department Head' },
                                { value: 'liaison_officer', label: 'Liaison Officer' },
                                { value: 'doctor', label: 'Doctor' },
                                { value: 'hew', label: 'HEW' },
                            ]}
                        />
                        <FormField
                            label="Status"
                            as="select"
                            value={editingUser.active ? 'active' : 'inactive'}
                            onChange={(e) =>
                                setEditingUser((current) =>
                                    current
                                        ? { ...current, active: e.target.value === 'active' }
                                        : current,
                                )
                            }
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setEditingUser(null)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}
