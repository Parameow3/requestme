'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Fetch user role for admin check
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setRole(data?.role || 'employee')
      }
    }
    getRole()
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    setIsMenuOpen(false)
  }

  if (!user) return null

  return (
    <nav className="glass sticky top-0 z-50 border-b border-[var(--color-surface-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors">
              ExpensePro
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-2">
            <Link 
              href="/" 
              className="text-[var(--color-text)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-light)] px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Home
            </Link>
            <Link 
              href="/expenses/new" 
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-light)] px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              New Expense
            </Link>
            <Link 
              href="/purchase-orders/new" 
              className="text-[var(--color-text-muted)] hover:text-[var(--color-success)] hover:bg-[var(--color-success)]/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              New PO
            </Link>
            <Link 
              href="/manager" 
              className="text-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Manager
            </Link>

            {/* Admin Panel - Only visible to admins */}
            {role === 'admin' && (
              <Link 
                href="/admin" 
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-purple-200 bg-purple-50"
              >
                Admin
              </Link>
            )}
            
            {/* Notification Bell */}
            <NotificationBell />
            
            <button
              onClick={handleSignOut}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex items-center sm:hidden gap-1">
            {/* Mobile Notification Bell */}
            <NotificationBell />
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] focus:outline-none transition-all"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-[var(--color-surface-light)]">
          <div className="pt-2 pb-3 space-y-1 px-3">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-all"
            >
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <Link 
              href="/expenses/new" 
              onClick={() => setIsMenuOpen(false)} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text)] transition-all"
            >
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Expense
            </Link>
            <Link 
              href="/purchase-orders/new" 
              onClick={() => setIsMenuOpen(false)} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-success)]/10 hover:text-[var(--color-success)] transition-all"
            >
              <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              New PO
            </Link>
            <Link 
              href="/manager" 
              onClick={() => setIsMenuOpen(false)} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Manager Dashboard
            </Link>

            {/* Admin Panel - Only visible to admins */}
            {role === 'admin' && (
              <Link 
                href="/admin" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-purple-600 hover:bg-purple-500/10 border border-purple-200 bg-purple-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Admin Panel
              </Link>
            )}
            
            <div className="border-t border-[var(--color-surface-light)] my-2"></div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
