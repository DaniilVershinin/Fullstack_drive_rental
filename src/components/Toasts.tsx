import { useApp } from '../hooks/useApp'

export default function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-enter toast-card toast-${t.type}`}
        >
          <span className="toast-icon">{t.type === 'error' ? '✕' : t.type === 'warning' ? '!' : '✓'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
