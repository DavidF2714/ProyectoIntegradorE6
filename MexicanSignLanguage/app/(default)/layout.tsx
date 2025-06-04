'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import PageIllustration from '@/components/page-illustration'
import Footer from '@/components/ui/footer'
import { AuthProvider } from '@/context/AuthContext'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: 'phone',
      duration: 600,
      easing: 'ease-out-sine',
    })
  }, []) // 👈 importante: ejecutar solo una vez al montar

  return (
    <AuthProvider>
      <main className="grow">
        <PageIllustration />
        {children}
      </main>
      <Footer />
    </AuthProvider>
  )
}
