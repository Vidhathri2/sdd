'use client'

export default function QuoteDetailsTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Details</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Sales Channel</span>
          <select className="mt-1 w-full rounded-md border px-3 py-2">
            <option>Direct</option>
            <option>Partner</option>
            <option>Renewal</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Primary Contact</span>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Contact name" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Quote Start Date</span>
          <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Quote Expiration Date</span>
          <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
      </div>
    </div>
  )
}
