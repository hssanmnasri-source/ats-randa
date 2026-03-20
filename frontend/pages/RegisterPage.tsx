import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useNotifStore } from '../store/notificationStore'
import * as authService from '../services/authService'

export default function RegisterPage() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const { add } = useNotifStore()
  const navigate = useNavigate()

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authService.register(form.nom, form.prenom, form.email, form.password)
      login(res.data.access_token, { id: 0, email: form.email, role: 'CANDIDATE', nom: form.nom, prenom: form.prenom })
      add('success', 'Compte créé avec succès !')
      navigate('/candidate/cv')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      add('error', typeof msg === 'string' ? msg : "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">ATS RANDA</h1>
          <p className="text-slate-500 mt-2">Créer votre espace candidat</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['nom', 'Nom'], ['prenom', 'Prénom']].map(([k, l]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
              <input type="text" value={form[k as keyof typeof form]} onChange={setField(k)} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={setField('email')} required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input type="password" value={form.password} onChange={setField('password')} required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
