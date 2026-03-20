import { useNotifStore } from '../store/notificationStore'

export default function Notifications() {
  const { notifications, remove } = useNotifStore()
  if (!notifications.length) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(n => (
        <div key={n.id} onClick={() => remove(n.id)}
          className={`px-4 py-3 rounded-lg shadow-lg cursor-pointer text-white text-sm font-medium transition-all
            ${n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {n.message}
        </div>
      ))}
    </div>
  )
}
