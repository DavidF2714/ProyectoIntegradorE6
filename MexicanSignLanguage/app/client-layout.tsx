'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/ui/header'

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <Header />
      <main>{children}</main>
    </AuthProvider>
  )
}
