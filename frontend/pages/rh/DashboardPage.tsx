import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { getDashboard } from '../../services/adminService'

export default function RhDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Dashboard RH</h2>
        {loading ? (
          <div className="text-slate-500">Chargement...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="CVs indexés" value={(stats.total_cvs as number) ?? 0} icon="📄" color="blue" />
            <StatCard label="Candidats" value={(stats.total_candidates as number) ?? 0} icon="👥" color="purple" />
            <StatCard label="Offres actives" value={(stats.total_offers as number) ?? 0} icon="💼" color="green" />
            <StatCard label="Nouveaux (7j)" value={(stats.new_cvs_last_7_days as number) ?? 0} icon="📈" color="orange" />
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
