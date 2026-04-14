import { useEffect, useState } from 'react'
import { USERS } from '../data'
import { useApp } from '../hooks/useApp'
import { getUsers } from '../lib/api'

const MONTHS = ['Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр']
const MONTH_VALS = [42, 58, 71, 65, 80, 93, 87]
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DAY_VALS = [65, 70, 82, 75, 90, 95, 80]

const POINTS = [
  { name: 'Москва — Центр', addr: 'Тверская, 15', hours: '07:00–22:00', status: 'open', cars: 8 },
  { name: 'Москва — Аэропорт', addr: 'Шереметьево T-D', hours: '24/7', status: 'open', cars: 5 },
  { name: 'СПб — Невский', addr: 'Невский пр-т, 40', hours: '08:00–21:00', status: 'maintenance', cars: 3 },
  { name: 'Казань — Баумана', addr: 'ул. Баумана, 12', hours: '09:00–20:00', status: 'open', cars: 4 },
]

const TARIFFS = [
  { cat: 'Эконом', min: '1 500 ₽', max: '2 500 ₽', penalty: '500 ₽', age: '23 года', exp: '2 года' },
  { cat: 'Комфорт', min: '2 500 ₽', max: '4 000 ₽', penalty: '800 ₽', age: '23 года', exp: '2 года' },
  { cat: 'Бизнес', min: '5 000 ₽', max: '9 000 ₽', penalty: '1 500 ₽', age: '25 лет', exp: '3 года' },
  { cat: 'Внедорожник', min: '3 500 ₽', max: '7 000 ₽', penalty: '1 200 ₽', age: '23 года', exp: '2 года' },
]

