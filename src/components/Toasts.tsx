import { useApp } from '../hooks/useApp'

export default function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-enter px-4 py-2.5 rounded-xl text-sm text-white flex items-center gap-2 shadow-lg max-w-xs ${
            t.type === 'error' ? 'bg-red-800' : t.type === 'warning' ? 'bg-yellow-700' : 'bg-[#1a1a2e]'
          }`}
        >
          <span>{t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : '✓'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
