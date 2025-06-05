///app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import MainHeader from '@/components/MainHeader'
import About from '@/components/About'
import PredictionTool from '@/components/ImagePredictor'
import Overview from '@/components/Overview'

export default function Dashboard() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Espera a que token se actualice en contexto (esto es importante para que no redirija muy rápido)
    if (token === undefined) {
      // Todavía cargando token (podría ser null o string)
      return
    }
    
    if (!token) {
      router.push('/signin') // Redirige si no hay token
    } else {
      setLoading(false)
    }
  }, [token, router])

  if (loading) return null // No renderiza nada mientras espera el token

  // Solo se renderiza si hay token
  return (
    <>
      <MainHeader />
      <About />
      <Overview />
      <PredictionTool />
    </>
  )
}
