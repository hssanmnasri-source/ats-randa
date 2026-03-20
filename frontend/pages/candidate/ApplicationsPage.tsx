import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Badge from '../../components/Badge'
import { useNotifStore } from '../../store/notificationStore'
import * as cvService from '../../services/cvService'

interface Application { id: number; id_offre: number; score_final: number; decision: string; date_candidature: string; offre?: { titre: string; statut: string } }

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const { add } = useNotifStore()

  const load = () => cvService.getMyApplications().then(r => setApps(r.data.candidatures ?? [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const remove = async (id: number) => {
    try {
      await cvService.deleteApplication(id)
      setApps(prev => prev.filter(a => a.id !== id))
      add('success', 'Candidature retirée')
    } catch { add('error', 'Impossible de retirer cette candidature') }
  }

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Mes candidatures</h2>
        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <div className="grid gap-4">
            {apps.map(a => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{a.offre?.titre ?? `Offre #${a.id_offre}`}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {a.date_candidature ? new Date(a.date_candidature).toLocaleDateString('fr-FR') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge decision={a.decision} />
                    {a.decision === 'PENDING' && (
                      <button onClick={() => remove(a.id)}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {apps.length === 0 && <p className="text-slate-500 text-sm">Aucune candidature pour le moment.</p>}
          </div>
        )}
      </div>
    </Layout>
  )
}