function BarChart({ vals, labels, max, accentLast = false, accentHigh = false }: { vals: number[], labels: string[], max: number, accentLast?: boolean, accentHigh?: boolean }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {vals.map((v, i) => (
        <div key={labels[i]} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[8px] text-gray-400">{v}</span>
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${(v / max) * 100}%`,
              background: (accentLast && i === vals.length - 1) || (accentHigh && v > max * 0.85) ? '#e94560' : '#0f3460',
            }}
          />
          <span className="text-[9px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { toast } = useApp()
  const [tab, setTab] = useState<'analytics' | 'users' | 'points' | 'tariffs'>('analytics')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [users, setUsers] = useState(USERS)

  useEffect(() => {
    getUsers().then(setUsers).catch(() => toast('Не удалось загрузить пользователей', 'error'))
  }, [toast])

  const filteredUsers = users.filter(u =>
    (!userRole || u.role === userRole) &&
    (!userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  )

  const tabs = [
    { key: 'analytics', label: 'Аналитика' },
    { key: 'users', label: 'Пользователи' },
    { key: 'points', label: 'Пункты выдачи' },
    { key: 'tariffs', label: 'Тарифы' },
  ] as const

  return (
    <div>
      <div className="bg-[#1a1a2e] px-4 py-3">
        <div className="font-syne font-bold text-lg text-white">Панель администратора</div>
        <div className="text-xs text-white/50 mt-0.5">Аналитика, пользователи, пункты выдачи, тарифы</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${tab === t.key ? 'border-[#e94560] text-[#e94560]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className="p-4">
          {/* KPI */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Пользователей', value: '1 248', delta: '↑ +42 за месяц', ok: true },
              { label: 'Выручка за месяц', value: '284 900 ₽', delta: '↑ +12%', ok: true },
              { label: 'Загруженность парка', value: '73%', delta: '↓ -5%', ok: false },
            ].map(m => (
              <div key={m.label} className="card p-3">
                <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                <div className="font-syne font-extrabold text-xl">{m.value}</div>
                <div className={`text-xs mt-1 ${m.ok ? 'text-green-600' : 'text-[#e94560]'}`}>{m.delta}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-3">
            <div className="card p-4">
              <div className="font-semibold text-xs mb-3">Заказы по месяцам</div>
              <BarChart vals={MONTH_VALS} labels={MONTHS} max={Math.max(...MONTH_VALS)} accentLast />
            </div>
            <div className="card p-4">
              <div className="font-semibold text-xs mb-3">Категории автомобилей</div>
              <div className="flex items-center gap-4 justify-center py-2">
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="18" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#1a1a2e" strokeWidth="18" strokeDasharray="88 132" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#e94560" strokeWidth="18" strokeDasharray="44 176" strokeDashoffset="-88" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#f5a623" strokeWidth="18" strokeDasharray="30 190" strokeDashoffset="-132" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#10b981" strokeWidth="18" strokeDasharray="38 182" strokeDashoffset="-162" transform="rotate(-90 50 50)" />
                </svg>
                <div className="text-xs space-y-1.5">
                  {[['#1a1a2e', 'Комфорт 40%'], ['#e94560', 'Эконом 20%'], ['#f5a623', 'Бизнес 14%'], ['#10b981', 'Внедорожник 17%']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold text-xs mb-3">Загруженность по дням недели</div>
            <BarChart vals={DAY_VALS} labels={DAYS} max={Math.max(...DAY_VALS)} accentHigh />
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <input className="input flex-1 text-xs" placeholder="Поиск по имени или email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <select className="input w-auto text-xs" value={userRole} onChange={e => setUserRole(e.target.value)}>
              <option value="">Все роли</option>
              <option>Клиент</option>
              <option>Менеджер</option>
            </select>
          </div>
          <div className="card overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div className="font-semibold text-sm">Пользователи</div>
              <button onClick={() => toast('Функция в разработке', 'warning')} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">+ Добавить</button>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl w-full">
                <thead>
                  <tr><th>ID</th><th>ФИО</th><th>Email</th><th>Роль</th><th>Заказов</th><th>Статус</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="text-gray-400">{u.id}</td>
                      <td className="font-medium">{u.name}</td>
                      <td className="text-gray-500">{u.email}</td>
                      <td><span className={`badge ${u.role === 'Менеджер' ? 'badge-yellow' : 'badge-gray'}`}>{u.role}</span></td>
                      <td>{u.orders || '—'}</td>
                      <td><span className="badge badge-green">Активен</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POINTS */}
      {tab === 'points' && (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {POINTS.map(p => (
              <div key={p.name} className="card p-4">
                <div className="text-lg mb-2">📍</div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.addr}</div>
                <div className="text-xs text-gray-500">{p.hours}</div>
                <div className="flex justify-between items-center mt-3">
                  <span className={`badge ${p.status === 'open' ? 'badge-green' : 'badge-yellow'}`}>
                    {p.status === 'open' ? 'Открыт' : 'Техработы'}
                  </span>
                  <span className="text-xs text-gray-400">{p.cars} авто</span>
                </div>
              </div>
            ))}
            <div
              className="card p-4 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 min-h-[120px]"
              onClick={() => toast('Добавление пункта в разработке', 'warning')}
            >
              <span className="text-xs text-gray-400">+ Добавить пункт выдачи</span>
            </div>
          </div>
        </div>
      )}

      {/* TARIFFS */}
      {tab === 'tariffs' && (
        <div className="p-4">
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-gray-100 font-semibold text-sm">Тарифы и ограничения</div>
            <div className="overflow-x-auto">
              <table className="tbl w-full">
                <thead>
                  <tr><th>Категория</th><th>Мин. цена/сут</th><th>Макс. цена/сут</th><th>Штраф/день</th><th>Мин. возраст</th><th>Мин. стаж</th></tr>
                </thead>
                <tbody>
                  {TARIFFS.map(t => (
                    <tr key={t.cat}>
                      <td className="font-medium">{t.cat}</td>
                      <td>{t.min}</td>
                      <td>{t.max}</td>
                      <td className="text-[#e94560] font-medium">{t.penalty}</td>
                      <td>{t.age}</td>
                      <td>{t.exp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
