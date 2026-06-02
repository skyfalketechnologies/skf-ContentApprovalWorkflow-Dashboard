import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// feature: reusable Supabase realtime hook
// feature: supports optional filtering or full table subscriptions
export function useSupabaseRealtime(table, filterColumn, filterValue) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const hasFilter = filterColumn && filterValue !== undefined && filterValue !== null && filterValue !== ''

    const channel = supabase.channel(`${table}_changes`)

    const subscriptionConfig = {
      event: '*',
      schema: 'public',
      table: table
    }

    if (hasFilter) {
      subscriptionConfig.filter = `${filterColumn}=eq.${filterValue}`
    }

    // Initial fetch for the table or filtered set
    fetchData()

    const subscription = channel
      .on('postgres_changes', subscriptionConfig, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => item.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => {
            const exists = prev.some(item => item.id === payload.new.id)
            if (!exists) return [payload.new, ...prev]
            return prev.map(item => item.id === payload.new.id ? payload.new : item)
          })
        }
      })
      .subscribe()

    async function fetchData() {
      if (isMounted) {
        setLoading(true)
        setError('')
      }

      const query = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })

      const { data: fetchedData, error } = hasFilter
        ? await query.eq(filterColumn, filterValue)
        : await query

      if (!error && fetchedData) {
        setData(fetchedData)
      } else if (error) {
        console.error(`Error fetching ${table}:`, error)
        setError(error.message)
      }
      if (isMounted) {
        setLoading(false)
      }
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [table, filterColumn, filterValue])

  return { data, setData, loading, error }
}
