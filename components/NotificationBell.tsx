'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Notification {
  id: number
  message: string
  is_read: boolean
  created_at: string
  link: string | null
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    fetchNotifications()

    // Real-time listener: Update immediately when a new notification comes in
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Add new notification to the list
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notification-bell-container')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10) // Only get latest 10

    if (data) setNotifications(data)
  }

  const toggleDropdown = async () => {
    const wasOpen = isOpen
    setIsOpen(!isOpen)
    
    // Mark as read when opening the dropdown
    if (!wasOpen && unreadCount > 0) {
      // Optimistic update
      const updated = notifications.map(n => ({ ...n, is_read: true }))
      setNotifications(updated)

      // Update DB
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
      }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative notification-bell-container">
      {/* Bell Icon Button */}
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] rounded-xl transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-error)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-error)]"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass rounded-2xl shadow-lg overflow-hidden z-50 border border-[var(--color-surface-light)]">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-[var(--color-text-muted)] opacity-50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-[var(--color-text-muted)]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-3 border-b border-[var(--color-surface-light)] hover:bg-[var(--color-surface-light)] transition-all ${
                          !n.is_read ? 'bg-[var(--color-primary)]/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            !n.is_read ? 'bg-[var(--color-primary)]' : 'bg-transparent'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.is_read ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              {formatTime(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className={`px-4 py-3 border-b border-[var(--color-surface-light)] ${
                        !n.is_read ? 'bg-[var(--color-primary)]/5' : ''
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            !n.is_read ? 'bg-[var(--color-primary)]' : 'bg-transparent'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.is_read ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              {formatTime(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
