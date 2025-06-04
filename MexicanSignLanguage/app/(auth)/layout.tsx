'use client'

import PageIllustration from '@/components/page-illustration'
import { AuthProvider } from '@/context/AuthContext'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <main className="grow">
        <PageIllustration />
        {children}
      </main>
    </AuthProvider>
  )
}
