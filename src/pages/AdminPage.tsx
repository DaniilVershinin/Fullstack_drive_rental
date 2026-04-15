import { useEffect, useMemo, useState } from 'react'
import { CARS, USERS } from '../data'
import { useApp } from '../hooks/useApp'
import { getCars, getPickupPointRows, getUsers, saveCar, savePickupPoint } from '../lib/api'
import type { Car, CarCategory, CarStatus, PickupPoint } from '../types'

const MONTHS = ['Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр']
const MONTH_VALS = [42, 58, 71, 65, 80, 93, 87]
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DAY_VALS = [65, 70, 82, 75, 90, 95, 80]

const TARIFFS = [
  { cat: 'Эконом', min: '1 500 ₽', max: '2 500 ₽', penalty: '500 ₽', age: '23 года', exp: '2 года' },
  { cat: 'Комфорт', min: '2 500 ₽', max: '4 000 ₽', penalty: '800 ₽', age: '23 года', exp: '2 года' },
  { cat: 'Бизнес', min: '5 000 ₽', max: '9 000 ₽', penalty: '1 500 ₽', age: '25 лет', exp: '3 года' },
  { cat: 'Внедорожник', min: '3 500 ₽', max: '7 000 ₽', penalty: '1 200 ₽', age: '23 года', exp: '2 года' },
]

const emptyCar: Partial<Car> = {
  name: '',
  year: new Date().getFullYear(),
  cat: 'economy',
  price: 2000,
  status: 'available',
  icon: '🚗',
  fuel: 'Бензин',
  transmission: 'Автомат',
  seats: 5,
  city: 'Воронеж',
  drive: 'передний',
  horsepower: 120,
  engineVolume: '1.6 л',
  bodyType: 'седан',
  color: 'белый',
  trunkVolume: 450,
  photoUrl: '',
}

const emptyPoint: Partial<PickupPoint> = {
  name: '',
  address: '',
  city: 'Воронеж',
  hours: '09:00-20:00',
  phone: '',
}

