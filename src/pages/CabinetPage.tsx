import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import { MY_ORDERS, CARS } from '../data'
import { cancelOrder as cancelOrderInDb, getCars, getMyOrders } from '../lib/api'
import { PENALTY } from '../types'
import type { OrderStatus } from '../types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  active: 'Активна', done: 'Завершена', pending: 'Ожидает выдачи', cancelled: 'Отменена',
}
const STATUS_CLASS: Record<OrderStatus, string> = {
  active: 'badge-green', done: 'badge-gray', pending: 'badge-yellow', cancelled: 'badge-red',
}

export default function CabinetPage() {
  const { user, setUser, toast } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<'orders' | 'active' | 'profile'>('orders')
  const [orders, setOrders] = useState(MY_ORDERS)
  const [cars, setCars] = useState(CARS)

  // Profile edit state
  const [editName, setEditName] = useState(user?.name.split(' ')[0] || '')
  const [editSurname, setEditSurname] = useState(user?.name.split(' ')[1] || '')
  const [editPhone, setEditPhone] = useState('+7 (999) 123-45-67')
  const [editDob, setEditDob] = useState(user?.dob || '1990-05-15')
  const [editDl, setEditDl] = useState('77 22 456789')

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl">🔒</div>
        <div className="font-syne font-bold text-xl">Войдите в аккаунт</div>
        <p className="text-gray-500 text-sm">Для доступа к личному кабинету необходима авторизация</p>
        <button className="btn-primary w-auto px-8" onClick={() => nav('/auth')}>Войти</button>
      </div>
    )
  }

  useEffect(() => {
    if (!user) return
    getMyOrders(user.id).then(setOrders).catch(() => toast('Не удалось загрузить заказы', 'error'))
    getCars().then(setCars).catch(() => {})
  }, [user, toast])

  const cancelOrder = async (id: string) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const hoursUntil = (new Date(order.from).getTime() - Date.now()) / 3600000
    if (hoursUntil < 24 && hoursUntil > 0) {
      toast('Отмена невозможна менее чем за 24 ч до начала аренды', 'error')
      return
    }
    try {
      await cancelOrderInDb(id)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o))
      toast(`Бронирование ${id} отменено`)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось отменить бронирование', 'error')
    }
  }

  const saveProfile = () => {
    if (setUser) {
      setUser({ ...user, name: `${editName} ${editSurname}`, dob: editDob })
    }
    toast('Профиль сохранён')
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('ru', { day: '2-digit', month: 'short' })

  const displayOrders = tab === 'active' ? orders.filter(o => o.status === 'active') : orders

  return (
    <div>
      {/* Profile header */}
      <div className="bg-[#1a1a2e] px-4 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#e94560] flex items-center justify-center font-syne font-bold text-lg text-white">
          {user.initials}
        </div>
        <div>
          <div className="font-syne font-bold text-white">{user.name}</div>
          <div className="text-xs text-white/50">{user.email}</div>
        </div>
        <button
          className="ml-auto bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/20 transition"
          onClick={() => setTab('profile')}
        >
          Редактировать
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {([['orders', 'Все заказы'], ['active', 'Активные'], ['profile', 'Профиль']] as const).map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${tab === t ? 'border-[#e94560] text-[#e94560]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* ORDERS TAB */}
        {(tab === 'orders' || tab === 'active') && (
          <div className="card overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div className="font-semibold text-sm">{tab === 'active' ? 'Активные аренды' : 'Все заказы'}</div>
              <span className="text-xs text-gray-400">{displayOrders.length} записей</span>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl w-full">
                <thead>
                  <tr>
                    <th>№ заказа</th><th>Автомобиль</th><th>Начало</th><th>Окончание</th>
                    <th>Сумма</th><th>Статус</th><th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Нет заказов</td></tr>
                  ) : displayOrders.map(o => {
                    const car = cars.find(c => c.id === o.carId)
                    const penalty = o.overdueDays > 0 ? o.overdueDays * PENALTY[car?.cat || 'economy'] : 0
                    return (
                      <tr key={o.id}>
                        <td className="font-semibold text-[#0f3460]">{o.id}</td>
                        <td>{o.icon} {o.car}</td>
                        <td className="text-gray-500">{fmt(o.from)}</td>
                        <td className="text-gray-500">{fmt(o.to)}</td>
                        <td>
                          <div className="font-semibold">{o.total.toLocaleString('ru')} ₽</div>
                          {penalty > 0 && <div className="text-xs text-[#e94560]">+{penalty.toLocaleString('ru')} ₽ штраф</div>}
                          {o.overdueDays > 0 && <span className="badge badge-red text-[9px]">+{o.overdueDays} дн.</span>}
                        </td>
                        <td><span className={`badge ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                        <td>
                          {o.status === 'pending' ? (
                            <button onClick={() => cancelOrder(o.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-lg hover:bg-red-100">
                              Отменить
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="card p-5 max-w-md">
            <div className="font-syne font-bold text-sm mb-4">Редактирование профиля</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Имя</label>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="label">Фамилия</label>
                <input className="input" value={editSurname} onChange={e => setEditSurname(e.target.value)} />
              </div>
            </div>
            <div className="mb-3">
              <label className="label">Email</label>
              <input className="input opacity-60 cursor-not-allowed" type="email" value={user.email} readOnly />
            </div>
            <div className="mb-3">
              <label className="label">Телефон</label>
              <input className="input" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="label">Дата рождения</label>
              <input className="input" type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
            </div>
            <div className="mb-5">
              <label className="label">Вод. удостоверение</label>
              <input className="input" value={editDl} onChange={e => setEditDl(e.target.value)} />
            </div>
            <button className="btn-primary w-auto px-8" onClick={saveProfile}>Сохранить</button>
          </div>
        )}
      </div>
    </div>
  )
}
