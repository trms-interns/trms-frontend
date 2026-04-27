import React, { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { trmsApi, type ApiFacility, type ApiUser, type Department } from '../../lib/trmsApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import DashboardMiniChart from '../../components/DashboardMiniChart'
import {
    IconBuilding,
    IconPlus,
    IconEdit,
    IconCircleCheck,
    IconCircleX,
    IconAlertTriangle,
    IconClock,
    IconChartBar,
    IconDownload,
    IconSettings,
    IconUsers,
    IconKey,
    IconArrowsLeftRight,
} from '@tabler/icons-react'

function monthOffsetValue(offset: number): string {
    const date = new Date()
    date.setMonth(date.getMonth() + offset)
    return date.toISOString().slice(0, 7)
}

export default function FacilityAdminDashboard() {
    type SortDirection = 'asc' | 'desc'
    type DepartmentSortKey = 'name' | 'type' | 'status'
    const PAGE_SIZE = 10

    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const [tab, setTab] = useState<'departments' | 'users' | 'service' | 'reports'>('departments')
    const [showAddDept, setShowAddDept] = useState(false)
    const [facilities, setFacilities] = useState<ApiFacility[]>([])
    const [users, setUsers] = useState<ApiUser[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [creatingDepartment, setCreatingDepartment] = useState(false)
    const [savingDepartment, setSavingDepartment] = useState(false)
    const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null)
    const [togglingDepartmentId, setTogglingDepartmentId] = useState<string | null>(null)
    const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null)
    const [creatingService, setCreatingService] = useState(false)
    const [showAddService, setShowAddService] = useState(false)
    const [serviceDelayInputs, setServiceDelayInputs] = useState<Record<string, string>>({})
    const [addDeptError, setAddDeptError] = useState('')
    const [departmentActionError, setDepartmentActionError] = useState('')
    const [serviceActionError, setServiceActionError] = useState('')
    const [userActionError, setUserActionError] = useState('')
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
    const [confirmDeleteDepartment, setConfirmDeleteDepartment] = useState<Department | null>(null)
    const [resetPasswordUser, setResetPasswordUser] = useState<ApiUser | null>(null)
    const [resettingUserPassword, setResettingUserPassword] = useState(false)
    const [showAddUser, setShowAddUser] = useState(false)
    const [savingUser, setSavingUser] = useState(false)
    const [newUser, setNewUser] = useState({
        fullName: '',
        username: '',
        role: 'department_head' as 'department_head' | 'liaison_officer',
        departmentId: '',
        initialPassword: '',
    })
    const [newUserErrors, setNewUserErrors] = useState<Partial<Record<'fullName' | 'username' | 'role' | 'departmentId' | 'initialPassword', string>>>({})
    const [resetPasswordForm, setResetPasswordForm] = useState({
        password: '',
        confirmPassword: '',
    })
    const [departmentSearch, setDepartmentSearch] = useState('')
    const [departmentPage, setDepartmentPage] = useState(1)
    const [departmentSortKey, setDepartmentSortKey] = useState<DepartmentSortKey>('name')
    const [departmentSortDirection, setDepartmentSortDirection] = useState<SortDirection>('asc')
    const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().slice(0, 7))
    const [reportPriority, setReportPriority] = useState<'' | 'routine' | 'urgent' | 'emergency'>('')
    const [reportLoading, setReportLoading] = useState(false)
    const [reportError, setReportError] = useState('')
    const [reportNotice, setReportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [backendReportSummary, setBackendReportSummary] = useState({
        sent: 0,
        received: 0,
        accepted: 0,
        rejected: 0,
        forwarded: 0,
        completed: 0,
    })
    const [newDepartment, setNewDepartment] = useState({
        name: '',
        facilityId: '',
        adminName: '',
        adminUsername: '',
        adminPassword: '',
        type: 'clinical' as 'clinical' | 'liaison',
    })
    const [newService, setNewService] = useState({
        serviceType: '',
        status: 'available' as 'available' | 'limited' | 'unavailable',
        estimatedDelayDays: '',
    })

    const loadFacilityAdminData = async () => {
        setLoading(true)
        try {
            const [facilitiesData, usersData, departmentsData] = await Promise.all([
                trmsApi.getFacilities(),
                trmsApi.getUsers(user?.facilityId),
                user?.facilityId ? trmsApi.getDepartments(user.facilityId) : Promise.resolve([]),
            ])
            let nextFacilities = facilitiesData
            if (user?.facilityId) {
                try {
                    const facilityServices = await trmsApi.getFacilityServices(user.facilityId)
                    nextFacilities = facilitiesData.map((facilityItem) =>
                        facilityItem.id === user.facilityId
                            ? {
                                ...facilityItem,
                                services: facilityServices,
                            }
                            : {
                                ...facilityItem,
                                services: Array.isArray(facilityItem.services) ? facilityItem.services : [],
                            },
                    )
                } catch {
                    nextFacilities = facilitiesData.map((facilityItem) => ({
                        ...facilityItem,
                        services: Array.isArray(facilityItem.services) ? facilityItem.services : [],
                    }))
                }
            } else {
                nextFacilities = facilitiesData.map((facilityItem) => ({
                    ...facilityItem,
                    services: Array.isArray(facilityItem.services) ? facilityItem.services : [],
                }))
            }
            setFacilities(nextFacilities)
            setUsers(usersData)
            setDepartments(departmentsData)
        } catch (error) {
            console.error('Failed to fetch facility data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadFacilityAdminData()
    }, [user?.facilityId])

    const facility = facilities.find(f => f.id === user?.facilityId) || facilities[0] || null
    const facilityName = facility?.name || 'Unknown facility'
    const facilityLocation = facility?.location || 'Unknown location'
    const resetAddDepartmentForm = () => {
        setNewDepartment({
            name: '',
            facilityId: user?.facilityId || facility?.id || '',
            adminName: '',
            adminUsername: '',
            adminPassword: '',
            type: 'clinical',
        })
        setAddDeptError('')
    }

    const resetNewUserForm = () => {
        setNewUser({
            fullName: '',
            username: '',
            role: 'department_head',
            departmentId: '',
            initialPassword: '',
        })
        setNewUserErrors({})
    }

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`

    const statusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
        available: { icon: <IconCircleCheck size={11} />, cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
        limited: { icon: <IconClock size={11} />, cls: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
        unavailable: { icon: <IconCircleX size={11} />, cls: 'bg-red-500/15 text-red-500 border-red-500/25' },
    }

    const normalizeServiceStatus = (value?: string): 'available' | 'limited' | 'unavailable' => {
        if (value === 'available' || value === 'limited' || value === 'unavailable') {
            return value
        }
        return 'unavailable'
    }

    const buildFacilityReportQuery = (period: string, facilityId?: string) => ({
        period,
        facilityId,
        priority: reportPriority || undefined,
    })

    const loadFacilityReportSummary = async (period: string, facilityId?: string) => {
        if (!facilityId) {
            setBackendReportSummary({
                sent: 0,
                received: 0,
                accepted: 0,
                rejected: 0,
                forwarded: 0,
                completed: 0,
            })
            return
        }

        try {
            setReportLoading(true)
            setReportError('')
            const result: any = await trmsApi.getReport(buildFacilityReportQuery(period, facilityId))
            setBackendReportSummary({
                sent: Number(result?.sent ?? 0),
                received: Number(result?.received ?? 0),
                accepted: Number(result?.accepted ?? 0),
                rejected: Number(result?.rejected ?? 0),
                forwarded: Number(result?.forwarded ?? 0),
                completed: Number(result?.completed ?? 0),
            })
        } catch (error: any) {
            setReportError(error?.message || 'Failed to load report summary.')
        } finally {
            setReportLoading(false)
        }
    }

    const handleExportCSV = async () => {
        const facilityId = user?.facilityId || facility?.id
        if (!facilityId) return
        try {
            setReportError('')
            setReportNotice(null)
            const blob = await trmsApi.exportReport({
                ...buildFacilityReportQuery(reportPeriod, facilityId),
                format: 'csv',
            })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `facility-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
        URL.revokeObjectURL(url)
            setReportNotice({ type: 'success', message: 'Report export completed.' })
        } catch (error: any) {
            setReportError(error?.message || 'Failed to export report.')
            setReportNotice({ type: 'error', message: error?.message || 'Report export failed.' })
        }
    }

    const hasFacilityReportData = Object.values(backendReportSummary).some((value) => Number(value) > 0)
    const handleCreateDepartment = async () => {
        const facilityId = newDepartment.facilityId || user?.facilityId || facility?.id || ''

        if (
            !newDepartment.name.trim() ||
            !facilityId ||
            !newDepartment.adminName.trim() ||
            !newDepartment.adminUsername.trim() ||
            !newDepartment.adminPassword.trim() ||
            !newDepartment.type
        ) {
            setAddDeptError('Please fill in all required fields.')
            return
        }

        try {
            setCreatingDepartment(true)
            setAddDeptError('')
            await trmsApi.createDepartment({
                name: newDepartment.name.trim(),
                facilityId,
                adminName: newDepartment.adminName.trim(),
                adminUsername: newDepartment.adminUsername.trim(),
                adminPassword: newDepartment.adminPassword,
                type: newDepartment.type,
            })
            await loadFacilityAdminData()
            setShowAddDept(false)
            resetAddDepartmentForm()
        } catch (error: any) {
            setAddDeptError(error?.message || 'Failed to create department.')
        } finally {
            setCreatingDepartment(false)
        }
    }

    const handleSaveDepartment = async () => {
        if (!editingDepartment) return
        if (!editingDepartment.name.trim()) {
            setDepartmentActionError('Department name is required.')
            return
        }

        try {
            setSavingDepartment(true)
            setDepartmentActionError('')
            await trmsApi.updateDepartment(editingDepartment.id, {
                name: editingDepartment.name.trim(),
                active: editingDepartment.active !== false,
            })
            await loadFacilityAdminData()
            setEditingDepartment(null)
        } catch (error: any) {
            setDepartmentActionError(error?.message || 'Failed to update department.')
        } finally {
            setSavingDepartment(false)
        }
    }

    const handleDeleteDepartment = async (department: Department) => {
        try {
            setDeletingDepartmentId(department.id)
            setDepartmentActionError('')
            await trmsApi.deleteDepartment(department.id)
            await loadFacilityAdminData()
            setConfirmDeleteDepartment(null)
        } catch (error: any) {
            setDepartmentActionError(error?.message || 'Failed to delete department.')
        } finally {
            setDeletingDepartmentId(null)
        }
    }

    const handleToggleDepartmentActive = async (department: Department) => {
        const currentlyActive = department.active !== false
        try {
            setTogglingDepartmentId(department.id)
            setDepartmentActionError('')
            await trmsApi.updateDepartment(department.id, { active: !currentlyActive })
            await loadFacilityAdminData()
        } catch (error: any) {
            setDepartmentActionError(error?.message || 'Failed to update department status.')
        } finally {
            setTogglingDepartmentId(null)
        }
    }

    const handleUpdateServiceStatus = async (
        serviceId: string,
        status: 'available' | 'limited' | 'unavailable',
        estimatedDelayDays?: number,
    ) => {
        const facilityId = user?.facilityId || facility?.id
        if (!facilityId) {
            setServiceActionError('Facility is not available for service update.')
            return
        }

        try {
            setUpdatingServiceId(serviceId)
            setServiceActionError('')
            const updated = await trmsApi.updateFacilityService(facilityId, {
                serviceId,
                status,
                estimatedDelayDays: status === 'limited' ? estimatedDelayDays : undefined,
            })
            setServiceDelayInputs((current) => ({
                ...current,
                [updated.id]:
                    updated.estimatedDelayDays !== undefined && updated.estimatedDelayDays !== null
                        ? String(updated.estimatedDelayDays)
                        : '',
            }))
            setFacilities((current) =>
                current.map((item) =>
                    item.id !== facilityId
                        ? item
                        : {
                            ...item,
                            services: (Array.isArray(item.services) ? item.services : []).map((service) =>
                                service.id === updated.id ? updated : service,
                            ),
                        },
                ),
            )
        } catch (error: any) {
            setServiceActionError(error?.message || 'Failed to update service status.')
        } finally {
            setUpdatingServiceId(null)
        }
    }

    const resetNewServiceForm = () => {
        setNewService({
            serviceType: '',
            status: 'available',
            estimatedDelayDays: '',
        })
    }

    const handleCreateService = async () => {
        const facilityId = user?.facilityId || facility?.id
        if (!facilityId) {
            setServiceActionError('Facility is not available for service creation.')
            return
        }

        const serviceType = newService.serviceType.trim()
        if (!serviceType) {
            setServiceActionError('Service type is required.')
            return
        }

        if (
            facility?.services?.some(
                (service) =>
                    service.serviceType.trim().toLowerCase() === serviceType.toLowerCase(),
            )
        ) {
            setServiceActionError('A service with this name already exists.')
            return
        }

        let estimatedDelayDays: number | undefined
        if (newService.status === 'limited') {
            const raw = newService.estimatedDelayDays.trim()
            if (!raw) {
                setServiceActionError('Estimated delay days is required for limited services.')
                return
            }

            const parsed = Number(raw)
            if (!Number.isInteger(parsed) || parsed < 0) {
                setServiceActionError('Estimated delay days must be a whole number (0 or greater).')
                return
            }
            estimatedDelayDays = parsed
        }

        try {
            setCreatingService(true)
            setServiceActionError('')
            const created = await trmsApi.createFacilityService(facilityId, {
                serviceType,
                status: newService.status,
                estimatedDelayDays,
            })

            setFacilities((current) =>
                current.map((item) =>
                    item.id !== facilityId
                        ? item
                        : {
                              ...item,
                              services: [...(Array.isArray(item.services) ? item.services : []), created],
                          },
                ),
            )
            setServiceDelayInputs((current) => ({
                ...current,
                [created.id]:
                    created.estimatedDelayDays !== undefined && created.estimatedDelayDays !== null
                        ? String(created.estimatedDelayDays)
                        : '',
            }))
            resetNewServiceForm()
            setShowAddService(false)
        } catch (error: any) {
            setServiceActionError(error?.message || 'Failed to create service.')
        } finally {
            setCreatingService(false)
        }
    }

    const handleSaveServiceDelay = async (serviceId: string) => {
        const currentService = facility?.services?.find((service) => service.id === serviceId)
        if (!currentService) return
        if (currentService.status !== 'limited') return

        const raw = (serviceDelayInputs[serviceId] ?? '').trim()
        if (raw === '') {
            setServiceActionError('Please enter estimated delay days for limited services.')
            return
        }

        const parsed = Number(raw)
        if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
            setServiceActionError('Estimated delay days must be a whole number (0 or greater).')
            return
        }

        await handleUpdateServiceStatus(serviceId, 'limited', parsed)
    }

    const facilityManagedUsers = useMemo(
        () =>
            users.filter(
                (u) =>
                    u.facilityId === (user?.facilityId || facility?.id) &&
                    u.role === 'department_head',
            ),
        [facility?.id, user?.facilityId, users],
    )
    const facilityChartData = [
        { label: 'Departments', value: departments.length, colorClass: 'bg-primary-600' },
        { label: 'Dept Heads', value: facilityManagedUsers.length, colorClass: 'bg-emerald-500' },
        {
            label: 'Services Up',
            value: facility?.services?.filter((service) => normalizeServiceStatus(service.status) === 'available').length || 0,
            colorClass: 'bg-amber-500',
        },
        {
            label: 'Services Down',
            value: facility?.services?.filter((service) => normalizeServiceStatus(service.status) === 'unavailable').length || 0,
            colorClass: 'bg-red-500',
        },
    ]

    const openResetPasswordModal = (targetUser: ApiUser) => {
        setResetPasswordUser(targetUser)
        setUserActionError('')
        setResetPasswordForm({ password: '', confirmPassword: '' })
    }

    const handleResetUserPassword = async () => {
        if (!resetPasswordUser) return
        const password = resetPasswordForm.password.trim()
        const confirmPassword = resetPasswordForm.confirmPassword.trim()

        if (!password) {
            setUserActionError('Temporary password is required.')
            return
        }
        if (password.length < 8) {
            setUserActionError('Temporary password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setUserActionError('Passwords do not match.')
            return
        }

        try {
            setResettingUserPassword(true)
            setUserActionError('')
            await trmsApi.updateUser(resetPasswordUser.id, { password })
            await loadFacilityAdminData()
            setResetPasswordUser(null)
            setResetPasswordForm({ password: '', confirmPassword: '' })
        } catch (error: any) {
            setUserActionError(error?.message || 'Failed to reset user password.')
        } finally {
            setResettingUserPassword(false)
        }
    }

    const handleCreateUser = async () => {
        const errors: Partial<Record<'fullName' | 'username' | 'role' | 'departmentId' | 'initialPassword', string>> = {}
        if (!newUser.fullName.trim()) errors.fullName = 'Full name is required.'
        if (!newUser.username.trim()) errors.username = 'Username is required.'
        if (!newUser.role) errors.role = 'Role is required.'
        if (!newUser.departmentId) errors.departmentId = 'Department is required.'
        if (!newUser.initialPassword.trim()) errors.initialPassword = 'Initial password is required.'
        setNewUserErrors(errors)

        if (Object.keys(errors).length > 0) return

        try {
            setSavingUser(true)
            await trmsApi.createUser({
                fullName: newUser.fullName.trim(),
                username: newUser.username.trim(),
                role: newUser.role,
                facilityId: user?.facilityId || facility?.id || '',
                departmentId: newUser.departmentId,
                initialPassword: newUser.initialPassword,
            })
            await loadFacilityAdminData()
            setShowAddUser(false)
            resetNewUserForm()
        } catch (error: any) {
            setUserActionError(error?.message || 'Failed to create user.')
        } finally {
            setSavingUser(false)
        }
    }

    const toggleDepartmentSort = (key: DepartmentSortKey) => {
        if (departmentSortKey === key) {
            setDepartmentSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
            return
        }
        setDepartmentSortKey(key)
        setDepartmentSortDirection('asc')
    }

    const filteredDepartments = useMemo(() => {
        const q = departmentSearch.trim().toLowerCase()
        if (!q) return departments

        return departments.filter((department) => {
            const typeValue = String(department.type || 'clinical').toLowerCase()
            const statusValue = department.active === false ? 'inactive' : 'active'
            return (
                department.name.toLowerCase().includes(q) ||
                typeValue.includes(q) ||
                statusValue.includes(q)
            )
        })
    }, [departments, departmentSearch])

    const sortedDepartments = useMemo(() => {
        const items = [...filteredDepartments]
        const direction = departmentSortDirection === 'asc' ? 1 : -1
        return items.sort((a, b) => {
            let left = ''
            let right = ''

            if (departmentSortKey === 'name') {
                left = a.name || ''
                right = b.name || ''
            } else if (departmentSortKey === 'type') {
                left = a.type || 'clinical'
                right = b.type || 'clinical'
            } else {
                left = a.active === false ? 'inactive' : 'active'
                right = b.active === false ? 'inactive' : 'active'
            }

            return left.localeCompare(right) * direction
        })
    }, [filteredDepartments, departmentSortDirection, departmentSortKey])

    const departmentTotalPages = Math.max(1, Math.ceil(sortedDepartments.length / PAGE_SIZE))
    const pagedDepartments = sortedDepartments.slice(
        (departmentPage - 1) * PAGE_SIZE,
        departmentPage * PAGE_SIZE,
    )

    useEffect(() => {
        setDepartmentPage(1)
    }, [departmentSearch, departments.length])

    useEffect(() => {
        if (departmentPage > departmentTotalPages) {
            setDepartmentPage(departmentTotalPages)
        }
    }, [departmentPage, departmentTotalPages])

    useEffect(() => {
        if (tab !== 'reports') return
        void loadFacilityReportSummary(reportPeriod, user?.facilityId || facility?.id)
    }, [tab, reportPeriod, reportPriority, user?.facilityId, facility?.id])

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('fa.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {facilityName} — {facilityLocation}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setTab('departments')} className={tabCls(tab === 'departments')}>
                        <span className="flex items-center gap-1.5"><IconBuilding size={14} />{t('fa.departments')}</span>
                    </button>
                    <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}>
                        <span className="flex items-center gap-1.5"><IconUsers size={14} />Users</span>
                    </button>
                    <button onClick={() => setTab('service')} className={tabCls(tab === 'service')}>
                        <span className="flex items-center gap-1.5"><IconSettings size={14} />{t('nav.serviceStatus')}</span>
                    </button>
                    <button onClick={() => setTab('reports')} className={tabCls(tab === 'reports')}>
                        <span className="flex items-center gap-1.5"><IconChartBar size={14} />{t('nav.reports')}</span>
                    </button>
                </div>
            </div>

            <DashboardMiniChart title="Facility Operations Snapshot" data={facilityChartData} />

            {/* ── DEPARTMENTS TAB ────────────────────────────────────────── */}
            {tab === 'departments' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">{t('fa.departments')} ({filteredDepartments.length})</h3>
                        <button
                            onClick={() => {
                                resetAddDepartmentForm()
                                setShowAddDept(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                            <IconPlus size={13} /> {t('fa.addDept')}
                        </button>
                    </div>
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={departmentSearch}
                            onChange={(e) => setDepartmentSearch(e.target.value)}
                            className={`w-full sm:w-80 px-3 py-2 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                        />
                    </div>
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading...</p>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleDepartmentSort('name')} className="hover:text-primary-500 transition-colors">
                                                {t('common.name')}{departmentSortKey === 'name' ? (departmentSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleDepartmentSort('status')} className="hover:text-primary-500 transition-colors">
                                                {t('common.status')}{departmentSortKey === 'status' ? (departmentSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleDepartmentSort('type')} className="hover:text-primary-500 transition-colors">
                                                Type{departmentSortKey === 'type' ? (departmentSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedDepartments.map((dept) => {
                                        const isActive = dept.active !== false
                                        return (
                                            <tr key={dept.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                                <td className="py-3 font-medium">{dept.name}</td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isActive
                                                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                                        : 'bg-surface-500/15 text-surface-400 border-surface-500/25'
                                                    }`}>
                                                        {isActive ? <IconCircleCheck size={9} /> : <IconCircleX size={9} />} {isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-surface-500">{(dept.type || 'clinical').toUpperCase()}</td>
                                                <td className="py-3">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setDepartmentActionError('')
                                                                void handleToggleDepartmentActive(dept)
                                                            }}
                                                            disabled={togglingDepartmentId === dept.id}
                                                            className={`px-2.5 h-8 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-60 ${isActive
                                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                            }`}
                                                            title={isActive ? 'Deactivate department' : 'Restore department'}
                                                        >
                                                            {togglingDepartmentId === dept.id
                                                                ? isActive ? 'Deactivating...' : 'Restoring...'
                                                                : isActive ? 'Deactivate' : 'Restore'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setDepartmentActionError('')
                                                                setEditingDepartment({ ...dept })
                                                            }}
                                                            className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                            title="Edit department"
                                                        >
                                                            <IconEdit size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setDepartmentActionError('')
                                                                setConfirmDeleteDepartment(dept)
                                                            }}
                                                            disabled={deletingDepartmentId === dept.id}
                                                            className="w-8 h-8 rounded-lg transition-colors hover:bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-60"
                                                            title="Delete department"
                                                        >
                                                            <IconCircleX size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <p className={`${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                                Showing {pagedDepartments.length} of {sortedDepartments.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setDepartmentPage((current) => Math.max(1, current - 1))}
                                    disabled={departmentPage === 1}
                                    className={`px-2.5 py-1 rounded border disabled:opacity-50 ${isDark ? 'border-surface-700 text-surface-300' : 'border-surface-300 text-surface-700'}`}
                                >
                                    Prev
                                </button>
                                <span className={`${isDark ? 'text-surface-300' : 'text-surface-600'}`}>
                                    Page {departmentPage} of {departmentTotalPages}
                                </span>
                                <button
                                    onClick={() => setDepartmentPage((current) => Math.min(departmentTotalPages, current + 1))}
                                    disabled={departmentPage === departmentTotalPages}
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
                        <h3 className="text-sm font-bold">Facility Users ({users.length})</h3>
                        <button
                            onClick={() => {
                                resetNewUserForm()
                                setUserActionError('')
                                setShowAddUser(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                            <IconPlus size={13} /> Add User
                        </button>
                    </div>
                    {userActionError && (
                        <p className="mb-3 text-xs text-red-500 font-medium">{userActionError}</p>
                    )}
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading users...</p>
                    ) : facilityManagedUsers.length === 0 ? (
                        <p className="text-sm text-surface-500">No department head users found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Name</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Username</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Role</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">Status</th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.facilityId === (user?.facilityId || facility?.id)).map((u) => (
                                        <tr key={u.id} className={`border-b last:border-0 ${isDark ? 'border-surface-800' : 'border-surface-100'}`}>
                                            <td className="py-3 font-medium">{u.fullName}</td>
                                            <td className="py-3 text-surface-500">{u.username}</td>
                                            <td className="py-3 text-surface-500">{apiRoleToAppRole(u.role)}</td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.active === false
                                                    ? 'bg-surface-500/15 text-surface-400 border-surface-500/25'
                                                    : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                                }`}>
                                                    {u.active === false ? <IconCircleX size={9} /> : <IconCircleCheck size={9} />} {u.active === false ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <button
                                                    onClick={() => openResetPasswordModal(u)}
                                                    className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                    title="Reset password"
                                                >
                                                    <IconKey size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── SERVICE STATUS TAB ─────────────────────────────────────── */}
            {tab === 'service' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4 gap-3">
                        <h3 className="text-sm font-bold">{t('dir.serviceStatus')} — {facilityName}</h3>
                        <button
                            onClick={() => {
                                setServiceActionError('')
                                setShowAddService((current) => !current)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                            <IconPlus size={13} /> {showAddService ? 'Cancel' : 'Add Service'}
                        </button>
                    </div>
                    {serviceActionError && (
                        <p className="mb-3 text-xs text-red-500 font-medium">{serviceActionError}</p>
                    )}
                    {showAddService && (
                        <div className={`mb-4 p-4 rounded-xl border ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <FormField
                                    label="Service Type"
                                    required
                                    value={newService.serviceType}
                                    onChange={(e) =>
                                        setNewService((current) => ({
                                            ...current,
                                            serviceType: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Radiology"
                                />
                                <FormField
                                    label="Status"
                                    as="select"
                                    value={newService.status}
                                    onChange={(e) =>
                                        setNewService((current) => ({
                                            ...current,
                                            status: e.target.value as 'available' | 'limited' | 'unavailable',
                                        }))
                                    }
                                    options={[
                                        { value: 'available', label: 'Available' },
                                        { value: 'limited', label: 'Limited' },
                                        { value: 'unavailable', label: 'Unavailable' },
                                    ]}
                                />
                                <FormField
                                    label="Delay Days"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={newService.estimatedDelayDays}
                                    onChange={(e) =>
                                        setNewService((current) => ({
                                            ...current,
                                            estimatedDelayDays: e.target.value,
                                        }))
                                    }
                                    placeholder="0"
                                    disabled={newService.status !== 'limited'}
                                    hint={newService.status === 'limited' ? 'Required for limited services' : 'Used only when status is limited'}
                                />
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => void handleCreateService()}
                                        disabled={creatingService}
                                        className="w-full h-[42px] px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                    >
                                        {creatingService ? 'Creating...' : 'Create Service'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading...</p>
                    ) : (
                        <div className="space-y-2">
                            {facility?.services?.map(dept => {
                                const safeStatus = normalizeServiceStatus(dept.status)
                                const sc = statusConfig[safeStatus]
                                const delayValue =
                                    serviceDelayInputs[dept.id] ??
                                    (dept.estimatedDelayDays !== undefined && dept.estimatedDelayDays !== null
                                        ? String(dept.estimatedDelayDays)
                                        : '')
                                return (
                                    <div key={dept.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{dept.serviceType}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>{sc.icon} {safeStatus}</span>
                                        <select
                                            value={safeStatus}
                                            disabled={updatingServiceId === dept.id}
                                            className={`px-2 py-1 rounded-lg text-[11px] border outline-none ${isDark ? 'bg-surface-900 border-surface-700 text-surface-300' : 'bg-white border-surface-200 text-surface-700'}`}
                                            onChange={(e) =>
                                                void handleUpdateServiceStatus(
                                                    dept.id,
                                                    e.target.value as 'available' | 'limited' | 'unavailable',
                                                )
                                            }
                                        >
                                            <option value="available">Available</option>
                                            <option value="limited">Limited</option>
                                            <option value="unavailable">Unavailable</option>
                                        </select>
                                        {safeStatus === 'limited' && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={delayValue}
                                                    disabled={updatingServiceId === dept.id}
                                                    onChange={(e) =>
                                                        setServiceDelayInputs((current) => ({
                                                            ...current,
                                                            [dept.id]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Delay days"
                                                    className={`w-24 px-2 py-1 rounded-lg text-[11px] border outline-none ${isDark ? 'bg-surface-900 border-surface-700 text-surface-300' : 'bg-white border-surface-200 text-surface-700'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSaveServiceDelay(dept.id)}
                                                    disabled={updatingServiceId === dept.id}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── REPORTS TAB ────────────────────────────────────────────── */}
            {tab === 'reports' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-sm font-bold">Monthly Report — {facilityName}</h3>
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
                                onClick={() => void loadFacilityReportSummary(reportPeriod, user?.facilityId || facility?.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isDark ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-surface-300 text-surface-700 hover:bg-surface-100'}`}
                            >
                                Refresh
                            </button>
                            <button onClick={() => void handleExportCSV()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                <IconDownload size={13} /> {t('ana.exportCSV')}
                            </button>
                        </div>
                    </div>
                    {reportError && (
                        <p className="mb-3 text-xs text-red-500 font-medium">{reportError}</p>
                    )}
                    {reportNotice && (
                        <p className={`mb-3 text-xs font-medium ${reportNotice.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {reportNotice.message}
                        </p>
                    )}
                    {reportLoading ? (
                        <p className="text-sm text-surface-500">Loading backend report summary...</p>
                    ) : !facility?.id && !user?.facilityId ? (
                        <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-surface-800 bg-surface-950 text-surface-300' : 'border-surface-200 bg-surface-50 text-surface-600'}`}>
                            No facility is linked to this account, so report data cannot be generated.
                        </div>
                    ) : !hasFacilityReportData ? (
                        <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-surface-800 bg-surface-950 text-surface-300' : 'border-surface-200 bg-surface-50 text-surface-600'}`}>
                            No report data for <strong>{reportPeriod}</strong>{reportPriority ? ` with ${reportPriority} priority` : ''}. Try another month, priority, or refresh after new activity.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {Object.entries(backendReportSummary).map(([key, val]) => (
                                <div key={key} className={`rounded-xl border p-3 text-center ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                    <p className="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">{key}</p>
                                    <p className="text-xl font-bold mt-1">{val}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Department Modal */}
            {editingDepartment && (
                <Modal
                    title="Edit Department"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconEdit size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setEditingDepartment(null)
                        setDepartmentActionError('')
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveDepartment()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Department Name"
                            required
                            value={editingDepartment.name}
                            onChange={(e) => {
                                setEditingDepartment((current) =>
                                    current ? { ...current, name: e.target.value } : current,
                                )
                                setDepartmentActionError('')
                            }}
                        />
                        <FormField
                            label="Status"
                            as="select"
                            value={editingDepartment.active === false ? 'inactive' : 'active'}
                            onChange={(e) => {
                                setEditingDepartment((current) =>
                                    current ? { ...current, active: e.target.value === 'active' } : current,
                                )
                                setDepartmentActionError('')
                            }}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                        {departmentActionError && (
                            <p className="text-xs text-red-500 font-medium">{departmentActionError}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={savingDepartment}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {savingDepartment ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingDepartment(null)
                                    setDepartmentActionError('')
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Confirm Delete Department Modal */}
            {confirmDeleteDepartment && (
                <Modal
                    title="Confirm Department Deletion"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}><IconAlertTriangle size={14} className={isDark ? 'text-red-300' : 'text-red-600'} /></div>}
                    onClose={() => {
                        setConfirmDeleteDepartment(null)
                        setDepartmentActionError('')
                    }}
                    maxWidth="max-w-md"
                >
                    <div className="space-y-4">
                        <p className={`text-sm ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            This will deactivate department <strong>{confirmDeleteDepartment.name}</strong>.
                        </p>
                        {departmentActionError && (
                            <p className="text-xs text-red-500 font-medium">{departmentActionError}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleDeleteDepartment(confirmDeleteDepartment)}
                                disabled={deletingDepartmentId === confirmDeleteDepartment.id}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                {deletingDepartmentId === confirmDeleteDepartment.id ? 'Deleting...' : 'Delete Department'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirmDeleteDepartment(null)
                                    setDepartmentActionError('')
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add Department Modal */}
            {showAddDept && (
                <Modal
                    title={t('fa.addDept')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowAddDept(false)
                        resetAddDepartmentForm()
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleCreateDepartment()
                        }}
                        className="space-y-4"
                    >
                        <div className="mb-6 p-4 rounded-xl border border-primary-500/20 bg-primary-500/5">
                            <label className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 block">Department Purpose</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewDepartment(curr => ({ ...curr, type: 'clinical', name: '' }))
                                        setAddDeptError('')
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${newDepartment.type === 'clinical' ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-surface-700 bg-surface-900/50 text-surface-500 hover:border-surface-600'}`}
                                >
                                    <IconBuilding size={20} />
                                    <span className="text-xs font-bold">Clinical Unit</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={departments.some(d => d.type === 'liaison')}
                                    onClick={() => {
                                        setNewDepartment(curr => ({ ...curr, type: 'liaison', name: 'Liaison Unit' }))
                                        setAddDeptError('')
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${newDepartment.type === 'liaison' ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-surface-700 bg-surface-900/50 text-surface-500 hover:border-surface-600 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                                >
                                    <IconArrowsLeftRight size={20} />
                                    <span className="text-xs font-bold">Liaison Unit</span>
                                </button>
                            </div>
                            {departments.some(d => d.type === 'liaison') && (
                                <p className="text-[10px] text-surface-500 mt-2 text-center">A Liaison Unit already exists for this facility.</p>
                            )}
                        </div>

                        <FormField
                            label="Department Name"
                            required
                            placeholder="e.g. Surgery"
                            value={newDepartment.name}
                            readOnly={newDepartment.type === 'liaison'}
                            onChange={(e) => {
                                if (newDepartment.type !== 'liaison') {
                                    setNewDepartment((current) => ({ ...current, name: e.target.value }))
                                }
                                setAddDeptError('')
                            }}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Admin Name"
                                required
                                placeholder="e.g. Surgery Head"
                                value={newDepartment.adminName}
                                onChange={(e) => {
                                    setNewDepartment((current) => ({ ...current, adminName: e.target.value }))
                                    setAddDeptError('')
                                }}
                            />
                            <FormField
                                label="Admin Username"
                                required
                                placeholder="e.g. surgeryadmin"
                                value={newDepartment.adminUsername}
                                onChange={(e) => {
                                    setNewDepartment((current) => ({ ...current, adminUsername: e.target.value }))
                                    setAddDeptError('')
                                }}
                            />
                        </div>
                        <FormField
                            label="Admin Password"
                            required
                            type="password"
                            placeholder="Set initial password"
                            value={newDepartment.adminPassword}
                            onChange={(e) => {
                                setNewDepartment((current) => ({ ...current, adminPassword: e.target.value }))
                                setAddDeptError('')
                            }}
                        />
                        {addDeptError && (
                            <p className="text-xs text-red-500 font-medium">{addDeptError}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={creatingDepartment}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {creatingDepartment ? 'Creating...' : `Create ${newDepartment.type === 'liaison' ? 'Liaison Unit' : 'Department'}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddDept(false)
                                    resetAddDepartmentForm()
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Reset User Password Modal */}
            {resetPasswordUser && (
                <Modal
                    title="Reset User Password"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconKey size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setResetPasswordUser(null)
                        setUserActionError('')
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
                                setUserActionError('')
                            }}
                        />
                        <FormField
                            label="Confirm Password"
                            type="password"
                            required
                            value={resetPasswordForm.confirmPassword}
                            onChange={(e) => {
                                setResetPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))
                                setUserActionError('')
                            }}
                        />
                        {userActionError && (
                            <p className="text-xs text-red-500 font-medium">{userActionError}</p>
                        )}
                        <div className="flex gap-3 mt-4">
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
                                    setUserActionError('')
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
            {showAddUser && (
                <Modal
                    title="Add Facility User"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowAddUser(false)
                        resetNewUserForm()
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            void handleCreateUser()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Full Name"
                            required
                            placeholder="e.g. Ato Tesfay"
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
                            placeholder="e.g. tesfay.t"
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
                                setNewUser((current) => ({ ...current, role: e.target.value as any }))
                                setNewUserErrors((current) => ({ ...current, role: undefined }))
                            }}
                            error={newUserErrors.role}
                            options={[
                                { value: 'department_head', label: 'Department Head' },
                                { value: 'liaison_officer', label: 'Liaison Officer' },
                            ]}
                        />
                        <FormField
                            label="Department"
                            as="select"
                            required
                            value={newUser.departmentId}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, departmentId: e.target.value }))
                                setNewUserErrors((current) => ({ ...current, departmentId: undefined }))
                            }}
                            error={newUserErrors.departmentId}
                            options={departments
                                .filter(d => {
                                    if (newUser.role === 'liaison_officer') return d.type === 'liaison';
                                    if (newUser.role === 'department_head') return d.type === 'clinical' || !d.type;
                                    return true;
                                })
                                .map((d) => ({ value: d.id, label: d.name }))
                            }
                        />
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
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={savingUser}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {savingUser ? 'Creating...' : 'Create User'}
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
        </div>
    )
}
