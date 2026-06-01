import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const REQUEST_TIMEOUT_MS = 8000

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
    })
  ])
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId, isActive = () => true) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        'Profile request timed out. Check Supabase RLS policies and network access.'
      )

      if (!isActive()) return

      if (error) {
        throw error
      }

      setProfile(data)
      setProfileError('')
    } catch (error) {
      if (!isActive()) return

      console.error('Error fetching profile:', error)
      setProfile(null)
      setProfileError(error?.message || 'Profile row was not found.')
    } finally {
      if (isActive()) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let mounted = true
    const isActive = () => mounted

    async function handleSession(session) {
      if (!isActive()) return

      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id, isActive)
      } else {
        setProfile(null)
        setProfileError('')
        setAuthError('')
        setLoading(false)
      }
    }

    async function initializeAuth() {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          'Session request timed out. Try refreshing the page or clearing this site session.'
        )

        if (!isActive()) return

        if (error) {
          throw error
        }

        setAuthError('')
        await handleSession(data.session)
      } catch (error) {
        if (!isActive()) return

        console.error('Error getting auth session:', error)
        setUser(null)
        setProfile(null)
        setProfileError('')
        setAuthError(error?.message || 'Unable to load auth session.')
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        handleSession(session)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user?.id) {
      setLoading(true)
      await fetchProfile(user.id)
    }
  }

  const updateProfile = async ({ fullName }) => {
    if (!user?.id) {
      return { error: new Error('You must be signed in to update your profile.') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      return { error }
    }

    setProfile(data)
    setProfileError('')
    return { data, error: null }
  }

  return { user, profile, profileError, authError, loading, signOut, refreshProfile, updateProfile }
}