function BarChart({ vals, labels, max, accentLast = false, accentHigh = false }: { vals: number[], labels: string[], max: number, accentLast?: boolean, accentHigh?: boolean }) {
  return (
    <div className="admin-chart">
      {vals.map((value, index) => (
        <div key={labels[index]}>
          <span>{value}</span>
          <i
            style={{
              height: `${(value / max) * 100}%`,
              background: (accentLast && index === vals.length - 1) || (accentHigh && value > max * 0.85) ? '#e94560' : '#0f3460',
            }}
          />
          <em>{labels[index]}</em>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { toast } = useApp()
  const [tab, setTab] = useState<'analytics' | 'cars' | 'users' | 'points' | 'tariffs'>('analytics')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [users, setUsers] = useState(USERS)
  const [cars, setCars] = useState<Car[]>(CARS)
  const [points, setPoints] = useState<PickupPoint[]>([])
  const [carDraft, setCarDraft] = useState<Partial<Car>>(emptyCar)
  const [pointDraft, setPointDraft] = useState<Partial<PickupPoint>>(emptyPoint)
  const [savingCar, setSavingCar] = useState(false)
  const [savingPoint, setSavingPoint] = useState(false)

  const reload = () => {
    getUsers().then(setUsers).catch(() => toast('Не удалось загрузить пользователей', 'error'))
    getCars().then(setCars).catch(() => toast('Не удалось загрузить автомобили', 'error'))
    getPickupPointRows().then(setPoints).catch(() => toast('Не удалось загрузить пункты выдачи', 'error'))
  }

  useEffect(() => {
    reload()
  }, [])

  const filteredUsers = users.filter(user =>
    (!userRole || user.role === userRole) &&
    (!userSearch || user.name.toLowerCase().includes(userSearch.toLowerCase()) || user.email.toLowerCase().includes(userSearch.toLowerCase()))
  )

  const cities = useMemo(() => [...new Set([...cars.map(car => car.city), ...points.map(point => point.city)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [cars, points])

  const submitCar = async () => {
    if (!carDraft.name || !carDraft.city) {
      toast('Укажите название и город автомобиля', 'error')
      return
    }
    setSavingCar(true)
    try {
      const saved = await saveCar(carDraft)
      setCars(prev => carDraft.id ? prev.map(car => car.id === saved.id ? saved : car) : [saved, ...prev])
      setCarDraft(emptyCar)
      toast('Автомобиль сохранен')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось сохранить автомобиль', 'error')
    } finally {
      setSavingCar(false)
    }
  }

  const submitPoint = async () => {
    if (!pointDraft.name || !pointDraft.address || !pointDraft.city) {
      toast('Заполните название, адрес и город пункта', 'error')
      return
    }
    setSavingPoint(true)
    try {
      const saved = await savePickupPoint(pointDraft)
      setPoints(prev => pointDraft.id ? prev.map(point => point.id === saved.id ? saved : point) : [saved, ...prev])
      setPointDraft(emptyPoint)
      toast('Пункт выдачи сохранен')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось сохранить пункт', 'error')
    } finally {
      setSavingPoint(false)
    }
  }

  const tabs = [
    { key: 'analytics', label: 'Аналитика' },
    { key: 'cars', label: 'Автомобили' },
    { key: 'users', label: 'Пользователи' },
    { key: 'points', label: 'Пункты выдачи' },
    { key: 'tariffs', label: 'Тарифы' },
  ] as const

  return (
    <div className="staff-page">
      <section className="staff-hero">
        <div>
          <div className="font-syne font-extrabold text-2xl text-white">Панель администратора</div>
          <div className="text-sm text-white/60">Автомобили, пользователи, города, пункты выдачи и тарифы</div>
        </div>
        <button onClick={reload}>Обновить</button>
      </section>

      <div className="staff-tabs">
        {tabs.map(item => (
          <button key={item.key} className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && (
        <div className="admin-section">
          <div className="staff-metrics">
            {[
              ['Пользователей', users.length, 'в профилях'],
              ['Автомобилей', cars.length, 'в каталоге'],
              ['Городов', cities.length, 'в сети'],
              ['Пунктов выдачи', points.length, 'доступно'],
            ].map(([label, value, hint]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <em>{hint}</em>
              </div>
            ))}
          </div>
          <div className="admin-grid">
            <div className="staff-card">
              <div className="font-semibold text-sm mb-3">Заказы по месяцам</div>
              <BarChart vals={MONTH_VALS} labels={MONTHS} max={Math.max(...MONTH_VALS)} accentLast />
            </div>
            <div className="staff-card">
              <div className="font-semibold text-sm mb-3">Загруженность по дням</div>
              <BarChart vals={DAY_VALS} labels={DAYS} max={Math.max(...DAY_VALS)} accentHigh />
            </div>
          </div>
        </div>
      )}

      {tab === 'cars' && (
        <div className="admin-section admin-grid">
          <section className="staff-card">
            <div className="font-syne font-bold text-lg mb-3">{carDraft.id ? 'Редактировать авто' : 'Добавить авто'}</div>
            <div className="admin-form-grid">
              <label><span>Название</span><input value={carDraft.name ?? ''} onChange={e => setCarDraft({ ...carDraft, name: e.target.value })} /></label>
              <label><span>Город</span><input value={carDraft.city ?? ''} onChange={e => setCarDraft({ ...carDraft, city: e.target.value })} list="admin-cities" /></label>
              <label><span>Категория</span><select value={carDraft.cat} onChange={e => setCarDraft({ ...carDraft, cat: e.target.value as CarCategory })}><option value="economy">Эконом</option><option value="comfort">Комфорт</option><option value="business">Бизнес</option><option value="suv">Внедорожник</option></select></label>
              <label><span>Статус</span><select value={carDraft.status} onChange={e => setCarDraft({ ...carDraft, status: e.target.value as CarStatus })}><option value="available">Доступен</option><option value="busy">Занят</option></select></label>
              <label><span>Год</span><input type="number" value={carDraft.year ?? ''} onChange={e => setCarDraft({ ...carDraft, year: Number(e.target.value) })} /></label>
              <label><span>Цена/сут</span><input type="number" value={carDraft.price ?? ''} onChange={e => setCarDraft({ ...carDraft, price: Number(e.target.value) })} /></label>
              <label><span>Топливо</span><input value={carDraft.fuel ?? ''} onChange={e => setCarDraft({ ...carDraft, fuel: e.target.value })} /></label>
              <label><span>Коробка</span><input value={carDraft.transmission ?? ''} onChange={e => setCarDraft({ ...carDraft, transmission: e.target.value })} /></label>
              <label><span>Привод</span><input value={carDraft.drive ?? ''} onChange={e => setCarDraft({ ...carDraft, drive: e.target.value })} /></label>
              <label><span>Л.с.</span><input type="number" value={carDraft.horsepower ?? ''} onChange={e => setCarDraft({ ...carDraft, horsepower: Number(e.target.value) })} /></label>
              <label><span>Объем</span><input value={carDraft.engineVolume ?? ''} onChange={e => setCarDraft({ ...carDraft, engineVolume: e.target.value })} /></label>
              <label><span>Кузов</span><input value={carDraft.bodyType ?? ''} onChange={e => setCarDraft({ ...carDraft, bodyType: e.target.value })} /></label>
              <label><span>Цвет</span><input value={carDraft.color ?? ''} onChange={e => setCarDraft({ ...carDraft, color: e.target.value })} /></label>
              <label><span>Багажник, л</span><input type="number" value={carDraft.trunkVolume ?? ''} onChange={e => setCarDraft({ ...carDraft, trunkVolume: Number(e.target.value) })} /></label>
              <label><span>Мест</span><input type="number" value={carDraft.seats ?? ''} onChange={e => setCarDraft({ ...carDraft, seats: Number(e.target.value) })} /></label>
              <label><span>Иконка</span><input value={carDraft.icon ?? ''} onChange={e => setCarDraft({ ...carDraft, icon: e.target.value })} /></label>
              <label className="admin-form-wide"><span>Фото URL</span><input value={carDraft.photoUrl ?? ''} onChange={e => setCarDraft({ ...carDraft, photoUrl: e.target.value })} placeholder="https://..." /></label>
            </div>
            <datalist id="admin-cities">{cities.map(city => <option key={city} value={city} />)}</datalist>
            <div className="admin-form-actions">
              <button onClick={submitCar} disabled={savingCar}>{savingCar ? 'Сохраняем...' : 'Сохранить авто'}</button>
              <button className="secondary" onClick={() => setCarDraft(emptyCar)}>Новая машина</button>
            </div>
          </section>

          <section className="admin-list">
            {cars.map(car => (
              <article key={car.id} onClick={() => setCarDraft(car)}>
                <div>
                  <strong>{car.icon} {car.name}</strong>
                  <span>{car.city} · {car.year} · {car.price.toLocaleString('ru')} ₽/сут</span>
                </div>
                <em>{car.horsepower ?? '—'} л.с.</em>
              </article>
            ))}
          </section>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-section">
          <div className="staff-filters">
            <input placeholder="Поиск по имени или email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <select value={userRole} onChange={e => setUserRole(e.target.value)}>
              <option value="">Все роли</option>
              <option>Клиент</option>
              <option>Менеджер</option>
              <option>Админ</option>
            </select>
          </div>
          <div className="staff-card overflow-x-auto">
            <table className="tbl w-full">
              <thead><tr><th>ID</th><th>ФИО</th><th>Email</th><th>Роль</th><th>Заказов</th><th>Статус</th></tr></thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="text-gray-400">{user.id}</td>
                    <td className="font-medium">{user.name}</td>
                    <td className="text-gray-500">{user.email}</td>
                    <td><span className={`badge ${user.role === 'Менеджер' ? 'badge-yellow' : user.role === 'Админ' ? 'badge-red' : 'badge-gray'}`}>{user.role}</span></td>
                    <td>{user.orders || '—'}</td>
                    <td><span className="badge badge-green">Активен</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'points' && (
        <div className="admin-section admin-grid">
          <section className="staff-card">
            <div className="font-syne font-bold text-lg mb-3">{pointDraft.id ? 'Редактировать пункт' : 'Добавить пункт'}</div>
            <div className="admin-form-grid">
              <label><span>Название</span><input value={pointDraft.name ?? ''} onChange={e => setPointDraft({ ...pointDraft, name: e.target.value })} /></label>
              <label><span>Город</span><input value={pointDraft.city ?? ''} onChange={e => setPointDraft({ ...pointDraft, city: e.target.value })} list="admin-cities" /></label>
              <label className="admin-form-wide"><span>Адрес</span><input value={pointDraft.address ?? ''} onChange={e => setPointDraft({ ...pointDraft, address: e.target.value })} /></label>
              <label><span>График</span><input value={pointDraft.hours ?? ''} onChange={e => setPointDraft({ ...pointDraft, hours: e.target.value })} /></label>
              <label><span>Телефон</span><input value={pointDraft.phone ?? ''} onChange={e => setPointDraft({ ...pointDraft, phone: e.target.value })} /></label>
            </div>
            <div className="admin-form-actions">
              <button onClick={submitPoint} disabled={savingPoint}>{savingPoint ? 'Сохраняем...' : 'Сохранить пункт'}</button>
              <button className="secondary" onClick={() => setPointDraft(emptyPoint)}>Новый пункт</button>
            </div>
          </section>

          <section className="admin-list">
            {points.map(point => (
              <article key={point.id} onClick={() => setPointDraft(point)}>
                <div>
                  <strong>{point.city} — {point.name}</strong>
                  <span>{point.address} · {point.hours}</span>
                </div>
                <em>{point.phone ?? '—'}</em>
              </article>
            ))}
          </section>
        </div>
      )}

      {tab === 'tariffs' && (
        <div className="admin-section">
          <div className="staff-card overflow-x-auto">
            <table className="tbl w-full">
              <thead><tr><th>Категория</th><th>Мин. цена/сут</th><th>Макс. цена/сут</th><th>Штраф/день</th><th>Мин. возраст</th><th>Мин. стаж</th></tr></thead>
              <tbody>
                {TARIFFS.map(tariff => (
                  <tr key={tariff.cat}>
                    <td className="font-medium">{tariff.cat}</td>
                    <td>{tariff.min}</td>
                    <td>{tariff.max}</td>
                    <td className="text-[#e94560] font-medium">{tariff.penalty}</td>
                    <td>{tariff.age}</td>
                    <td>{tariff.exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
