import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSupabaseRealtime(table, filterColumn, filterValue) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    if (filterValue === undefined || filterValue === null || filterValue === '') {
      Promise.resolve().then(() => {
        if (isMounted) {
          setData([])
          setLoading(false)
        }
      })

      return () => {
        isMounted = false
      }
    }

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true)
        setError('')
      }
    })

    // Initial fetch
    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `${filterColumn}=eq.${filterValue}`
        },
        (payload) => {
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
        }
      )
      .subscribe()

    async function fetchData() {
      const { data: fetchedData, error } = await supabase
        .from(table)
        .select('*')
        .eq(filterColumn, filterValue)
        .order('created_at', { ascending: false })
      
      if (!error && fetchedData) {
        setData(fetchedData)
      } else if (error) {
        console.error(`Error fetching ${table}:`, error)
        setError(error.message)
      }
      setLoading(false)
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [table, filterColumn, filterValue])

  return { data, setData, loading, error }
}
