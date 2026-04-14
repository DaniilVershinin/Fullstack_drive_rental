import { useEffect, useState, useMemo } from 'react'
import { ALL_ORDERS, CARS } from '../data'
import { getAllOrders, getCars, updateOrderStatus } from '../lib/api'
import type { ManagerOrder } from '../data'
import type { OrderStatus } from '../types'

type SortKey = 'id' | 'client' | 'total'

const STATUS_LABEL: Record<string, string> = { pending: 'Ожидает', active: 'Активна', done: 'Завершена' }
const STATUS_CLASS: Record<string, string> = { pending: 'badge-yellow', active: 'badge-green', done: 'badge-gray' }

export default function ManagerPage() {
  const [orders, setOrders] = useState<ManagerOrder[]>(ALL_ORDERS)
  const [cars, setCars] = useState(CARS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<1 | -1>(1)

  useEffect(() => {
    getAllOrders().then(setOrders).catch(() => {})
    getCars().then(setCars).catch(() => {})
  }, [])

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(1) }
  }

  const updateStatus = async (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as OrderStatus } : o))
    try {
      await updateOrderStatus(id, status as OrderStatus)
    } catch {
      getAllOrders().then(setOrders).catch(() => {})
    }
  }

  const filtered = useMemo(() => {
    let list = orders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false
      if (search && !o.client.toLowerCase().includes(search.toLowerCase()) && !o.car.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    list = [...list].sort((a, b) => {
      const av = sortKey === 'total' ? a.total : (a as any)[sortKey]
      const bv = sortKey === 'total' ? b.total : (b as any)[sortKey]
      return sortDir * (String(av) > String(bv) ? 1 : -1)
    })
    return list
  }, [orders, search, statusFilter, sortKey, sortDir])

  const metrics = [
    { label: 'Активные аренды', value: orders.filter(o => o.status === 'active').length, delta: '+3 сегодня' },
    { label: 'Ожидают выдачи', value: orders.filter(o => o.status === 'pending').length, delta: 'Требуют действия', warn: true },
    { label: 'Авто доступно', value: cars.filter(c => c.status === 'available').length, delta: `из ${cars.length} в парке` },
    { label: 'Выручка сегодня', value: '12 400 ₽', delta: '↑ +18%' },
  ]

  return (
    <div>
      <div className="bg-[#1a1a2e] px-4 py-3">
        <div className="font-syne font-bold text-lg text-white">Панель менеджера</div>
        <div className="text-xs text-white/50 mt-0.5">Управление заказами и автопарком</div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        {metrics.map(m => (
          <div key={m.label} className="card p-3">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="font-syne font-extrabold text-2xl">{m.value}</div>
            <div className={`text-xs mt-1 ${m.warn ? 'text-[#e94560]' : 'text-green-600'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-3 py-2 bg-white border-b border-gray-100">
        <input
          className="input flex-1 text-xs" placeholder="Поиск клиента или авто..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-auto text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="active">Активна</option>
          <option value="done">Завершена</option>
        </select>
      </div>

      {/* Orders table */}
      <div className="mx-3 mt-3 card overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-gray-100">
          <div className="font-semibold text-sm">Заказы</div>
          <span className="badge badge-red">{orders.filter(o => o.status === 'pending').length} ожидают</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('id')}>
                  № {sortKey === 'id' ? (sortDir === 1 ? '↑' : '↓') : ''}
                </th>
                <th className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('client')}>
                  Клиент {sortKey === 'client' ? (sortDir === 1 ? '↑' : '↓') : ''}
                </th>
                <th>Авто</th>
                <th>Даты</th>
                <th className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('total')}>
                  Сумма {sortKey === 'total' ? (sortDir === 1 ? '↑' : '↓') : ''}
                </th>
                <th>Статус</th>
                <th>Просрочка</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td className="font-semibold text-[#0f3460]">{o.id}</td>
                  <td>{o.client}</td>
                  <td>{o.car}</td>
                  <td className="text-gray-500">{o.dates}</td>
                  <td className="font-semibold">{o.total.toLocaleString('ru')} ₽</td>
                  <td>
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50"
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="active">Активна</option>
                      <option value="done">Завершена</option>
                    </select>
                  </td>
                  <td>
                    {o.overdueDays > 0 ? (
                      <span className="badge badge-red text-[9px]">+{o.overdueDays}д · +{(o.overdueDays * 800).toLocaleString('ru')}₽</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet */}
      <div className="px-3 py-2 mt-2">
        <div className="font-semibold text-sm mb-2">Автопарк</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {cars.map(c => (
            <div key={c.id} className="card p-3">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="font-semibold text-xs">{c.name}</div>
              <div className="text-[10px] text-gray-500">{c.year} · {c.fuel}</div>
              <div className="text-[10px] text-gray-500 mb-2">{c.price.toLocaleString('ru')} ₽/сут</div>
              <span className={`badge ${c.status === 'available' ? 'badge-green' : 'badge-gray'} text-[9px]`}>
                {c.status === 'available' ? 'Доступен' : 'Арендован'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
