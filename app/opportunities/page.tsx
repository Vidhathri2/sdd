'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OpportunityTable from '../../components/OpportunityTable'
import Header from '../../components/Header'
import { OpportunityDto } from '../../lib/types'

export default function OpportunitiesPage() {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<OpportunityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/salesforce/opportunities')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setOpportunities(data.opportunities ?? [])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleCreateQuote = (opportunityId: string) => {
    router.push(`/products?opportunityId=${encodeURIComponent(opportunityId)}`)
  }

  // Close menu on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Opportunities</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-slate-500 font-medium">Loading opportunities…</span>
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-red-600 font-medium">Failed to load opportunities: {error}</p>
          ) : opportunities.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500 font-medium">No opportunities found.</p>
          ) : (
            <OpportunityTable
              opportunities={opportunities}
              onCreateQuote={handleCreateQuote}
              openMenuId={openMenuId}
              onToggleMenu={setOpenMenuId}
            />
          )}

          <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer">
                <option>10</option>
                <option>20</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span>1-{opportunities.length} of {opportunities.length}</span>
              <div className="flex items-center gap-1">
                <button disabled className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-50 cursor-pointer">
                  ⏮
                </button>
                <button disabled className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-50 cursor-pointer">
                  ◀
                </button>
                <button disabled className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-50 cursor-pointer">
                  ▶
                </button>
                <button disabled className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-50 cursor-pointer">
                  ⏭
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}