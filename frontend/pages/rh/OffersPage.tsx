import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Badge from '../../components/Badge'
import { useNotifStore } from '../../store/notificationStore'
import * as offerService from '../../services/offerService'

interface Offer { id: number; titre: string; description?: string; statut: string; date_publication: string }

export default function RhOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', experience_requise: 0, langue_requise: 'fr' })
  const { add } = useNotifStore()
  const navigate = useNavigate()

  const load = () => offerService.getRhOffers().then(r => setOffers(r.data.offers ?? r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await offerService.createOffer(form)
      add('success', 'Offre créée')
      setShowForm(false)
      setForm({ titre: '', description: '', experience_requise: 0, langue_requise: 'fr' })
      load()
    } catch { add('error', 'Erreur lors de la création') }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Offres d'emploi</h2>
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Nouvelle offre
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Nouvelle offre</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input placeholder="Titre du poste" required value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Description du poste" rows={4} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <div className="flex gap-4">
                <input type="number" placeholder="Années exp." min={0} max={20}
                  value={form.experience_requise}
                  onChange={e => setForm(f => ({ ...f, experience_requise: Number(e.target.value) }))}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={form.langue_requise}
                  onChange={e => setForm(f => ({ ...f, langue_requise: e.target.value }))}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="fr">Français</option>
                  <option value="ar">Arabe</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Créer
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <div className="grid gap-4">
            {offers.map(o => (
              <div key={o.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{o.titre}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{o.description}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(o.date_publication).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge decision={o.statut} />
                    <button onClick={() => navigate(`/rh/offers/${o.id}/matching`)}
                      className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      Matching &#8594;
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {offers.length === 0 && <p className="text-slate-500 text-sm">Aucune offre créée.</p>}
          </div>
        )}
      </div>
    </Layout>
  )
}
