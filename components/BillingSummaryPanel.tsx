'use client'

import { useMemo } from 'react'
import { ProductDto } from '../lib/types'

const exampleProducts: ProductDto[] = [
  { id: 'prod_001', name: 'CPQ Starter', family: 'CPQ', description: 'Core CPQ bundle for small teams.', unitPrice: 499 },
  { id: 'prod_002', name: 'Enterprise Add-on', family: 'CPQ', description: 'Scale automation with approvals and advanced pricing.', unitPrice: 799 }
]

export default function BillingSummaryPanel() {
  const subtotal = useMemo(() => exampleProducts.reduce((sum, item) => sum + item.unitPrice, 0), [])
  const tax = useMemo(() => subtotal * 0.08, [subtotal])
  const total = subtotal + tax

  return (
    <div>
      <h2 className="text-xl font-semibold">Billing Summary</h2>
      <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Products</span>
          <span>{exampleProducts.length}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 text-base font-semibold">
          <div className="flex justify-between">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
