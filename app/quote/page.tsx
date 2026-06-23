'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { ProductDto } from '../../lib/types'

type CommitPeriod = {
  id: string
  months: string
  amount: string
}

function QuotePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const opportunityId = searchParams.get('opportunityId')
  
  const [quoteDraft, setQuoteDraft] = useState<{ opportunityId: string; selectedProducts: ProductDto[] } | null>(null)
  const [opportunityName, setOpportunityName] = useState('Google Cloud Platform RCA')
  const [accountName, setAccountName] = useState('BluePeak Financial Services plc')
  const [accountWebsite, setAccountWebsite] = useState('bluepeakfinancialservicesplc.example.com')
  const [primaryContact, setPrimaryContact] = useState('Casey Reed')
  const [salesChannel, setSalesChannel] = useState('Direct')
  const [startDate, setStartDate] = useState('2026-03-24')
  const [expirationDate, setExpirationDate] = useState('2026-05-08')
  const [commitPeriods, setCommitPeriods] = useState<CommitPeriod[]>([
    { id: '1', months: '', amount: '' }
  ])
  const [totalCommitPeriodCount, setTotalCommitPeriodCount] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [successResult, setSuccessResult] = useState<any | null>(null)

  useEffect(() => {
    const draft = sessionStorage.getItem('dealStudioQuoteDraft')
    if (draft) {
      const parsed = JSON.parse(draft)
      setQuoteDraft(parsed)
      
      // Determine account & opportunity details based on opportunityId
      const oppId = parsed.opportunityId
      if (oppId === 'opp-001') {
        setAccountName('Sakura Robotics Co., Ltd.')
        setAccountWebsite('sakurarobotics.example.com')
        setOpportunityName('SR CO Opportunity')
      } else if (oppId === '006Dz00000Q842cIAB') {
        setAccountName('BluePeak Financial Services plc')
        setAccountWebsite('bluepeakfinancialservicesplc.example.com')
        setOpportunityName('Google Cloud Platform RCA')
      } else if (oppId === 'opp-003') {
        setAccountName('AtlasLogix Logistics LLC')
        setAccountWebsite('atlaslogix.example.com')
        setOpportunityName('ALL opportunity')
      } else if (oppId === 'opp-004') {
        setAccountName('AndeanCloud Analytics SpA')
        setAccountWebsite('andeancloud.example.com')
        setOpportunityName('ACA Opportunity')
      } else if (oppId === 'opp-005') {
        setAccountName('RioVerde Manufacturing S.A.')
        setAccountWebsite('rioverde.example.com')
        setOpportunityName('RVM Opportunity')
      } else if (parsed.selectedProducts && parsed.selectedProducts.length > 0) {
        setOpportunityName(parsed.selectedProducts[0].name)
      }
    }
  }, [opportunityId])

  const handleAddCommitPeriod = () => {
    const newId = (commitPeriods.length + 1).toString()
    setCommitPeriods([...commitPeriods, { id: newId, months: '', amount: '' }])
    setTotalCommitPeriodCount(totalCommitPeriodCount + 1)
  }

  const handleRemoveCommitPeriod = (id: string) => {
    if (commitPeriods.length > 1) {
      setCommitPeriods(commitPeriods.filter(p => p.id !== id))
      setTotalCommitPeriodCount(Math.max(1, totalCommitPeriodCount - 1))
    }
  }

  const handlePeriodChange = (id: string, field: 'months' | 'amount', value: string) => {
    setCommitPeriods(commitPeriods.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const handleSaveQuote = async () => {
    setSubmitting(true)
    try {
      const payload = {
        opportunityId: opportunityId || 'unknown',
        quoteName: opportunityName,
        primaryContactId: primaryContact,
        salesChannel,
        quoteStartDate: startDate,
        quoteExpirationDate: expirationDate,
        commitmentPeriods: commitPeriods.map(p => ({
          periodMonths: parseInt(p.months) || 0,
          amount: parseFloat(p.amount) || 0
        })),
        selectedProducts: quoteDraft?.selectedProducts.map(p => ({
          productId: p.id,
          quantity: 1,
          unitPrice: p.unitPrice
        })) || []
      }

      const response = await fetch('/api/salesforce/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      setSuccessResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!quoteDraft && !opportunityId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 p-8 max-w-3xl w-full mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
            <p className="text-red-500 font-semibold mb-4">Unable to load quote draft.</p>
            <button 
              onClick={() => router.push('/opportunities')}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Return to Opportunities
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header />

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Top Info Banner card */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Account Title */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-2xl font-bold">
                🏢
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{accountName}</h1>
                <p className="text-xs text-blue-600 hover:underline cursor-pointer mt-0.5">{accountWebsite}</p>
              </div>
            </div>

            {/* Preview Approval Button */}
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition cursor-pointer self-start lg:self-center shadow-sm">
              <span className="text-sm">👤</span>
              Preview Approval
            </button>
          </div>

          {/* Quote Identifier Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    Quote 1
                  </span>
                  <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition">+</button>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Q-00003598
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                    {opportunityName}
                  </h2>
                  <a href="#" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline mt-2">
                    View in Salesforce
                    <span className="text-sm">↗</span>
                  </a>
                </div>
              </div>

              {/* Tab Navigation & Status Fields */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:gap-8">
                <div className="grid grid-cols-3 gap-6 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Contract Start Date</span>
                    <span className="block text-slate-950 font-bold mt-1">Upon provisioning</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Term</span>
                    <span className="block text-slate-950 font-bold mt-1">0 months</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Amount</span>
                    <span className="block text-slate-950 font-bold mt-1">$0.00</span>
                  </div>
                </div>
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/50 self-start">
                  <button className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm">
                    Details
                  </button>
                  <button className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition">
                    Discounts and Incentives
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Details Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          
          {/* Left Column: Form Configuration */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            {/* Input Cards Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Primary Contact</span>
                <div className="mt-2 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
                  <span className="text-slate-400 text-xs">👤</span>
                  <select 
                    value={primaryContact}
                    onChange={(e) => setPrimaryContact(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                  >
                    <option>Casey Reed</option>
                    <option>Wendy Nash</option>
                    <option>James Ford</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sales Channel</span>
                <div className="mt-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
                  <select 
                    value={salesChannel}
                    onChange={(e) => setSalesChannel(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                  >
                    <option>Direct</option>
                    <option>Partner</option>
                    <option>Indirect</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quote Start Date</span>
                <div className="mt-2 flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer" 
                  />
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quote Expiration Date</span>
                <div className="mt-2 flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
                  <input 
                    type="date" 
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer" 
                  />
                </div>
              </div>

            </div>

            {/* Total Commitment Period Counter */}
            <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Total Commitment Period</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track remaining term for the quote.</p>
              </div>
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                <button 
                  onClick={() => setTotalCommitPeriodCount(Math.max(1, totalCommitPeriodCount - 1))}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold transition cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-bold text-slate-800 w-4 text-center">{totalCommitPeriodCount}</span>
                <button 
                  onClick={() => setTotalCommitPeriodCount(totalCommitPeriodCount + 1)}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold transition cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Commit Periods Containers */}
            <div className="space-y-4">
              {commitPeriods.map((period, idx) => (
                <div key={period.id} className="bg-slate-50/30 border border-slate-100 rounded-2xl p-5 relative">
                  {commitPeriods.length > 1 && (
                    <button 
                      onClick={() => handleRemoveCommitPeriod(period.id)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-red-500 text-xs font-semibold cursor-pointer transition"
                    >
                      Remove
                    </button>
                  )}
                  <h4 className="text-xs font-bold text-slate-700">Commit Period {idx + 1}</h4>
                  
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Period (Months)</span>
                      <input 
                        type="number"
                        placeholder="Enter" 
                        value={period.months}
                        onChange={(e) => handlePeriodChange(period.id, 'months', e.target.value)}
                        className="mt-2 w-full border-none p-0 text-sm font-semibold text-slate-800 placeholder-slate-300 focus:ring-0 outline-none" 
                      />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Amount</span>
                      <input 
                        type="number"
                        placeholder="Enter" 
                        value={period.amount}
                        onChange={(e) => handlePeriodChange(period.id, 'amount', e.target.value)}
                        className="mt-2 w-full border-none p-0 text-sm font-semibold text-slate-800 placeholder-slate-300 focus:ring-0 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Commit Period Link */}
            <button 
              type="button"
              onClick={handleAddCommitPeriod}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
            >
              <span className="text-sm">+</span> Add Commit Period
            </button>

          </section>

          {/* Right Column: Payment Details & Account Summary */}
          <aside className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-6">
            
            <div className="space-y-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Contract Start Date</span>
                <p className="text-sm font-bold text-slate-900 mt-1">Upon provisioning</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Term</span>
                <p className="text-sm font-bold text-slate-900 mt-1">0 months</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Amount</span>
                <p className="text-sm font-bold text-slate-900 mt-1">$0.00</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Payment Account
              </h3>
              
              <div className="space-y-3 text-xs">
                
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Primary</span>
                  <p className="font-bold text-slate-800 mt-1">XXXX XXXXXXX</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Billing Account</span>
                  <p className="font-bold text-slate-800 mt-1">XXXXXX-XXXXXX-XXXXXX</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Payment Account ID</span>
                  <p className="font-bold text-slate-800 mt-1">XXXXXX-XXXXXX-XXXXXX</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Billing Address</span>
                  <p className="font-semibold text-slate-700 leading-relaxed mt-1">
                    5920 Niagara River Parkway<br />
                    Niagara Falls ON L2E 6X8 CA
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Billing Currency</span>
                  <p className="font-bold text-slate-800 mt-1">CAD</p>
                </div>

              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button 
                onClick={() => router.push('/opportunities')}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 rounded-xl py-3 text-xs font-bold text-slate-600 transition cursor-pointer text-center"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleSaveQuote}
                disabled={submitting}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-3 text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 text-center"
              >
                {submitting ? 'Saving...' : 'Save Quote'}
              </button>
            </div>

            {/* Success Popover/Alert */}
            {successResult && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-xs text-green-800 space-y-2 animate-in fade-in duration-200">
                <p className="font-bold">✓ Quote Created successfully!</p>
                <p>Quote Number: <span className="font-bold">{successResult.quoteNumber}</span></p>
                <a 
                  href={successResult.salesforceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block font-bold text-green-700 underline"
                >
                  View in Salesforce Lightning
                </a>
              </div>
            )}

          </aside>

        </div>

      </main>
    </div>
  )
}

export default function QuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <QuotePageContent />
    </Suspense>
  )
}
