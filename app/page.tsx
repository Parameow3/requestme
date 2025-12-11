'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Expense {
  id: number
  created_at: string
  title: string
  amount: number
  status: string
  user_id: string
}

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState({ pendingCount: 0, approvedTotal: 0 })
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Check active session and fetch data
    const checkUserAndFetchData = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        // Demo mode - skip auth check
        setUser({ email: 'demo@example.com' })
        setProfile({ id: 'demo', email: 'demo@example.com', full_name: 'Demo User', role: 'employee' })
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }
      
      // Fetch user's expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (expensesData) {
        setExpenses(expensesData)
        
        // Calculate stats
        const pendingCount = expensesData.filter(e => 
          e.status === 'pending' || 
          e.status === 'pending_manager' || 
          e.status === 'pending_finance' || 
          e.status === 'pending_president'
        ).length
        
        const approvedTotal = expensesData
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + e.amount, 0)
        
        setStats({ pendingCount, approvedTotal })
      }
      
      setLoading(false)
    }
    checkUserAndFetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-6 h-6 text-[var(--color-primary)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[var(--color-text-muted)]">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--color-primary)] rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[var(--color-accent)] rounded-full opacity-15 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-full opacity-10 blur-2xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>

          {/* Add Button with Dropdown */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/50 transition-all hover:scale-105"
            >
              <svg 
                className={`w-5 h-5 text-white transition-transform duration-200 ${showAddMenu ? 'rotate-45' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl glass border border-[var(--color-surface-light)] shadow-xl overflow-hidden z-50">
                <Link
                  href="/expenses/new"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-light)] transition-colors"
                  onClick={() => setShowAddMenu(false)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">New Expense</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Submit a claim</p>
                  </div>
                </Link>
                <Link
                  href="/purchase-orders/new"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-light)] transition-colors border-t border-[var(--color-surface-light)]"
                  onClick={() => setShowAddMenu(false)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">New PO</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Request a purchase order</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Hero section */}
        <main className="flex-1 px-6 pb-8">
          <div className="max-w-lg mx-auto pt-8">
            {/* Welcome */}
            <div className="mb-12">
              <p className="text-[var(--color-text-muted)] mb-2">Welcome back 👋</p>
              <h1 className="text-4xl font-bold leading-tight">
                <span className="gradient-text">{profile?.full_name || user?.email}</span>
              </h1>
              <p className="text-[var(--color-text-muted)] mt-2">Manage your <span className="text-[var(--color-text)]">expenses</span> with ease</p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Submit Expense */}
                <Link 
                  href="/expenses/new" 
                  className="glass rounded-2xl p-6 hover:border-[var(--color-primary)]/30 cursor-pointer group block"
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">Submit Expense</h3>
                  <p className="text-[var(--color-text-muted)] text-sm">Upload a receipt and claim a refund.</p>
                </Link>

                {/* Card 2: Request PO */}
                <Link 
                  href="/purchase-orders/new" 
                  className="glass rounded-2xl p-6 hover:border-[var(--color-success)]/30 cursor-pointer group block"
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-success)] mb-2">Request PO</h3>
                  <p className="text-[var(--color-text-muted)] text-sm">Create a purchase order for vendors.</p>
                </Link>

                {/* Card 3: Manager Dashboard */}
                <Link 
                  href="/manager" 
                  className="glass rounded-2xl p-6 hover:border-[var(--color-accent)]/30 cursor-pointer group block md:col-span-2"
                >
                  <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">👀</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-accent)] mb-2">Manager Dashboard</h3>
                  <p className="text-[var(--color-text-muted)] text-sm">Review and approve employee expense requests.</p>
                </Link>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass rounded-2xl p-5 glow">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-sm text-[var(--color-text-muted)]">Pending</p>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold">${stats.approvedTotal.toLocaleString()}</p>
                <p className="text-sm text-[var(--color-text-muted)]">Approved</p>
              </div>
            </div>

            {/* Recent expenses */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Claims</h2>
                <Link href="/expenses" className="text-sm text-[var(--color-primary)] hover:text-[var(--color-accent)]">View all</Link>
              </div>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="glass rounded-xl p-6 text-center">
                    <p className="text-[var(--color-text-muted)]">No expense claims yet</p>
                    <Link href="/expenses/new" className="text-[var(--color-primary)] text-sm hover:underline mt-2 inline-block">
                      Submit your first expense →
                    </Link>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="glass rounded-xl p-4 flex items-center gap-4 hover:border-[var(--color-primary)]/30 cursor-pointer group">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-light)] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        📝
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{expense.title}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">${expense.amount.toFixed(2)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        expense.status === 'approved' 
                          ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                          : expense.status === 'rejected'
                          ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                          : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                      }`}>
                        {expense.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}
