import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import * as cvService from '../../services/cvService'

interface Candidate { id: number; nom?: string; prenom?: string; email?: string; created_at: string }

export default function AgentCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const LIMIT = 20

  useEffect(() => {
    setLoading(true)
    cvService.getAgentCandidates({ page, limit: LIMIT, search: search || undefined })
      .then(r => { setCandidates(r.data.candidates ?? []); setTotal(r.data.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, search])

  const pages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Candidats ({total.toLocaleString()})</h2>
          <input placeholder="Rechercher..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <>
            {candidates.length === 0 && !search ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-4xl mb-4">👥</p>
                <p className="text-slate-700 font-medium">Aucun candidat enregistré</p>
                <p className="text-slate-400 text-sm mt-2">
                  Les candidats apparaissent ici une fois que vous avez uploadé leurs CVs
                  via <strong>CVs → Upload</strong>.
                </p>
                <p className="text-slate-400 text-xs mt-3">
                  Note : les CVs importés en masse (Keejob bulk) ne sont pas attribués à un agent spécifique.
                </p>
              </div>
            ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['ID', 'Nom', 'Prénom', 'Email', 'Inscrit le'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">#{c.id}</td>
                      <td className="px-4 py-3 text-slate-700">{c.nom ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{c.prenom ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                  {candidates.length === 0 && search && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun résultat pour "{search}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
            {total > LIMIT && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">Page {page} / {pages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:opacity-40 hover:bg-slate-50">&#8592; Préc.</button>
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:opacity-40 hover:bg-slate-50">Suiv. &#8594;</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
