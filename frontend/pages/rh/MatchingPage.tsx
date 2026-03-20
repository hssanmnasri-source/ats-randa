import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import Badge from '../../components/Badge'
import { useNotifStore } from '../../store/notificationStore'
import * as matchingService from '../../services/matchingService'

interface Result { id: number; id_cv: number; rang: number; score_final: number; score_matching: number; decision: string; date_analyse: string }

export default function MatchingPage() {
  const { offerId } = useParams<{ offerId: string }>()
  const [titre, setTitre] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const { add } = useNotifStore()

  const load = () => {
    matchingService.getMatchingResults(Number(offerId))
      .then(r => { setResults(r.data.resultats ?? []); setTotal(r.data.total); setTitre(r.data.titre) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [offerId])

  const runMatching = async () => {
    setRunning(true)
    try {
      const r = await matchingService.runMatching(Number(offerId))
      setResults(r.data.resultats ?? [])
      setTotal(r.data.total)
      setTitre(r.data.titre)
      add('success', `Matching terminé — ${r.data.total} CVs analysés`)
    } catch { add('error', 'Erreur lors du matching') }
    finally { setRunning(false) }
  }

  const decide = async (resultId: number, decision: string) => {
    try {
      await matchingService.updateDecision(Number(offerId), resultId, decision)
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, decision } : r))
      add('success', `Décision : ${decision}`)
    } catch { add('error', 'Erreur') }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Matching</h2>
            {titre && <p className="text-slate-500 mt-1">{titre} — {total} résultat{total > 1 ? 's' : ''}</p>}
          </div>
          <button onClick={runMatching} disabled={running}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {running ? 'Analyse en cours...' : '&#9654; Lancer le matching'}
          </button>
        </div>

        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Rang', 'CV ID', 'Score final', 'Sémantique', 'Décision', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">#{r.rang}</td>
                    <td className="px-4 py-3 text-slate-600">{r.id_cv}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${r.score_final * 100}%` }} />
                        </div>
                        <span className="text-slate-700 font-medium">{(r.score_final * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{(r.score_matching * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3"><Badge decision={r.decision} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => decide(r.id, 'RETAINED')}
                          className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs hover:bg-green-100">&#10003; Retenir</button>
                        <button onClick={() => decide(r.id, 'REFUSED')}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs hover:bg-red-100">&#10007; Refuser</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun résultat — lancez le matching</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
