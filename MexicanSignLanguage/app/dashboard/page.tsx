// app/dashboard/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import MainHeader from '@/components/MainHeader'
import About from '@/components/About'
import PredictionTool from '@/components/ImagePredictor'
import Overview from '@/components/Overview'

export default function Dashboard() {
  const { token, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.push('/signin') // Redirige si no hay token
    }
  }, [token, router])

  if (!token) return null // Previene que se renderice si no hay token aún

  return (
    <>
      <MainHeader />
      <About />
      <Overview />
      <PredictionTool />
    </>
  )
}
