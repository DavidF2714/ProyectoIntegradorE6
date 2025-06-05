'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NextStep from '../../components/NextStep'

export default function NextStepPage() {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Si terminó de cargar y no hay token, redirige
    if (!loading && !token) {
      router.push('/signin')
    }
  }, [loading, token, router])

  // Mientras carga el estado de autenticación, no mostrar nada
  if (loading) return null

  // Si hay token, renderiza el componente
  return <NextStep />
}
