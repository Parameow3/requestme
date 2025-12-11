'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) {
        alert(error.message)
      } else {
        alert('Success! Please check your email for the confirmation link.')
        setIsSignUp(false)
      }
    } else {
      // --- SIGN IN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        alert(error.message)
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span className="font-semibold text-xl">ExpensePro</span>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 glow">
          <h1 className="text-2xl font-bold text-center mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-[var(--color-text-muted)] text-center mb-6">
            {isSignUp ? 'Sign up to start managing expenses' : 'Sign in to your account'}
          </p>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {/* Full Name Input - ONLY visible during Sign Up */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  required={isSignUp}
                  placeholder="e.g. John Doe"
                  className="block w-full rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-surface-light)] p-3 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="block w-full rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-surface-light)] p-3 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="block w-full rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-surface-light)] p-3 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/50 disabled:opacity-50 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--color-text-muted)] text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setFullName('')
              }}
              className="text-[var(--color-primary)] hover:text-[var(--color-accent)] font-medium mt-1 text-sm"
            >
              {isSignUp ? 'Sign in here' : 'Create an account'}
            </button>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-[var(--color-text-muted)] text-xs mt-6">
          Secure expense management for your team
        </p>
      </div>
    </div>
  )
}
