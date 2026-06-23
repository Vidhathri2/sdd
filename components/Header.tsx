'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SalesforceSession } from '../lib/types'

export default function Header() {
  const router = useRouter()
  const [session, setSession] = useState<SalesforceSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session)
        } else {
          // If no session, redirect to login page
          router.push('/login')
        }
      })
      .catch((err) => console.error('Failed to fetch session', err))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('Failed to log out', err)
    }
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left side: Hamburger + Brand + Status Badge */}
      <div className="flex items-center gap-4">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50 text-slate-700 transition">
          <span className="text-xl">≡</span>
        </button>
        <span 
          className="text-lg font-semibold text-slate-900 tracking-tight cursor-pointer"
          onClick={() => router.push('/opportunities')}
        >
          Deal Studio
        </span>

        {/* Dynamic Connection Status Badge */}
        {!loading && session && (
          <div className="hidden sm:flex items-center ml-2">
            {session.isMock ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Demo Mode (Mock Data)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Salesforce Connected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Search bar */}
      <div className="relative w-full max-w-md hidden md:block">
        <input
          type="text"
          placeholder="Search"
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
          🔍
        </span>
      </div>

      {/* Right side: Action icons and logout */}
      <div className="flex items-center gap-3">
        {!loading && session && (
          <button 
            onClick={handleLogout}
            className="text-xs text-slate-600 hover:text-red-600 font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            Logout
          </button>
        )}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition">
          <span>🔔</span>
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm cursor-pointer shadow-inner">
          {session?.username ? session.username.substring(0, 2).toUpperCase() : 'VM'}
        </div>
      </div>
    </header>
  )
}

