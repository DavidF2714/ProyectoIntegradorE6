'use client'

import Link from 'next/link'
import MobileMenu from './mobile-menu'
import Image from 'next/image'
import Logo from "../../assets/logo.png"
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { token, logout, loading } = useAuth()

  // Mientras se carga el token desde localStorage, no renderiza el header
  if (loading) return null

  return (
    <header className="absolute w-full z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="shrink-0 mr-4">
            <Link href="/" className="block" aria-label="Cruip">
              <Image 
                src={Logo} 
                alt="Monkeypox Symptoms" 
                style={{ borderRadius: 8 }} 
                width={60}
                height={60}
              />
            </Link>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex md:grow">
            <ul className="flex grow justify-end flex-wrap items-center">
              <li>
                <Link href="/#About" className="font-medium hover:text-gray-500 px-4 py-3 flex items-center transition duration-150 ease-in-out">Acerca de</Link>
              </li>
              <li>
                <Link href="/#Overview" className="font-medium hover:text-gray-500 px-4 py-3 flex items-center transition duration-150 ease-in-out">Lenguaje de Señas Mexicano</Link>
              </li>
              <li>
                <Link href="/#predictionTool" className="font-medium hover:text-gray-500 px-4 py-3 flex items-center transition duration-150 ease-in-out">Herramienta de predicción</Link>
              </li>
              {!loading && token && (
              <li>
                <Link
                  href="/spellTool"
                  className="font-medium hover:text-gray-500 px-4 py-3 flex items-center transition duration-150 ease-in-out"
                >
                  Aprende Jugando
                </Link>
              </li>
              )}

              {/* 👇 Mostrar botón según autenticación */}
              {token ? (
                <li>
                  <button
                    onClick={logout}
                    className="btn-sm text-white bg-red-600 hover:bg-red-700 ml-4"
                  >
                    Cerrar sesión
                  </button>
                </li>
              ) : (
                <li>
                  <Link
                    href="/signin"
                    className="btn-sm text-white bg-purple-600 hover:bg-purple-700 ml-4"
                  >
                    Iniciar sesión
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
