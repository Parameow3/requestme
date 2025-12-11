'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Allowed roles for the dropdown
  const roles = ['employee', 'manager', 'finance', 'president', 'admin']

  useEffect(() => {
    checkAccessAndFetch()
  }, [])

  const checkAccessAndFetch = async () => {
    setLoading(true)

    if (!supabase) {
      router.push('/login')
      return
    }

    // 1. Security Check: Are you an admin?
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // We verify against the profile table to be sure
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUserProfile?.role !== 'admin') {
      alert('Access Denied: Admins only.')
      router.push('/')
      return
    }

    // 2. Fetch All Users
    const { data: allUsers, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true })

    if (error) {
      alert('Error fetching users')
      console.error(error)
    } else {
      setUsers(allUsers || [])
    }
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabase) return

    // Optimistic UI update (update screen before DB finishes)
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Failed to update role: ' + error.message)
      // Revert change if failed
      checkAccessAndFetch() 
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'president':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'finance':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'manager':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Verifying Admin Access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">User Management</h1>
        </div>
        <p className="text-[var(--color-text-muted)]">Manage user roles and permissions across the organization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {roles.map(role => {
          const count = users.filter(u => u.role === role).length
          return (
            <div key={role} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${
                role === 'admin' ? 'text-purple-600' :
                role === 'president' ? 'text-red-600' :
                role === 'finance' ? 'text-blue-600' :
                role === 'manager' ? 'text-amber-600' :
                'text-green-600'
              }`}>{count}</div>
              <div className="text-xs text-[var(--color-text-muted)] capitalize">{role}s</div>
            </div>
          )
        })}
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-surface-light)]">
            <thead className="bg-[var(--color-surface-light)]/50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-light)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--color-surface-light)]/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-semibold text-sm">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--color-text)]">
                          {user.full_name || 'No Name'}
                        </div>
                        <div className="text-sm text-[var(--color-text-muted)] sm:hidden">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)] hidden sm:table-cell">
                    {user.email}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="block w-full pl-3 pr-8 py-2 text-sm border border-[var(--color-surface-light)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent rounded-xl cursor-pointer transition-all"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            No users found
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Role Permissions:</strong>
            <ul className="mt-1 space-y-1 text-purple-700 dark:text-purple-300">
              <li>• <strong>Employee:</strong> Submit requests, view own history</li>
              <li>• <strong>Manager:</strong> Approve up to $20</li>
              <li>• <strong>Finance:</strong> Approve up to $50</li>
              <li>• <strong>President:</strong> Approve any amount</li>
              <li>• <strong>Admin:</strong> Manage all users and roles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
