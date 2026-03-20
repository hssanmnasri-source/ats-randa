interface Props { label: string; value: number | string; icon: string; color?: string }
export default function StatCard({ label, value, icon, color = 'blue' }: Props) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-2xl ${colors[color] ?? colors.blue}`}>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}
