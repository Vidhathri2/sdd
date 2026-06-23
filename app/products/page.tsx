'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { ProductDto } from '../../lib/types'

const families = ['GCP', 'Chrome', 'Maps', 'Google Workspace', 'PSO']

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const opportunityId = searchParams.get('opportunityId')
  
  const [products, setProducts] = useState<ProductDto[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductDto[]>([])
  const [family, setFamily] = useState('GCP')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch products from our Salesforce API endpoint
  useEffect(() => {
    setLoading(true)
    const queryParams = new URLSearchParams()
    if (family) queryParams.set('family', family)
    if (search) queryParams.set('search', search)

    fetch(`/api/salesforce/products?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setProducts(data.products ?? [])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [family, search])

  const canContinue = selectedProducts.length > 0

  const handleAddProduct = (product: ProductDto) => {
    if (!selectedProducts.some((item) => item.id === product.id)) {
      setSelectedProducts((current) => [...current, product])
    }
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((current) => current.filter((item) => item.id !== productId))
  }

  const handleContinue = () => {
    const data = {
      opportunityId,
      selectedProducts
    }
    sessionStorage.setItem('dealStudioQuoteDraft', JSON.stringify(data))
    router.push(`/quote?opportunityId=${encodeURIComponent(opportunityId ?? '')}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header />

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Sub-header with Back Button and Title */}
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.push('/opportunities')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer font-bold"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Select Products</h1>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid gap-6 xl:grid-cols-[240px_1fr_320px]">
          
          {/* Left Column: Product Family Sidebar */}
          <aside className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Product Family
            </h2>
            <div className="space-y-1">
              {families.map((familyItem) => (
                <button
                  key={familyItem}
                  type="button"
                  onClick={() => setFamily(familyItem)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    family === familyItem 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {familyItem}
                </button>
              ))}
            </div>
          </aside>

          {/* Center Column: Search & Product List */}
          <section className="space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2" htmlFor="product-search">
                Search by keyword
              </label>
              <input
                id="product-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Products List */}
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <span className="mt-3 block text-sm text-slate-500 font-medium">Fetching products…</span>
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-red-600 font-medium shadow-sm">
                  Failed to load products: {error}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 font-medium shadow-sm">
                  No products found for this family.
                </div>
              ) : (
                products.map((product) => {
                  const isAdded = selectedProducts.some((item) => item.id === product.id)
                  return (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-150"
                    >
                      <div className="flex items-center gap-4">
                        {/* Colored Google Logo G shape for premium feel */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 font-bold text-lg">
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="#EA4335"
                              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.62 0 3.013.627 4.095 1.664l3.078-3.078C19.296 2.872 16.035 1.5 12.24 1.5 6.31 1.5 1.5 6.31 1.5 12.24s4.81 10.74 10.74 10.74c5.96 0 10.66-4.14 10.66-10.74 0-.693-.08-1.378-.21-1.955H12.24z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">{product.name}</h2>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 block">
                            {product.family}
                          </span>
                        </div>
                      </div>
                      
                      {isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 cursor-pointer"
                        >
                          ✓ Added
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="rounded-full border border-slate-200 hover:border-blue-600 bg-white hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition cursor-pointer"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Right Column: Added Products Panel / Drawer */}
          <aside className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)] sticky top-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Added products</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedProducts.length} product(s) selected</p>
              </div>
              {selectedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProducts([])}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer transition"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {selectedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <span className="text-3xl mb-2 text-slate-300">📦</span>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Select products from the catalog to start building your quote.
                  </p>
                </div>
              ) : (
                selectedProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-sm">
                        G
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{product.family}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer containing Continue button */}
            <div className="border-t border-slate-100 p-5 bg-slate-50/50">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white tracking-wide shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
              >
                Continue
              </button>
            </div>
          </aside>

        </div>

      </main>
    </div>
  )
}
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
