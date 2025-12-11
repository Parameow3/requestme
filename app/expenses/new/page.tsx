'use client'
import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NewExpense() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const categories = [
    { value: 'travel', label: '✈️ Travel', icon: '✈️' },
    { value: 'meals', label: '🍽️ Meals & Entertainment', icon: '🍽️' },
    { value: 'supplies', label: '📦 Office Supplies', icon: '📦' },
    { value: 'software', label: '💻 Software & Tools', icon: '💻' },
    { value: 'general', label: '📋 General', icon: '📋' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setTitle('')
      setAmount('')
      setCategory('general')
      setDescription('')
      setFile(null)
      setLoading(false)
      setTimeout(() => setSuccess(false), 3000)
      return
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in to submit an expense!')
      setLoading(false)
      return
    }

    let receiptUrl = null

    // 1. Upload the file if one was selected
    if (file) {
      // Create a unique file name: user_id + timestamp + original name
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      
      const { data, error: uploadError } = await supabase
        .storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) {
        alert('Error uploading receipt: ' + uploadError.message)
        setLoading(false)
        return
      }

      // Get the Public URL so we can save it to the database
      const { data: urlData } = supabase
        .storage
        .from('receipts')
        .getPublicUrl(fileName)
      
      receiptUrl = urlData.publicUrl
    }

    // 2. Insert record into Database with the receipt_url
    const { error } = await supabase
      .from('expenses')
      .insert({
        title,
        amount: parseFloat(amount),
        category,
        description,
        user_id: user.id,
        status: 'pending_manager',
        receipt_url: receiptUrl
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setSuccess(true)
      setTitle('')
      setAmount('')
      setCategory('general')
      setDescription('')
      setFile(null)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-primary)] rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[var(--color-accent)] rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-lg mx-auto pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">New Expense Claim</h1>
          <p className="text-[var(--color-text-muted)]">Submit your expense for approval</p>
        </div>

        {/* Demo mode notice */}
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--color-primary)]">Demo Mode</p>
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
              <p className="font-medium text-[var(--color-success)]">Expense submitted!</p>
              <p className="text-sm text-[var(--color-text-muted)]">Your claim is pending approval</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Expense Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Client dinner at Nobu"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    category === cat.value
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-text)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="block text-xs mt-1 truncate">{cat.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Description <span className="text-[var(--color-text-muted)]/50">(optional)</span>
            </label>
            <textarea
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this expense..."
              rows={3}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-muted)]">
              Upload Receipt <span className="text-[var(--color-text-muted)]/50">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-surface-light)] text-[var(--color-text)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 cursor-pointer"
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-primary)]/25 flex items-center justify-center gap-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Expense Claim
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-8">
          Claims are typically reviewed within 24-48 hours
        </p>
      </div>
    </div>
  )
}
