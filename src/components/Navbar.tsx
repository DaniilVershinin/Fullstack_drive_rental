import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'

const CLIENT_TABS = [
  { path: '/', label: 'Главная' },
  { path: '/catalog', label: 'Каталог' },
  { path: '/cabinet', label: 'Кабинет' },
]
const MANAGER_TABS = [{ path: '/manager', label: 'Менеджер' }]
const ADMIN_TABS = [{ path: '/admin', label: 'Аналитика' }]

export default function Navbar() {
  const { user, role } = useApp()
  const navigate = useNavigate()

  const tabs = role === 'manager' ? MANAGER_TABS : role === 'admin' ? ADMIN_TABS : CLIENT_TABS

  return (
    <nav className="bg-[#1a1a2e] h-12 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="font-syne font-extrabold text-base text-white flex items-center gap-1">
        ▲ DRIVE<span className="text-[#e94560]">GO</span>
      </div>

      <div className="flex gap-1">
        {tabs.map(t => (
          <NavLink
            key={t.path}
            to={t.path}
            end={t.path === '/'}
            className={({ isActive }) =>
              `px-3 py-1 rounded text-xs font-medium transition-all ${isActive ? 'bg-[#e94560] text-white' : 'text-white/55 hover:text-white hover:bg-white/10'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">{user.name.split(' ')[0]}</span>
            <button
              onClick={() => navigate(user.role === 'manager' ? '/manager' : user.role === 'admin' ? '/admin' : '/cabinet')}
              className="text-[10px] px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-all"
            >
              {user.role === 'client' ? 'Клиент' : user.role === 'manager' ? 'Менеджер' : 'Админ'}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
