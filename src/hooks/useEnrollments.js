import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

/**
 * Approved enrollments for the signed-in user. Returns `null` ids while the
 * auth session or the enrollment request is still loading, so the UI never
 * sends an enrolled learner to WhatsApp by mistake.
 */
export function useEnrollments() {
  const { user, loading: authLoading } = useAuth()
  const [courseIds, setCourseIds] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return undefined

    if (!user) {
      setCourseIds(new Set())
      setLoading(false)
      setError(null)
      return undefined
    }

    let active = true
    setCourseIds(null)
    setLoading(true)
    setError(null)

    api
      .enrollments()
      .then((data) => {
        if (!active) return
        setCourseIds(new Set((data?.courseIds ?? []).map(Number)))
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError?.code || 'ENROLLMENTS_UNAVAILABLE')
        setCourseIds(new Set())
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, authLoading])

  return {
    courseIds,
    isEnrolled: (courseId) => Boolean(courseId && courseIds?.has(Number(courseId))),
    loading: authLoading || loading,
    error,
  }
}
