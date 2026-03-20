import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import * as adminService from '../../services/adminService'

interface Stats {
  users: { total: number; par_role: Record<string, number> }
  cvs: { total: number; par_statut: Record<string, number> }
  offres: { total: number; par_statut: Record<string, number> }
  candidatures: { total: number; acceptees: number; refusees: number; en_attente: number }
  candidats: { total: number }
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { adminService.getStats().then(r => setStats(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return <Layout><div className="p-8 text-slate-500">Chargement...</div></Layout>
  if (!stats) return <Layout><div className="p-8 text-red-500">Erreur de chargement</div></Layout>

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Statistiques système</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Utilisateurs" value={stats.users.total} icon="👤" color="blue" />
          <StatCard label="CVs total" value={stats.cvs.total} icon="📄" color="purple" />
          <StatCard label="Candidats" value={stats.candidats.total} icon="👥" color="green" />
          <StatCard label="Offres" value={stats.offres.total} icon="💼" color="orange" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-700 mb-4">Utilisateurs par rôle</h3>
            {Object.entries(stats.users.par_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{role}</span>
                <span className="text-sm font-medium text-slate-800">{count}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-700 mb-4">Candidatures</h3>
            {[
              { label: 'Total', value: stats.candidatures.total },
              { label: 'Acceptées', value: stats.candidatures.acceptees },
              { label: 'Refusées', value: stats.candidatures.refusees },
              { label: 'En attente', value: stats.candidatures.en_attente },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
