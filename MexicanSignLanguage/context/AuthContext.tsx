'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'

interface AuthContextType {
  token: string | null
  login: (token: string) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    console.log('Token leído en useEffect:', savedToken)
    if (savedToken) {
      setToken(savedToken)
    }
    setLoading(false)
  }, [])

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
