import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import { CARS, MY_ORDERS } from '../data'
import { cancelOrder as cancelOrderInDb, getCars, getMyOrders, updateProfile } from '../lib/api'
import { isSupabaseConfigured } from '../lib/supabase'
import { PENALTY } from '../types'
import type { Order, OrderStatus } from '../types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  active: 'Активна',
  done: 'Завершена',
  pending: 'Ожидает выдачи',
  cancelled: 'Отменена',
}

const STATUS_CLASS: Record<OrderStatus, string> = {
  active: 'badge-green',
  done: 'badge-gray',
  pending: 'badge-yellow',
  cancelled: 'badge-red',
}

type Tab = 'current' | 'history' | 'profile'

function fmt(value: string) {
  return new Date(value).toLocaleDateString('ru', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isFuture(order: Order) {
  return order.status === 'pending' || order.status === 'active'
}

export default function CabinetPage() {
  const { user, setUser, toast, csrfToken } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('current')
  const [orders, setOrders] = useState<Order[]>(isSupabaseConfigured ? [] : MY_ORDERS)
  const [cars, setCars] = useState(CARS)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const [editName, setEditName] = useState(user?.name.split(' ')[0] || '')
  const [editSurname, setEditSurname] = useState(user?.name.split(' ').slice(1).join(' ') || '')
  const [editPhone, setEditPhone] = useState('')
  const [editDob, setEditDob] = useState(user?.dob || '')
  const [editDl, setEditDl] = useState('')

  useEffect(() => {
    if (!user) return
    setEditName(user.name.split(' ')[0] || '')
    setEditSurname(user.name.split(' ').slice(1).join(' ') || '')
    setEditDob(user.dob || '')
  }, [user])

  useEffect(() => {
    if (!user) return
    setOrdersLoading(true)
    getMyOrders(user.id)
      .then(setOrders)
      .catch(error => toast(error instanceof Error ? error.message : 'Не удалось загрузить заказы', 'error'))
      .finally(() => setOrdersLoading(false))
    getCars().then(setCars).catch(() => {})
  }, [user, toast])

  const stats = useMemo(() => ({
    current: orders.filter(isFuture).length,
    done: orders.filter(order => order.status === 'done').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    total: orders.reduce((sum, order) => sum + order.total, 0),
  }), [orders])

  if (!user) {
    return (
      <div className="cabinet-empty-auth">
        <div className="text-5xl">🔒</div>
        <div className="font-syne font-bold text-xl">Войдите в аккаунт</div>
        <p>Для доступа к личному кабинету необходима авторизация</p>
        <button className="btn-primary w-auto px-8" onClick={() => nav('/auth')}>Войти</button>
      </div>
    )
  }

  const displayedOrders = tab === 'current'
    ? orders.filter(isFuture)
    : orders.filter(order => !isFuture(order))

  const cancelOrder = async (id: string) => {
    const order = orders.find(item => item.id === id)
    if (!order) return
    const hoursUntil = (new Date(order.from).getTime() - Date.now()) / 3600000
    if (hoursUntil < 24 && hoursUntil > 0) {
      toast('Отмена невозможна менее чем за 24 ч до начала аренды', 'error')
      return
    }
    if (!window.confirm(`Отменить бронирование ${id}?`)) return
    try {
      await cancelOrderInDb(id, { csrfToken })
      setOrders(prev => prev.map(item => item.id === id ? { ...item, status: 'cancelled' as const } : item))
      toast(`Бронирование ${id} отменено`)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось отменить бронирование', 'error')
    }
  }

  const repeatOrder = (order: Order) => {
    const car = cars.find(item => item.id === order.carId)
    const query = new URLSearchParams()
    if (car?.city) query.set('city', car.city)
    if (car?.cat) query.set('cat', car.cat)
    nav(`/catalog?${query.toString()}`)
  }

  const saveProfile = async () => {
    if (!user.id) {
      setUser({ ...user, name: `${editName} ${editSurname}`.trim(), dob: editDob })
      toast('Профиль сохранён')
      return
    }

    setProfileSaving(true)
    try {
      const updated = await updateProfile(
        {
          id: user.id,
          fullName: `${editName} ${editSurname}`.trim(),
          dob: editDob,
          phone: editPhone,
          driverLicense: editDl,
        },
        { csrfToken },
      )
      setUser({ ...user, ...updated, email: updated.email || user.email, role: updated.role || user.role })
      toast('Профиль сохранён')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось сохранить профиль', 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="cabinet-page">
      <section className="cabinet-hero">
        <div className="cabinet-avatar">{user.initials}</div>
        <div>
          <div className="font-syne font-extrabold text-2xl text-white">{user.name}</div>
          <div className="text-sm text-white/60">{user.email}</div>
        </div>
        <button className="cabinet-edit-btn" onClick={() => setTab('profile')}>Редактировать профиль</button>
      </section>

      <section className="cabinet-stats">
        {[
          ['Текущие', stats.current],
          ['Завершены', stats.done],
          ['Отменены', stats.cancelled],
          ['Всего оплачено', `${stats.total.toLocaleString('ru')} ₽`],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <div className="cabinet-tabs">
        {([
          ['current', 'Текущие заказы'],
          ['history', 'История'],
          ['profile', 'Профиль'],
        ] as const).map(([key, label]) => (
          <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="cabinet-body">
        {(tab === 'current' || tab === 'history') && (
          <div>
            {ordersLoading ? (
              <div className="cabinet-order-grid">
                {Array.from({ length: 3 }).map((_, index) => <div key={index} className="catalog-skeleton" />)}
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="cabinet-empty">
                <div className="font-syne font-bold text-lg">Заказов нет</div>
                <p>{tab === 'current' ? 'Здесь появятся будущие и активные аренды.' : 'Завершенные и отмененные заказы появятся здесь.'}</p>
                <button onClick={() => nav('/catalog')}>Перейти в каталог</button>
              </div>
            ) : (
              <div className="cabinet-order-grid">
                {displayedOrders.map(order => {
                  const car = cars.find(item => item.id === order.carId)
                  const penalty = order.overdueDays > 0 ? order.overdueDays * PENALTY[car?.cat || 'economy'] : 0
                  return (
                    <article key={order.id} className="cabinet-order-card">
                      <div className="cabinet-order-top">
                        <div>
                          <span>{order.id}</span>
                          <strong>{order.icon} {order.car}</strong>
                        </div>
                        <span className={`badge ${STATUS_CLASS[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                      </div>
                      <div className="cabinet-order-dates">
                        <div><span>Начало</span><strong>{fmt(order.from)}</strong></div>
                        <div><span>Возврат</span><strong>{fmt(order.to)}</strong></div>
                        <div><span>Пункт</span><strong>{order.point || '—'}</strong></div>
                      </div>
                      <div className="cabinet-order-total">
                        <span>Итого</span>
                        <strong>{order.total.toLocaleString('ru')} ₽</strong>
                      </div>
                      {penalty > 0 && <div className="cabinet-order-warning">Просрочка: +{penalty.toLocaleString('ru')} ₽</div>}
                      <div className="cabinet-order-actions">
                        <button onClick={() => repeatOrder(order)}>Повторить</button>
                        {order.status === 'pending' && <button className="is-danger" onClick={() => cancelOrder(order.id)}>Отменить</button>}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="cabinet-profile-form">
            <div>
              <div className="font-syne font-bold text-lg">Профиль клиента</div>
              <p>Эти данные используются для договора аренды и связи по заказам.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label><span>Имя</span><input value={editName} onChange={e => setEditName(e.target.value)} /></label>
              <label><span>Фамилия</span><input value={editSurname} onChange={e => setEditSurname(e.target.value)} /></label>
              <label><span>Email</span><input value={user.email} readOnly /></label>
              <label><span>Телефон</span><input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+7 900 000-00-00" /></label>
              <label><span>Дата рождения</span><input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} /></label>
              <label><span>Водительское удостоверение</span><input value={editDl} onChange={e => setEditDl(e.target.value)} placeholder="77 22 123456" /></label>
            </div>
            <button className="btn-primary w-auto px-8" onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
