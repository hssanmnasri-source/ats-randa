import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Badge from '../../components/Badge'
import { useNotifStore } from '../../store/notificationStore'
import * as offerService from '../../services/offerService'

interface Offer { id: number; titre: string; description?: string; statut: string; date_publication: string }

export default function CandidateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)
  const { add } = useNotifStore()

  useEffect(() => {
    offerService.getPublicOffers().then(r => setOffers(r.data.offers ?? [])).finally(() => setLoading(false))
  }, [])

  const apply = async (id: number) => {
    setApplying(id)
    try {
      const r = await offerService.applyToOffer(id)
      add('success', `Candidature envoyée pour : ${r.data.titre_offre}`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      if (typeof detail === 'object' && detail !== null && 'error' in detail) {
        add('error', (detail as { message: string }).message)
      } else if (typeof detail === 'string') {
        add('error', detail)
      } else {
        add('error', 'Erreur lors de la candidature')
      }
    } finally { setApplying(null) }
  }

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Offres disponibles</h2>
        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <div className="grid gap-4">
            {offers.map(o => (
              <div key={o.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 text-lg">{o.titre}</h3>
                      <Badge decision={o.statut} />
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3">{o.description}</p>
                    <p className="text-xs text-slate-400 mt-3">
                      Publiée le {new Date(o.date_publication).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button onClick={() => apply(o.id)} disabled={applying === o.id}
                    className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                    {applying === o.id ? '...' : 'Postuler →'}
                  </button>
                </div>
              </div>
            ))}
            {offers.length === 0 && <p className="text-slate-500">Aucune offre disponible.</p>}
          </div>
        )}
      </div>
    </Layout>
  )
}
