interface Props { decision: string }
const COLORS: Record<string, string> = {
  RETAINED: 'bg-green-100 text-green-700',
  REFUSED:  'bg-red-100 text-red-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  ACTIVE:   'bg-green-100 text-green-700',
  CLOSED:   'bg-slate-100 text-slate-600',
  INDEXED:  'bg-blue-100 text-blue-700',
  UPLOADED: 'bg-orange-100 text-orange-700',
}
export default function Badge({ decision }: Props) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${COLORS[decision] ?? 'bg-slate-100 text-slate-600'}`}>
      {decision}
    </span>
  )
}
