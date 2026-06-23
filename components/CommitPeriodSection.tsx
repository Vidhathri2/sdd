'use client'

import { useState } from 'react'

type Period = {
  id: string
  periodMonths: number
  amount: number
}

export default function CommitPeriodSection() {
  const [periods, setPeriods] = useState<Period[]>([
    { id: 'p1', periodMonths: 12, amount: 0 }
  ])

  const addPeriod = () => {
    setPeriods((current) => [
      ...current,
      { id: `p${current.length + 1}`, periodMonths: 12, amount: 0 }
    ])
  }

  const updatePeriod = (id: string, field: keyof Omit<Period, 'id'>, value: number) => {
    setPeriods((current) =>
      current.map((period) =>
        period.id === id ? { ...period, [field]: value } : period
      )
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Total Commitment Period</h2>
        <button type="button" onClick={addPeriod} className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
          Add Commit Period
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {periods.map((period) => (
          <div key={period.id} className="grid gap-4 md:grid-cols-2 rounded-xl border p-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Period (months)</span>
              <input
                type="number"
                min={1}
                value={period.periodMonths}
                onChange={(event) => updatePeriod(period.id, 'periodMonths', Number(event.target.value))}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Amount</span>
              <input
                type="number"
                min={0}
                value={period.amount}
                onChange={(event) => updatePeriod(period.id, 'amount', Number(event.target.value))}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
