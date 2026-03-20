import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Badge from '../../components/Badge'
import * as cvService from '../../services/cvService'

interface CV { id: number; statut: string; source: string; date_depot: string; fichier_pdf?: string }

export default function AgentCVsPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const LIMIT = 20

  useEffect(() => {
    setLoading(true)
    cvService.getAgentCVs({ page, limit: LIMIT, search: search || undefined })
      .then(r => { setCvs(r.data.cvs ?? []); setTotal(r.data.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, search])

  const pages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">CVs ({total.toLocaleString()})</h2>
          <input placeholder="Rechercher un candidat..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['ID', 'Source', 'Statut', 'Date dépôt'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cvs.map(cv => (
                    <tr key={cv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">#{cv.id}</td>
                      <td className="px-4 py-3 text-slate-500 uppercase text-xs">{cv.source}</td>
                      <td className="px-4 py-3"><Badge decision={cv.statut} /></td>
                      <td className="px-4 py-3 text-slate-500">{new Date(cv.date_depot).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">Page {page} / {pages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:opacity-40 hover:bg-slate-50">&#8592; Préc.</button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:opacity-40 hover:bg-slate-50">Suiv. &#8594;</button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
