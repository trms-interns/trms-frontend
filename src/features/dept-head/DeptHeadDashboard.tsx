import React, { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { trmsApi, type ApiUser } from '../../lib/trmsApi'
import { useReferrals } from '../../context/ReferralContext'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'
import DashboardMiniChart from '../../components/DashboardMiniChart'
import {
    IconUsers,
    IconPlus,
    IconEdit,
    IconCircleCheck,
    IconCircleX,
    IconKey,
    IconClipboardList,
    IconTrash,
} from '@tabler/icons-react'

export default function DeptHeadDashboard() {
    type SortDirection = 'asc' | 'desc'
    type UserSortKey = 'fullName' | 'username' | 'role' | 'status' | 'lastLogin'
    type UserRoleFilter = 'all' | 'doctor' | 'hew' | 'liaison_officer'
    const PAGE_SIZE = 10

    const { t } = useLanguage()
    const { isDark } = useTheme()
    const { user } = useAuth()
    const { referrals } = useReferrals()
    const [tab, setTab] = useState<'users' | 'referrals'>('users')
    const [showAddUser, setShowAddUser] = useState(false)
    const [users, setUsers] = useState<ApiUser[]>([])
    const [loading, setLoading] = useState(true)
    const [creatingUser, setCreatingUser] = useState(false)
    const [addUserError, setAddUserError] = useState('')
    const [showEditUser, setShowEditUser] = useState(false)
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [editingUser, setEditingUser] = useState<ApiUser | null>(null)
    const [resetPasswordUser, setResetPasswordUser] = useState<ApiUser | null>(null)
    const [savingUserEdit, setSavingUserEdit] = useState(false)
    const [savingPasswordReset, setSavingPasswordReset] = useState(false)
    const [editingError, setEditingError] = useState('')
    const [resetPasswordError, setResetPasswordError] = useState('')
    const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null)
    const [lastCreatedUserInfo, setLastCreatedUserInfo] = useState<{
        fullName: string
        username: string
    } | null>(null)
    const [userSearch, setUserSearch] = useState('')
    const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>('all')
    const [userPage, setUserPage] = useState(1)
    const [userSortKey, setUserSortKey] = useState<UserSortKey>('fullName')
    const [userSortDirection, setUserSortDirection] = useState<SortDirection>('asc')
    const [newUser, setNewUser] = useState({
        fullName: '',
        username: '',
        role: 'doctor' as 'doctor' | 'liaison_officer' | 'hew',
        initialPassword: '',
        email: '',
        phone: '',
        birthDate: '',
    })
    const [editUserForm, setEditUserForm] = useState({
        fullName: '',
        role: 'doctor' as 'doctor' | 'liaison_officer' | 'hew',
    })
    const [resetPasswordForm, setResetPasswordForm] = useState({
        password: '',
        confirmPassword: '',
    })

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await trmsApi.getUsers(user?.facilityId, user?.departmentId ?? undefined)
            setUsers(data)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadUsers()
    }, [user?.facilityId])

    const resetAddUserForm = () => {
        setNewUser({
            fullName: '',
            username: '',
            role: 'doctor',
            initialPassword: '',
            email: '',
            phone: '',
            birthDate: '',
        })
        setAddUserError('')
    }

    const handleCreateUser = async () => {
        if (!newUser.fullName.trim() || !newUser.username.trim() || !newUser.role || !newUser.initialPassword.trim()) {
            setAddUserError('Please fill in all required fields.')
            return
        }
        if (!user?.facilityId || !user?.departmentId) {
            setAddUserError('Your account is missing facility or department assignment.')
            return
        }

        try {
            setCreatingUser(true)
            setAddUserError('')
            const createdUser = await trmsApi.createUser({
                fullName: newUser.fullName.trim(),
                username: newUser.username.trim(),
                role: newUser.role,
                departmentId: user.departmentId,
                facilityId: user.facilityId,
                initialPassword: newUser.initialPassword,
                email: newUser.email.trim() || undefined,
                phone: newUser.phone.trim() || undefined,
                birthDate: newUser.birthDate || undefined,
            })
            setLastCreatedUserInfo({
                fullName: createdUser.fullName,
                username: createdUser.username,
            })
            await loadUsers()
            setShowAddUser(false)
            resetAddUserForm()
        } catch (error: any) {
            setAddUserError(error?.message || 'Failed to create user.')
        } finally {
            setCreatingUser(false)
        }
    }

    const openEditModal = (userToEdit: ApiUser) => {
        setEditingUser(userToEdit)
        setEditUserForm({
            fullName: userToEdit.fullName || '',
            role: (userToEdit.role as 'doctor' | 'liaison_officer' | 'hew') || 'doctor',
        })
        setEditingError('')
        setShowEditUser(true)
    }

    const handleSaveUserEdit = async () => {
        if (!editingUser) return
        if (!editUserForm.fullName.trim()) {
            setEditingError('Full name is required.')
            return
        }

        try {
            setSavingUserEdit(true)
            setEditingError('')
            await trmsApi.updateUser(editingUser.id, {
                fullName: editUserForm.fullName.trim(),
                role: editUserForm.role,
            })
            await loadUsers()
            setShowEditUser(false)
            setEditingUser(null)
        } catch (error: any) {
            setEditingError(error?.message || 'Failed to update user.')
        } finally {
            setSavingUserEdit(false)
        }
    }

    const handleToggleUserActive = async (targetUser: ApiUser) => {
        const currentlyActive = targetUser.active !== false
        try {
            setActionLoadingUserId(targetUser.id)
            await trmsApi.updateUser(targetUser.id, { active: !currentlyActive })
            await loadUsers()
        } catch (error: any) {
            alert(error?.message || 'Failed to update user status.')
        } finally {
            setActionLoadingUserId(null)
        }
    }

    const handleDeleteUser = async (targetUser: ApiUser) => {
        const confirmed = window.confirm(
            `Delete ${targetUser.fullName}? This action cannot be undone.`,
        )
        if (!confirmed) return

        try {
            setActionLoadingUserId(targetUser.id)
            await trmsApi.deleteUser(targetUser.id)
            await loadUsers()
        } catch (error: any) {
            alert(error?.message || 'Failed to delete user.')
        } finally {
            setActionLoadingUserId(null)
        }
    }

    const openResetPasswordModal = (targetUser: ApiUser) => {
        setResetPasswordUser(targetUser)
        setResetPasswordForm({ password: '', confirmPassword: '' })
        setResetPasswordError('')
        setShowResetPassword(true)
    }

    const handleResetPassword = async () => {
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
            setSavingPasswordReset(true)
            setResetPasswordError('')
            await trmsApi.updateUser(resetPasswordUser.id, { password })
            await loadUsers()
            setShowResetPassword(false)
            setResetPasswordUser(null)
            setResetPasswordForm({ password: '', confirmPassword: '' })
        } catch (error: any) {
            setResetPasswordError(error?.message || 'Failed to reset password.')
        } finally {
            setSavingPasswordReset(false)
        }
    }

    // Users managed by the department head in this department
    const deptUsers = users.filter(
        (u) =>
            u.departmentId === user?.departmentId &&
            u.id !== user?.id &&
            ['doctor', 'hew', 'liaison_officer'].includes(u.role),
    )
    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase()
        const roleScopedUsers = userRoleFilter === 'all'
            ? deptUsers
            : deptUsers.filter((u) => u.role === userRoleFilter)

        if (!q) return roleScopedUsers
        return roleScopedUsers.filter((u) => {
            const statusValue = u.active === false ? 'inactive' : 'active'
            return (
                u.fullName.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q) ||
                statusValue.includes(q) ||
                String(u.lastLogin || '').toLowerCase().includes(q)
            )
        })
    }, [deptUsers, userRoleFilter, userSearch])

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
                left = a.role || ''
                right = b.role || ''
            } else if (userSortKey === 'status') {
                left = a.active === false ? 0 : 1
                right = b.active === false ? 0 : 1
            } else {
                left = a.lastLogin || ''
                right = b.lastLogin || ''
            }

            if (typeof left === 'number' && typeof right === 'number') {
                return (left - right) * direction
            }
            return String(left).localeCompare(String(right)) * direction
        })
    }, [filteredUsers, userSortDirection, userSortKey])

    const userTotalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))
    const pagedUsers = sortedUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE)

    useEffect(() => {
        setUserPage(1)
    }, [userSearch, userRoleFilter, deptUsers.length])

    useEffect(() => {
        if (userPage > userTotalPages) {
            setUserPage(userTotalPages)
        }
    }, [userPage, userTotalPages])

    const toggleUserSort = (key: UserSortKey) => {
        if (userSortKey === key) {
            setUserSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
            return
        }
        setUserSortKey(key)
        setUserSortDirection('asc')
    }
    // Referrals for this department. Prefer backend ids; fall back to mock name matching.
    const deptReferrals = useMemo(() => {
        if (!user) return []

        const hasExplicitDepartmentData = referrals.some(
            (r) => Boolean(r.receivingDepartmentId) || Boolean(r.department),
        )

        if (!hasExplicitDepartmentData) {
            // Backend responses for department heads are already role-scoped.
            return referrals
        }

        return referrals.filter((r) => {
            if (r.receivingDepartmentId && user.departmentId) {
                return r.receivingDepartmentId === user.departmentId
            }

            if (r.department && user.department) {
                return r.department === user.department
            }

            return false
        })
    }, [referrals, user])

    const card = `rounded-2xl border p-5 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'}`
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active
        ? isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-100 text-primary-700'
        : isDark ? 'text-surface-400 hover:text-surface-200' : 'text-surface-500 hover:text-surface-700'
    }`
    const deptChartData = [
        { label: 'Users', value: deptUsers.length, colorClass: 'bg-primary-600' },
        { label: 'Pending', value: deptReferrals.filter((r) => r.status === 'pending').length, colorClass: 'bg-amber-500' },
        { label: 'Accepted', value: deptReferrals.filter((r) => r.status === 'accepted').length, colorClass: 'bg-emerald-500' },
        { label: 'Rejected', value: deptReferrals.filter((r) => r.status === 'rejected').length, colorClass: 'bg-red-500' },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">{t('dh.title')}</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {user?.department} — {user?.facility}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}>
                        <span className="flex items-center gap-1.5"><IconUsers size={14} />{t('dh.users')}</span>
                    </button>
                    <button onClick={() => setTab('referrals')} className={tabCls(tab === 'referrals')}>
                        <span className="flex items-center gap-1.5"><IconClipboardList size={14} />{t('dh.referralOverview')}</span>
                    </button>
                </div>
            </div>

            <DashboardMiniChart title="Department Performance Snapshot" data={deptChartData} />

            {tab === 'users' && (
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <IconUsers size={15} className="text-primary-400" />
                            {t('dh.users')} ({filteredUsers.length})
                        </h3>
                        <button
                            onClick={() => {
                                resetAddUserForm()
                                setShowAddUser(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                            <IconPlus size={13} /> {t('dh.addUser')}
                        </button>
                    </div>
                    <div className="mb-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className={`w-full sm:w-80 px-3 py-2 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            />
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value as UserRoleFilter)}
                                className={`w-full sm:w-48 px-3 py-2 rounded-lg text-xs border outline-none ${isDark ? 'bg-surface-950 border-surface-800 text-surface-100 focus:border-primary-400' : 'bg-surface-50 border-surface-200 focus:border-primary-500'}`}
                            >
                                <option value="all">All roles</option>
                                <option value="doctor">Doctor</option>
                                <option value="hew">HEW</option>
                                <option value="liaison_officer">Liaison Officer</option>
                            </select>
                        </div>
                    </div>
                    {lastCreatedUserInfo && (
                        <div className={`mb-3 p-3 rounded-lg border text-xs ${isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                            Created <strong>{lastCreatedUserInfo.fullName}</strong>. Login username: <strong>{lastCreatedUserInfo.username}</strong>
                        </div>
                    )}

                    {loading ? (
                        <p className="text-sm text-surface-500">Loading users...</p>
                    ) : filteredUsers.length === 0 ? (
                        <p className="text-sm text-surface-500">No users in this department</p>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('fullName')} className="hover:text-primary-500 transition-colors">
                                                {t('common.name')}{userSortKey === 'fullName' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('username')} className="hover:text-primary-500 transition-colors">
                                                Username{userSortKey === 'username' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('role')} className="hover:text-primary-500 transition-colors">
                                                {t('common.role')}{userSortKey === 'role' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('status')} className="hover:text-primary-500 transition-colors">
                                                {t('common.status')}{userSortKey === 'status' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                                            </button>
                                        </th>
                                        <th className="text-left pb-2 font-semibold text-surface-400 uppercase tracking-wide">
                                            <button onClick={() => toggleUserSort('lastLogin')} className="hover:text-primary-500 transition-colors">
                                                {t('common.lastLogin')}{userSortKey === 'lastLogin' ? (userSortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
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
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {u.fullName.split(' ').filter(w => !['Dr.', 'Sr.', 'Ato'].includes(w)).map(w => w[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="font-medium">{u.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-surface-500">{u.username}</td>
                                        <td className="py-3 text-surface-400">{u.role}</td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.active !== false
                                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                                                : 'bg-surface-500/15 text-surface-400 border-surface-500/25'
                                            }`}>
                                                {u.active !== false ? <><IconCircleCheck size={9} /> {t('common.active')}</> : <>{t('common.inactive')}</>}
                                            </span>
                                        </td>
                                        <td className="py-3 text-surface-500">{u.lastLogin || '—'}</td>
                                        <td className="py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    disabled={actionLoadingUserId === u.id}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                    title="Edit"
                                                >
                                                    <IconEdit size={13} />
                                                </button>
                                                <button
                                                    onClick={() => openResetPasswordModal(u)}
                                                    disabled={actionLoadingUserId === u.id}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-surface-800 text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`}
                                                    title="Reset Password"
                                                >
                                                    <IconKey size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleUserActive(u)}
                                                    disabled={actionLoadingUserId === u.id}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.active !== false
                                                    ? 'hover:bg-red-500/10 text-red-400'
                                                    : 'hover:bg-emerald-500/10 text-emerald-400'
                                                }`}
                                                    title={u.active !== false ? 'Disable' : 'Enable'}
                                                >
                                                    {u.active !== false ? <IconCircleX size={13} /> : <IconCircleCheck size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u)}
                                                    disabled={actionLoadingUserId === u.id}
                                                    className="p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:bg-red-500/10 text-red-400"
                                                    title="Delete"
                                                >
                                                    <IconTrash size={13} />
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

            {tab === 'referrals' && (
                <div className={card}>
                    <h3 className="text-sm font-bold mb-4">Department Referrals ({deptReferrals.length})</h3>
                    {deptReferrals.length === 0 ? (
                        <p className="text-sm text-surface-500 text-center py-6">{t('common.noData')}</p>
                    ) : (
                        <div className="space-y-2">
                            {deptReferrals.map(ref => (
                                <div key={ref.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-surface-950' : 'bg-surface-50'}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${ref.priority === 'emergency' ? 'bg-red-500' : ref.priority === 'urgent' ? 'bg-amber-500' : 'bg-[#2b4968]'}`}>
                                        {ref.patientName.split(' ').map(w => w[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ref.patientName}</p>
                                        <p className="text-xs text-surface-500 truncate">{ref.chiefComplaint}</p>
                                    </div>
                                    <StatusBadge type="priority" value={ref.priority} />
                                    <StatusBadge type="sync" value={ref.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add User Modal */}
            {showAddUser && (
                <Modal
                    title={t('dh.addUser')}
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconPlus size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowAddUser(false)
                        resetAddUserForm()
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
                            placeholder="e.g. Dr. Berhe Tadesse"
                            value={newUser.fullName}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, fullName: e.target.value }))
                                setAddUserError('')
                            }}
                        />
                        <FormField
                            label="Role"
                            as="select"
                            required
                            value={newUser.role}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, role: e.target.value as typeof current.role }))
                                setAddUserError('')
                            }}
                            options={[
                                { value: 'doctor', label: 'Doctor' },
                                { value: 'liaison_officer', label: 'Liaison Officer' },
                                { value: 'hew', label: 'Health Extension Worker' },
                            ]}
                        />
                        <FormField
                            label="Username"
                            required
                            placeholder="e.g. dr.tasew"
                            value={newUser.username}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, username: e.target.value }))
                                setAddUserError('')
                            }}
                        />
                        <FormField
                            label="Initial Password"
                            type="password"
                            required
                            placeholder="Set a temporary password"
                            value={newUser.initialPassword}
                            onChange={(e) => {
                                setNewUser((current) => ({ ...current, initialPassword: e.target.value }))
                                setAddUserError('')
                            }}
                        />
                        <FormField
                            label="Email (optional)"
                            type="email"
                            placeholder="e.g. user@example.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser((current) => ({ ...current, email: e.target.value }))}
                        />
                        <FormField
                            label="Phone (optional)"
                            placeholder="e.g. 0911223344"
                            value={newUser.phone}
                            onChange={(e) => setNewUser((current) => ({ ...current, phone: e.target.value }))}
                        />
                        <FormField
                            label="Date of Birth (optional)"
                            type="date"
                            value={newUser.birthDate}
                            onChange={(e) => setNewUser((current) => ({ ...current, birthDate: e.target.value }))}
                        />
                        <p className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
                            Department: <strong>{user?.department}</strong> · Facility: <strong>{user?.facility}</strong> (auto-assigned)
                        </p>
                        {addUserError && (
                            <p className="text-xs text-red-500 font-medium">{addUserError}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={creatingUser}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {creatingUser ? 'Creating...' : 'Create User'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddUser(false)
                                    resetAddUserForm()
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit User Modal */}
            {showEditUser && editingUser && (
                <Modal
                    title="Edit User"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconEdit size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowEditUser(false)
                        setEditingUser(null)
                        setEditingError('')
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            void handleSaveUserEdit()
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            label="Full Name"
                            required
                            value={editUserForm.fullName}
                            onChange={(e) => {
                                setEditUserForm((current) => ({ ...current, fullName: e.target.value }))
                                setEditingError('')
                            }}
                        />
                        <FormField
                            label="Role"
                            as="select"
                            required
                            value={editUserForm.role}
                            onChange={(e) => {
                                setEditUserForm((current) => ({
                                    ...current,
                                    role: e.target.value as typeof current.role,
                                }))
                                setEditingError('')
                            }}
                            options={[
                                { value: 'doctor', label: 'Doctor' },
                                { value: 'liaison_officer', label: 'Liaison Officer' },
                                { value: 'hew', label: 'Health Extension Worker' },
                            ]}
                        />
                        {editingError && <p className="text-xs text-red-500 font-medium">{editingError}</p>}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={savingUserEdit}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {savingUserEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditUser(false)
                                    setEditingUser(null)
                                    setEditingError('')
                                }}
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDark ? 'border-surface-600 text-surface-300' : 'border-surface-300'}`}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Reset Password Modal */}
            {showResetPassword && resetPasswordUser && (
                <Modal
                    title="Reset Password"
                    icon={<div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}><IconKey size={14} className={isDark ? 'text-primary-300' : 'text-primary-600'} /></div>}
                    onClose={() => {
                        setShowResetPassword(false)
                        setResetPasswordUser(null)
                        setResetPasswordForm({ password: '', confirmPassword: '' })
                        setResetPasswordError('')
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            void handleResetPassword()
                        }}
                        className="space-y-4"
                    >
                        <p className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
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
                        <p className={`text-[10px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
                            User will be required to change this password at next login.
                        </p>
                        {resetPasswordError && <p className="text-xs text-red-500 font-medium">{resetPasswordError}</p>}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={savingPasswordReset}
                                className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
                            >
                                {savingPasswordReset ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowResetPassword(false)
                                    setResetPasswordUser(null)
                                    setResetPasswordForm({ password: '', confirmPassword: '' })
                                    setResetPasswordError('')
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
