'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainHeader from '@/components/MainHeader'
import About from '@/components/About'
import PredictionTool from '@/components/ImagePredictor'
import Overview from '@/components/Overview'

export default function ProtectedHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true) // estado para controlar renderizado

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/signin')
    } else {
      setLoading(false) // solo renderizar si hay token
    }
  }, [router])

  if (loading) return null // evita mostrar UI antes de validar

  return (
    <>
      <MainHeader />
      <About />
      <Overview />
      <PredictionTool />
    </>
  )
}
