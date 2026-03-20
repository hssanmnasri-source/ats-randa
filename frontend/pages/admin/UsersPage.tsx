import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useNotifStore } from '../../store/notificationStore'
import * as adminService from '../../services/adminService'

interface User { id: number; nom?: string; prenom?: string; email: string; role: string; is_active: boolean }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { add } = useNotifStore()

  const load = () => adminService.getUsers().then(r => setUsers(r.data.users ?? r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggle = async (id: number) => {
    try { await adminService.toggleUser(id); load(); add('success', 'Statut mis à jour') }
    catch { add('error', 'Erreur') }
  }

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Utilisateurs</h2>
        {loading ? <div className="text-slate-500">Chargement...</div> : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['ID', 'Nom', 'Email', 'Rôle', 'Statut', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">#{u.id}</td>
                    <td className="px-4 py-3 text-slate-700">{u.nom ?? ''} {u.prenom ?? ''}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{u.role}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(u.id)}
                        className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2 py-1 rounded hover:bg-slate-50">
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
