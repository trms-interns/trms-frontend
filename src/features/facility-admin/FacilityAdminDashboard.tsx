import React, { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { trmsApi, type ApiFacility, type ApiUser, type Department } from '../../lib/trmsApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
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
} from '@tabler/icons-react'

export default function FacilityAdminDashboard() {
    type SortDirection = 'asc' | 'desc'
    type DepartmentSortKey = 'name' | 'type' | 'status'
    const PAGE_SIZE = 10

    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const [tab, setTab] = useState<'departments' | 'service' | 'reports'>('departments')
    const [showAddDept, setShowAddDept] = useState(false)
    const [facilities, setFacilities] = useState<ApiFacility[]>([])
    const [users, setUsers] = useState<ApiUser[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [creatingDepartment, setCreatingDepartment] = useState(false)
    const [savingDepartment, setSavingDepartment] = useState(false)
    const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null)
    const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null)
    const [addDeptError, setAddDeptError] = useState('')
    const [departmentActionError, setDepartmentActionError] = useState('')
    const [serviceActionError, setServiceActionError] = useState('')
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
    const [confirmDeleteDepartment, setConfirmDeleteDepartment] = useState<Department | null>(null)
    const [departmentSearch, setDepartmentSearch] = useState('')
    const [departmentPage, setDepartmentPage] = useState(1)
    const [departmentSortKey, setDepartmentSortKey] = useState<DepartmentSortKey>('name')
    const [departmentSortDirection, setDepartmentSortDirection] = useState<SortDirection>('asc')
    const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().slice(0, 7))
    const [reportLoading, setReportLoading] = useState(false)
    const [reportError, setReportError] = useState('')
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

    const loadFacilityAdminData = async () => {
        setLoading(true)
        try {
            const [facilitiesData, usersData, departmentsData] = await Promise.all([
                trmsApi.getFacilities(),
                trmsApi.getUsers(user?.facilityId),
                user?.facilityId ? trmsApi.getDepartments(user.facilityId) : Promise.resolve([]),
            ])
            setFacilities(facilitiesData)
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
            const result: any = await trmsApi.getReport({
                month: period,
                facilityId,
            })
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
            const blob = await trmsApi.exportReport({
                month: reportPeriod,
                facilityId,
                format: 'csv',
            })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `facility-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
        URL.revokeObjectURL(url)
        } catch (error: any) {
            setReportError(error?.message || 'Failed to export report.')
        }
    }

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

    const handleUpdateServiceStatus = async (
        serviceId: string,
        status: 'available' | 'limited' | 'unavailable',
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
            })
            setFacilities((current) =>
                current.map((item) =>
                    item.id !== facilityId
                        ? item
                        : {
                            ...item,
                            services: item.services.map((service) =>
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
    }, [tab, reportPeriod, user?.facilityId, facility?.id])

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
                    <button onClick={() => setTab('service')} className={tabCls(tab === 'service')}>
                        <span className="flex items-center gap-1.5"><IconSettings size={14} />{t('nav.serviceStatus')}</span>
                    </button>
                    <button onClick={() => setTab('reports')} className={tabCls(tab === 'reports')}>
                        <span className="flex items-center gap-1.5"><IconChartBar size={14} />{t('nav.reports')}</span>
                    </button>
                </div>
            </div>

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

            {/* ── SERVICE STATUS TAB ─────────────────────────────────────── */}
            {tab === 'service' && (
                <div className={card}>
                    <h3 className="text-sm font-bold mb-4">{t('dir.serviceStatus')} — {facilityName}</h3>
                    {serviceActionError && (
                        <p className="mb-3 text-xs text-red-500 font-medium">{serviceActionError}</p>
                    )}
                    {loading ? (
                        <p className="text-sm text-surface-500">Loading...</p>
                    ) : (
                        <div className="space-y-2">
                            {facility?.services?.map(dept => {
                                const sc = statusConfig[dept.status]
                                return (
                                    <div key={dept.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${isDark ? 'border-surface-800 bg-surface-950' : 'border-surface-200 bg-surface-50'}`}>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{dept.serviceType}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>{sc.icon} {dept.status}</span>
                                        {/* TODO (Backend Team): PATCH /api/services/{dept.id} { status, estimated_delay_days } */}
                                        <select
                                            value={dept.status}
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
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold">Monthly Report — {facilityName}</h3>
                            <input
                                type="month"
                                value={reportPeriod}
                                onChange={(e) => setReportPeriod(e.target.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
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
                    {reportLoading ? (
                        <p className="text-sm text-surface-500">Loading backend report summary...</p>
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
                        <FormField
                            label="Department Name"
                            required
                            placeholder="e.g. Surgery"
                            value={newDepartment.name}
                            onChange={(e) => {
                                setNewDepartment((current) => ({ ...current, name: e.target.value }))
                                setAddDeptError('')
                            }}
                        />
                        <FormField
                            label="Facility ID"
                            required
                            value={newDepartment.facilityId || user?.facilityId || facility?.id || ''}
                            onChange={(e) => setNewDepartment((current) => ({ ...current, facilityId: e.target.value }))}
                            hint="Auto-filled from your assigned facility."
                        />
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
                        <FormField
                            label="Department Type"
                            as="select"
                            required
                            value={newDepartment.type}
                            onChange={(e) => setNewDepartment((current) => ({ ...current, type: e.target.value as 'clinical' | 'liaison' }))}
                            options={[
                                { value: 'clinical', label: 'Clinical' },
                                { value: 'liaison', label: 'Liaison' },
                            ]}
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
                                {creatingDepartment ? 'Creating...' : 'Create Department'}
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
        </div>
    )
}
