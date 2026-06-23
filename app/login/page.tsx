'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showMockOption, setShowMockOption] = useState(false)

  const handleLogin = async (mode?: 'mock') => {
    setIsLoading(true)
    setErrorMessage(null)
    if (!mode) {
      setShowMockOption(false)
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Salesforce authentication failed.')
      }

      router.push('/opportunities')
    } catch (error) {
      console.error(error)
      setErrorMessage((error as Error).message)
      if (!mode) {
        setShowMockOption(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-4 md:p-6 relative overflow-hidden">
      {/* Decorative blurred circles for rich premium look */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 transition-all duration-300 hover:shadow-blue-500/5">
        
        {/* Salesforce Cloud Icon SVG */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-2xl">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-600" fill="currentColor">
              <path d="M19.1 11.5c.3-1 .1-2.1-.5-2.9-.6-.8-1.5-1.3-2.5-1.3-.4 0-.8.1-1.2.2C14.1 6 12.2 5 10 5c-2.7 0-5 2-5.4 4.7-.7.1-1.4.5-1.9 1.1-.6.7-.8 1.6-.7 2.5.2 1.8 1.7 3.2 3.5 3.2h11.6c1.6 0 3-1.1 3.4-2.7.4-.9.3-1.9-.3-2.3z" />
            </svg>
          </div>
        </div>

        {/* Text Headers */}
        <h1 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight">
          Deal Studio
        </h1>
        <p className="mt-3 text-slate-500 text-sm text-center leading-relaxed max-w-xs mx-auto">
          Access live Salesforce opportunities and configure quoting workflows.
        </p>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-xs text-red-700 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Authentication Failed
            </p>
            <p className="font-mono text-[10px] break-all leading-normal bg-red-100/50 p-2 rounded-lg mt-1 border border-red-200/50">
              {errorMessage}
            </p>
            <p className="pt-1.5 text-slate-500 leading-normal">
              Salesforce org login failed. Please ensure credentials in `.env.local` are correct and "Allow OAuth Username-Password Flows" is enabled.
            </p>
          </div>
        )}

        {/* Login Button Container */}
        <div className="mt-8 space-y-4">
          <button 
            onClick={() => handleLogin()}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white py-4 px-6 text-sm font-semibold tracking-wide shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer"
          >
            {isLoading && !showMockOption ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" fill="currentColor">
                <path d="M19.1 11.5c.3-1 .1-2.1-.5-2.9-.6-.8-1.5-1.3-2.5-1.3-.4 0-.8.1-1.2.2C14.1 6 12.2 5 10 5c-2.7 0-5 2-5.4 4.7-.7.1-1.4.5-1.9 1.1-.6.7-.8 1.6-.7 2.5.2 1.8 1.7 3.2 3.5 3.2h11.6c1.6 0 3-1.1 3.4-2.7.4-.9.3-1.9-.3-2.3z" />
              </svg>
            )}
            {isLoading && !showMockOption ? 'Authenticating...' : 'Login with Salesforce'}
          </button>

          {showMockOption && (
            <button 
              onClick={() => handleLogin('mock')}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 py-3.5 px-6 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer"
            >
              {isLoading && showMockOption ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
              ) : (
                <span>⚡</span>
              )}
              {isLoading && showMockOption ? 'Loading Demo...' : 'Proceed in Demo Mode (Mock Data)'}
            </button>
          )}
        </div>

        {/* Footnotes */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            Authentication via Salesforce Connected App
          </span>
          <span className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold">
            Need help logging in?
          </span>
        </div>

      </div>
    </main>
  )
}


