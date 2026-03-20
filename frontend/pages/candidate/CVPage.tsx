import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useNotifStore } from '../../store/notificationStore'
import * as cvService from '../../services/cvService'

const NIVEAUX = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat']

export default function CandidateCVPage() {
  const [cv, setCv] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upload' | 'form'>('form')
  const [form, setForm] = useState({
    titre_poste: '', resume: '', experience_annees: 0, niveau_etude: 'BAC+3',
    competences: '', telephone: '', adresse: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { add } = useNotifStore()

  useEffect(() => {
    cvService.getMyCVs().then(r => {
      const cvs = r.data.cvs ?? []
      if (cvs.length > 0) setCv(cvs[0])
    }).finally(() => setLoading(false))
  }, [])

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const competences = form.competences.split(',').map(s => s.trim()).filter(Boolean)
    if (competences.length === 0) { add('error', 'Ajoutez au moins une compétence'); return }
    if (form.resume.length < 50) { add('error', 'Le résumé doit faire au moins 50 caractères'); return }
    setSubmitting(true)
    try {
      const r = await cvService.createCVForm({ ...form, experience_annees: Number(form.experience_annees), competences })
      setCv(r.data)
      add('success', 'CV créé avec succès !')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      add('error', typeof msg === 'string' ? msg : 'Erreur lors de la création')
    } finally { setSubmitting(false) }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { add('error', 'Sélectionnez un fichier'); return }
    setSubmitting(true)
    try {
      const r = await cvService.uploadCV(file)
      setCv(r.data)
      add('success', 'CV uploadé avec succès !')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      add('error', typeof msg === 'string' ? msg : 'Erreur upload')
    } finally { setSubmitting(false) }
  }

  if (loading) return <Layout><div className="p-8 text-slate-500">Chargement...</div></Layout>

  const cvData = cv as Record<string, unknown> | null

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Mon CV</h2>

        {cvData ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Statut</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{String(cvData.statut)}</span>
            </div>
            {cvData.cv_entities && (
              <div className="space-y-3 text-sm text-slate-700">
                {(cvData.cv_entities as Record<string, unknown>).titre_poste && (
                  <p><span className="font-medium">Poste :</span> {String((cvData.cv_entities as Record<string, unknown>).titre_poste)}</p>
                )}
                {(cvData.cv_entities as Record<string, unknown>).experience_annees !== undefined && (
                  <p><span className="font-medium">Expérience :</span> {String((cvData.cv_entities as Record<string, unknown>).experience_annees)} ans</p>
                )}
                {(cvData.cv_entities as Record<string, unknown>).niveau_etude && (
                  <p><span className="font-medium">Niveau :</span> {String((cvData.cv_entities as Record<string, unknown>).niveau_etude)}</p>
                )}
                {Array.isArray((cvData.cv_entities as Record<string, unknown>).competences) && (
                  <div>
                    <span className="font-medium">Compétences :</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((cvData.cv_entities as Record<string, unknown>).competences as string[]).map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setCv(null)}
              className="mt-6 text-sm text-blue-600 hover:underline">
              Mettre à jour mon CV
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex gap-4 mb-6 border-b border-slate-200 pb-4">
              {(['form', 'upload'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`text-sm font-medium pb-1 border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  {t === 'form' ? '📝 Formulaire en ligne' : '📎 Upload fichier'}
                </button>
              ))}
            </div>

            {tab === 'form' ? (
              <form onSubmit={handleForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Poste souhaité *</label>
                  <input value={form.titre_poste} onChange={e => setForm(f => ({ ...f, titre_poste: e.target.value }))} required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Développeur Python" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Résumé * (min. 50 caractères)</label>
                  <textarea value={form.resume} onChange={e => setForm(f => ({ ...f, resume: e.target.value }))} required rows={4}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Décrivez vos points forts, votre parcours..." />
                  <p className="text-xs text-slate-400 mt-1">{form.resume.length}/50 caractères minimum</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expérience (années)</label>
                    <input type="number" min={0} max={50} value={form.experience_annees}
                      onChange={e => setForm(f => ({ ...f, experience_annees: Number(e.target.value) }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Niveau d'étude *</label>
                    <select value={form.niveau_etude} onChange={e => setForm(f => ({ ...f, niveau_etude: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Compétences * (séparées par virgule)</label>
                  <input value={form.competences} onChange={e => setForm(f => ({ ...f, competences: e.target.value }))} required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Python, React, SQL, Docker..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                    <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                    <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Enregistrement...' : 'Créer mon CV'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}>
                  <p className="text-3xl mb-2">📎</p>
                  <p className="text-sm font-medium text-slate-700">{file ? file.name : 'Cliquez pour sélectionner un fichier'}</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX, JPG, PNG — max 5 MB</p>
                  <input id="file-input" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <button type="submit" disabled={submitting || !file}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Upload...' : 'Uploader mon CV'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
