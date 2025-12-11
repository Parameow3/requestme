'use client'
import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NewPurchaseOrder() {
  const [vendor, setVendor] = useState('')
  const [details, setDetails] = useState('')
  const [cost, setCost] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setVendor('')
      setDetails('')
      setCost('')
      setLoading(false)
      setTimeout(() => {
        setSuccess(false)
        router.push('/')
      }, 2000)
      return
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in to request a PO.')
      setLoading(false)
      return
    }

    // Insert into Supabase
    const { error } = await supabase
      .from('purchase_orders')
      .insert({
        vendor_name: vendor,
        item_details: details,
        total_cost: parseFloat(cost),
        requester_id: user.id,
        status: 'pending_manager' // Start at manager approval stage
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setSuccess(true)
      setVendor('')
      setDetails('')
      setCost('')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-success)] rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-success)] to-[var(--color-accent)] rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-lg mx-auto pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Request Purchase Order</h1>
          <p className="text-[var(--color-text-muted)]">Get approval before purchasing items from a vendor</p>
        </div>

        {/* Demo mode notice */}
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--color-success)]">Demo Mode</p>
              <p className="text-sm text-[var(--color-text-muted)]">Configure Supabase in .env.local to save data</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--color-success)]">PO Request Submitted!</p>
              <p className="text-sm text-[var(--color-text-muted)]">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Vendor Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-success)]"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
              placeholder="e.g. Amazon, Dell, Local Catering Co."
            />
          </div>

          {/* Item Details */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Item Details / List
            </label>
            <textarea
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-success)] resize-none"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              placeholder="List the items, quantities, and specific model numbers here..."
              rows={5}
            />
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Total Estimated Cost
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-success)]"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--color-success)] to-emerald-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-success)]/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Submit PO Request
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-8">
          PO requests are typically reviewed within 24-48 hours
        </p>
      </div>
    </div>
  )
}
