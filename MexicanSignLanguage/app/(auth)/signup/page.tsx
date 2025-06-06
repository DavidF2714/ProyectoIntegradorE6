'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignUp() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if (!username || !password || !confirmPassword) {
    setError('Por favor llena todos los campos.')
    return
  }

  if (password !== confirmPassword) {
    setError('Las contraseña no son iguales.')
    return
  }

  try {
    const res = await fetch('http://localhost:8000/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.detail || 'Signup failed.')
      return
    }

    // Signup exitoso, puedes redirigir o mostrar mensaje
    setSuccess('Usuario registrado con éxito. Redirigiendo a inicio de sesión...')
    setTimeout(() => {
      window.location.href = '/signin'
    }, 1500)

    //window.location.href = '/signin' // o usa router.push('/signin') si usas useRouter
  } catch (err) {
    setError('Algo salió. Por favor vuelva a intentarlo.')
  }
}


  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-32 pb-12 md:pt-40 md:pb-20">
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <h1 className="h1">Crea tu cuenta</h1>
          </div>

          <div className="max-w-sm mx-auto">

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Éxito: </strong>
                <span className="block sm:inline">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex flex-wrap -mx-3 mb-4">
                <div className="w-full px-3">
                  <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="username">
                    Usuario <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    className="form-input w-full text-gray-300"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap -mx-3 mb-4">
                <div className="w-full px-3">
                  <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="password">
                    Contraseña <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-input w-full text-gray-300"
                    placeholder="Crea tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap -mx-3 mb-4">
                <div className="w-full px-3">
                  <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="confirm-password">
                    Repite tu contraseña <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-input w-full text-gray-300"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-600 mb-4">{error}</p>}

              <div className="flex flex-wrap -mx-3 mt-6">
                <div className="w-full px-3">
                  <button
                    type="submit"
                    className="btn text-white bg-purple-600 hover:bg-purple-700 w-full"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </form>

            <div className="text-gray-400 text-center mt-6">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/signin" className="text-purple-600 hover:text-gray-200 transition duration-150 ease-in-out">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
