'use client'
import { useEffect, useState } from 'react'
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed
} from '@/lib/pushNotifications'

export default function PushNotificationManager() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Check if push is supported
      const pushSupported = isPushSupported()
      setSupported(pushSupported)
      
      if (!pushSupported) return

      // Register service worker
      await registerServiceWorker()

      // Check current permission
      const currentPermission = getNotificationPermission()
      setPermission(currentPermission)

      // Check if already subscribed
      const alreadySubscribed = await isSubscribed()
      setSubscribed(alreadySubscribed)

      // Show banner if not subscribed and permission not denied
      if (!alreadySubscribed && currentPermission !== 'denied') {
        // Delay showing banner for better UX
        const hasSeenBanner = localStorage.getItem('push-banner-dismissed')
        if (!hasSeenBanner) {
          setTimeout(() => setShowBanner(true), 3000)
        }
      }
    }

    init()
  }, [])

  const handleEnablePush = async () => {
    setLoading(true)
    try {
      // Request permission first
      const newPermission = await requestNotificationPermission()
      setPermission(newPermission)

      if (newPermission === 'granted') {
        // Subscribe to push
        const subscription = await subscribeToPush()
        if (subscription) {
          setSubscribed(true)
          setShowBanner(false)
        }
      }
    } catch (error) {
      console.error('Error enabling push:', error)
    }
    setLoading(false)
  }

  const handleDisablePush = async () => {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } catch (error) {
      console.error('Error disabling push:', error)
    }
    setLoading(false)
  }

  const dismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem('push-banner-dismissed', 'true')
  }

  // Don't render anything if not supported
  if (!supported) return null

  // Banner to prompt user to enable notifications
  if (showBanner && !subscribed && permission !== 'denied') {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="glass rounded-2xl p-4 border border-[var(--color-surface-light)] shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Enable Push Notifications
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Get notified instantly when your requests are approved or when new items need your attention.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEnablePush}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Enabling...' : 'Enable'}
                </button>
                <button
                  onClick={dismissBanner}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Separate component for settings page use
export function PushNotificationSettings() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const pushSupported = isPushSupported()
      setSupported(pushSupported)
      
      if (!pushSupported) return

      await registerServiceWorker()
      setPermission(getNotificationPermission())
      setSubscribed(await isSubscribed())
    }

    init()
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
      } else {
        const newPermission = await requestNotificationPermission()
        setPermission(newPermission)
        if (newPermission === 'granted') {
          const subscription = await subscribeToPush()
          setSubscribed(!!subscription)
        }
      }
    } catch (error) {
      console.error('Error toggling push:', error)
    }
    setLoading(false)
  }

  if (!supported) {
    return (
      <div className="p-4 bg-[var(--color-surface-light)] rounded-xl">
        <p className="text-sm text-[var(--color-text-muted)]">
          Push notifications are not supported on this device/browser.
        </p>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-xl">
        <p className="text-sm text-[var(--color-error)]">
          Notifications are blocked. Please enable them in your browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-surface-light)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">Push Notifications</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {subscribed ? 'Receiving notifications on this device' : 'Get notified on this device'}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-all ${
          subscribed ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-light)]'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
            subscribed ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
