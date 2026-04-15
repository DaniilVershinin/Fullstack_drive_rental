import { useEffect, useMemo, useState } from 'react'
import { ALL_ORDERS, CARS } from '../data'
import { getAllOrders, getCars, updateCarStatus, updateOrderStatus } from '../lib/api'
import type { ManagerOrder } from '../data'
import type { Car, CarStatus, OrderStatus } from '../types'

type SortKey = 'id' | 'client' | 'total'
type Tab = 'orders' | 'fleet'

const STATUS_LABEL: Record<string, string> = { pending: 'Ожидает', active: 'Активна', done: 'Завершена', cancelled: 'Отменена' }
const STATUS_CLASS: Record<string, string> = { pending: 'badge-yellow', active: 'badge-green', done: 'badge-gray', cancelled: 'badge-red' }

export default function ManagerPage() {
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<ManagerOrder[]>(ALL_ORDERS)
  const [cars, setCars] = useState<Car[]>(CARS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [loading, setLoading] = useState(false)

  const reload = () => {
    setLoading(true)
    Promise.all([
      getAllOrders().then(setOrders),
      getCars().then(setCars),
    ]).finally(() => setLoading(false)).catch(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(direction => (direction === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  const updateStatus = async (id: string, status: OrderStatus) => {
    const previous = orders
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order))
    try {
      await updateOrderStatus(id, status)
    } catch {
      setOrders(previous)
    }
  }

  const setCarStatus = async (car: Car, status: CarStatus) => {
    const previous = cars
    setCars(prev => prev.map(item => item.id === car.id ? { ...item, status } : item))
    try {
      await updateCarStatus(car.id, status)
    } catch {
      setCars(previous)
    }
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    const list = orders.filter(order => {
      if (statusFilter && order.status !== statusFilter) return false
      if (query && !order.client.toLowerCase().includes(query) && !order.car.toLowerCase().includes(query) && !order.id.toLowerCase().includes(query)) return false
      return true
    })
    return [...list].sort((a, b) => {
      const av = sortKey === 'total' ? a.total : a[sortKey]
      const bv = sortKey === 'total' ? b.total : b[sortKey]
      return sortDir * (String(av) > String(bv) ? 1 : -1)
    })
  }, [orders, search, sortDir, sortKey, statusFilter])

  const revenue = orders.reduce((sum, order) => sum + order.total, 0)
  const metrics = [
    { label: 'Активные аренды', value: orders.filter(order => order.status === 'active').length, hint: 'в работе' },
    { label: 'Ожидают выдачи', value: orders.filter(order => order.status === 'pending').length, hint: 'проверьте документы', warn: true },
    { label: 'Авто доступно', value: cars.filter(car => car.status === 'available').length, hint: `из ${cars.length} в парке` },
    { label: 'Сумма заказов', value: `${revenue.toLocaleString('ru')} ₽`, hint: 'по списку' },
  ]

  return (
    <div className="staff-page">
      <section className="staff-hero">
        <div>
          <div className="font-syne font-extrabold text-2xl text-white">Панель менеджера</div>
          <div className="text-sm text-white/60">Заказы, выдача автомобилей и состояние автопарка</div>
        </div>
        <button onClick={reload}>{loading ? 'Обновляем...' : 'Обновить'}</button>
      </section>

      <section className="staff-metrics">
        {metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em className={metric.warn ? 'is-warn' : ''}>{metric.hint}</em>
          </div>
        ))}
      </section>

      <div className="staff-tabs">
        <button className={tab === 'orders' ? 'is-active' : ''} onClick={() => setTab('orders')}>Заказы</button>
        <button className={tab === 'fleet' ? 'is-active' : ''} onClick={() => setTab('fleet')}>Автопарк</button>
      </div>

      {tab === 'orders' && (
        <section className="staff-card">
          <div className="staff-filters">
            <input placeholder="Клиент, авто или номер заказа..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="active">Активна</option>
              <option value="done">Завершена</option>
              <option value="cancelled">Отменена</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>№ {sortKey === 'id' ? (sortDir === 1 ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('client')}>Клиент {sortKey === 'client' ? (sortDir === 1 ? '↑' : '↓') : ''}</th>
                  <th>Авто</th>
                  <th>Даты</th>
                  <th onClick={() => handleSort('total')}>Сумма {sortKey === 'total' ? (sortDir === 1 ? '↑' : '↓') : ''}</th>
                  <th>Статус</th>
                  <th>Просрочка</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td className="font-semibold text-[#0f3460]">{order.id}</td>
                    <td>{order.client}</td>
                    <td>{order.car}</td>
                    <td className="text-gray-500">{order.dates}</td>
                    <td className="font-semibold">{order.total.toLocaleString('ru')} ₽</td>
                    <td>
                      <select className="staff-status-select" value={order.status} onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}>
                        <option value="pending">Ожидает</option>
                        <option value="active">Активна</option>
                        <option value="done">Завершена</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                      <span className={`badge ${STATUS_CLASS[order.status]}`}>{STATUS_LABEL[order.status] ?? order.status}</span>
                    </td>
                    <td>{order.overdueDays > 0 ? <span className="badge badge-red">+{order.overdueDays} дн.</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'fleet' && (
        <section className="fleet-grid">
          {cars.map(car => (
            <article key={car.id} className="fleet-card">
              <div className="fleet-card-icon">{car.icon}</div>
              <div className="font-syne font-bold text-sm">{car.name}</div>
              <div className="text-xs text-gray-500">{car.city} · {car.year} · {car.fuel}</div>
              <div className="car-specs-mini">
                <span>{car.horsepower ? `${car.horsepower} л.с.` : '—'}</span>
                <span>{car.engineVolume ?? '—'}</span>
                <span>{car.drive ?? '—'}</span>
              </div>
              <div className="fleet-card-footer">
                <span>{car.price.toLocaleString('ru')} ₽/сут</span>
                <select value={car.status} onChange={e => setCarStatus(car, e.target.value as CarStatus)}>
                  <option value="available">Доступен</option>
                  <option value="busy">Занят</option>
                </select>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
