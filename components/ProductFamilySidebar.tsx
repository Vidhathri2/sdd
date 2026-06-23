'use client'

type Props = {
  families: string[]
  selectedFamily: string
  onSelectFamily: (family: string) => void
}

export default function ProductFamilySidebar({ families, selectedFamily, onSelectFamily }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">PRODUCT FAMILY</h2>
      <div className="mt-4 space-y-3">
        {families.map((family) => (
          <button
            key={family}
            type="button"
            onClick={() => onSelectFamily(family)}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${selectedFamily === family ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {family}
          </button>
        ))}
      </div>
    </div>
  )
}
