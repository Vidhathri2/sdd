'use client'

import { OpportunityDto } from '../lib/types'

type Props = {
  opportunities: OpportunityDto[]
  onCreateQuote: (opportunityId: string) => void
  openMenuId: string | null
  onToggleMenu: (id: string | null) => void
}

function formatAmount(amount: number | null): string {
  if (amount === null) return ''
  if (Number.isInteger(amount)) {
    return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }
  return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export default function OpportunityTable({ opportunities, onCreateQuote, openMenuId, onToggleMenu }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-left">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            </th>
            <th className="px-6 py-4 text-left font-semibold text-slate-700">
              <div className="flex items-center gap-1 cursor-pointer select-none">
                Opportunity Name
                <span className="text-slate-400 text-xs">↑</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left font-semibold text-slate-700">Account Name</th>
            <th className="px-6 py-4 text-left font-semibold text-slate-700">Owner</th>
            <th className="px-6 py-4 text-left font-semibold text-slate-700">Amount</th>
            <th className="px-6 py-4 text-left font-semibold text-slate-700">Close Date</th>
            <th className="px-6 py-4 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {opportunities.map((opportunity, index) => (
            <tr key={opportunity.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </td>
              <td className="px-6 py-4 font-medium text-slate-900">{opportunity.name}</td>
              <td className="px-6 py-4 text-slate-600">{opportunity.accountName}</td>
              <td className="px-6 py-4 text-slate-600">{opportunity.ownerName}</td>
              <td className="px-6 py-4 font-medium text-slate-900">
                {formatAmount(opportunity.amount)}
              </td>
              <td className="px-6 py-4 text-slate-600">{opportunity.closeDate}</td>
              <td className="relative px-6 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleMenu(openMenuId === opportunity.id ? null : opportunity.id)
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <span className="text-lg font-bold">⋮</span>
                </button>
                {openMenuId === opportunity.id && (
                  <div className="absolute right-6 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-100">
                    <button
                      onClick={() => {
                        onToggleMenu(null)
                        onCreateQuote(opportunity.id)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span className="text-slate-400 font-bold">+</span>
                      Create Quote
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}