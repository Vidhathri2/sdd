'use client'

import { ProductDto } from '../lib/types'

type Props = {
  products: ProductDto[]
  onRemove?: (productId: string) => void
}

export default function AddedProductsPanel({ products, onRemove }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Added products</p>
          <p className="mt-1 text-sm text-slate-500">{products.length} selected</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-slate-500">Add products to see them here and continue to quote configuration.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">G</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.family}</p>
                </div>
              </div>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(product.id)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
