import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CARS } from '../data'
import BookingModal from '../components/BookingModal'
import CarImage from '../components/CarImage'
import { useApp } from '../hooks/useApp'
import { getCars } from '../lib/api'
import type { Car } from '../types'

export default function CatalogPage() {
  const { user, toast } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()

  const [catFilter, setCatFilter] = useState<string>(params.get('cat') || '')
  const [cityFilter, setCityFilter] = useState(params.get('city') || '')
  const [maxPrice, setMaxPrice] = useState(10000)
  const [statusFilter, setStatusFilter] = useState<'all' | 'available'>('all')
  const [sortBy, setSortBy] = useState<'pa' | 'pd' | 'nm'>('pa')
  const [bookingCar, setBookingCar] = useState<Car | null>(null)
  const [cars, setCars] = useState<Car[]>(CARS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getCars()
      .then(setCars)
      .catch(() => toast('Не удалось загрузить автомобили', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = useMemo(() => {
    let list = cars.filter(c => {
      if (catFilter && c.cat !== catFilter) return false
      if (cityFilter && c.city !== cityFilter) return false
      if (c.price > maxPrice) return false
      if (statusFilter === 'available' && c.status !== 'available') return false
      return true
    })
    if (sortBy === 'pa') list = [...list].sort((a, b) => a.price - b.price)
    else if (sortBy === 'pd') list = [...list].sort((a, b) => b.price - a.price)
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [cars, catFilter, cityFilter, maxPrice, statusFilter, sortBy])

  const handleBook = (car: Car) => {
    if (!user) { toast('Войдите в аккаунт для бронирования', 'error'); nav('/auth'); return }
    if (car.status === 'busy') { toast('Автомобиль недоступен', 'error'); return }
    setBookingCar(car)
  }

  const resetFilters = () => {
    setCatFilter(''); setCityFilter(''); setMaxPrice(10000); setStatusFilter('all'); setSortBy('pa')
    toast('Фильтры сброшены')
  }

  const cats: { value: string; label: string }[] = [
    { value: '', label: 'Все' },
    { value: 'economy', label: 'Эконом' },
    { value: 'comfort', label: 'Комфорт' },
    { value: 'business', label: 'Бизнес' },
    { value: 'suv', label: 'Внедорожник' },
  ]

  return (
    <div className="flex gap-4 p-4">
      <aside className="w-48 shrink-0">
        <div className="card p-3 sticky top-16">
          <div className="font-syne font-bold text-sm mb-3">Фильтры</div>

          <div className="mb-4">
            <div className="label">Город</div>
            <select className="input" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
              <option value="">Все города</option>
              <option>Москва</option>
              <option>Санкт-Петербург</option>
              <option>Казань</option>
              <option>Новосибирск</option>
              <option>Воронеж</option>
              <option>Белгород</option>
              <option>Старый Оскол</option>
              <option>Липецк</option>
              <option>Елец</option>
              <option>Борисоглебск</option>
              <option>Россошь</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="label">Категория</div>
            {cats.map(c => (
              <button
                key={c.value}
                onClick={() => setCatFilter(c.value)}
                className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 mb-1.5 transition-all
                  ${catFilter === c.value ? 'border-[#e94560] bg-[#e94560] text-white' : 'border-gray-200 text-gray-500 hover:border-[#0f3460] hover:text-[#0f3460]'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="label">Макс. цена/сут</div>
            <input
              type="range" min={1500} max={10000} step={500} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#e94560]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 500 ₽</span>
              <span className="font-medium text-gray-600">{maxPrice.toLocaleString('ru')} ₽</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="label">Доступность</div>
            {[{ v: 'all', l: 'Все' }, { v: 'available', l: 'Только свободные' }].map(s => (
              <button
                key={s.v}
                onClick={() => setStatusFilter(s.v as any)}
                className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 mb-1.5 transition-all
                  ${statusFilter === s.v ? 'border-[#e94560] bg-[#e94560] text-white' : 'border-gray-200 text-gray-500 hover:border-[#0f3460]'}`}
              >
                {s.l}
              </button>
            ))}
          </div>

          <button onClick={resetFilters} className="w-full py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
            Сбросить фильтры
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500">{filtered.length} автомобилей</span>
          <select className="input w-auto text-xs" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="pa">Цена ↑</option>
            <option value="pd">Цена ↓</option>
            <option value="nm">По названию</option>
          </select>
        </div>

        {loading && cars.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-sm">Загружаем автомобили...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🔎</div>
            <div className="text-sm">Ничего не найдено. Измените фильтры.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {filtered.map(car => (
              <div
                key={car.id}
                className="card overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all"
                onClick={() => nav(`/car/${car.id}`)}
              >
                <div className="car-card-photo relative">
                  <CarImage car={car} className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-xl">{car.icon}</span>
                  <span className={`absolute top-2 right-2 badge ${car.status === 'available' ? 'badge-green' : 'badge-red'}`}>
                    {car.status === 'available' ? 'Доступен' : 'Занят'}
                  </span>
                </div>
                <div className="p-3">
                  <div className="font-syne font-bold text-sm mb-0.5">{car.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{car.year} · {car.fuel} · {car.city}</div>
                  <div className="car-specs-mini">
                    <span>{car.horsepower ? `${car.horsepower} л.с.` : 'мощность —'}</span>
                    <span>{car.engineVolume ?? 'объем —'}</span>
                    <span>{car.drive ?? 'привод —'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-syne font-extrabold text-sm">
                      {car.price.toLocaleString('ru')} ₽<span className="text-xs font-normal text-gray-400">/сут</span>
                    </div>
                    <button
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${car.status === 'available' ? 'bg-[#1a1a2e] text-white hover:bg-[#e94560]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      onClick={e => { e.stopPropagation(); handleBook(car) }}
                      disabled={car.status === 'busy'}
                    >
                      {car.status === 'available' ? 'Бронировать' : 'Занят'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookingCar && (
        <BookingModal
          car={bookingCar}
          onClose={() => setBookingCar(null)}
          onBooked={() => {}}
        />
      )}
    </div>
  )
}
