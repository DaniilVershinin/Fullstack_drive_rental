import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CARS } from '../data'
import BookingModal from '../components/BookingModal'
import CarImage from '../components/CarImage'
import { useApp } from '../hooks/useApp'
import { getCars } from '../lib/api'
import type { Car } from '../types'

type SortKey = 'priceAsc' | 'priceDesc' | 'name' | 'yearDesc' | 'powerDesc'

const cats = [
  { value: '', label: 'Все' },
  { value: 'economy', label: 'Эконом' },
  { value: 'comfort', label: 'Комфорт' },
  { value: 'business', label: 'Бизнес' },
  { value: 'suv', label: 'Внедорожник' },
]

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'ru'))
}

export default function CatalogPage() {
  const { user, toast } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()

  const [catFilter, setCatFilter] = useState<string>(params.get('cat') || '')
  const [cityFilter, setCityFilter] = useState(params.get('city') || '')
  const [fuelFilter, setFuelFilter] = useState('')
  const [transmissionFilter, setTransmissionFilter] = useState('')
  const [driveFilter, setDriveFilter] = useState('')
  const [minPower, setMinPower] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000)
  const [statusFilter, setStatusFilter] = useState<'all' | 'available'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('priceAsc')
  const [filtersOpen, setFiltersOpen] = useState(false)
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

  const cities = useMemo(() => unique(cars.map(car => car.city)), [cars])
  const fuels = useMemo(() => unique(cars.map(car => car.fuel)), [cars])
  const transmissions = useMemo(() => unique(cars.map(car => car.transmission)), [cars])
  const drives = useMemo(() => unique(cars.map(car => car.drive)), [cars])

  const filtered = useMemo(() => {
    const list = cars.filter(car => {
      if (catFilter && car.cat !== catFilter) return false
      if (cityFilter && car.city !== cityFilter) return false
      if (fuelFilter && car.fuel !== fuelFilter) return false
      if (transmissionFilter && car.transmission !== transmissionFilter) return false
      if (driveFilter && car.drive !== driveFilter) return false
      if ((car.horsepower ?? 0) < minPower) return false
      if (car.price > maxPrice) return false
      if (statusFilter === 'available' && car.status !== 'available') return false
      return true
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price
      if (sortBy === 'priceDesc') return b.price - a.price
      if (sortBy === 'yearDesc') return b.year - a.year
      if (sortBy === 'powerDesc') return (b.horsepower ?? 0) - (a.horsepower ?? 0)
      return a.name.localeCompare(b.name, 'ru')
    })
  }, [cars, catFilter, cityFilter, driveFilter, fuelFilter, maxPrice, minPower, sortBy, statusFilter, transmissionFilter])

  const activeFilters = [catFilter, cityFilter, fuelFilter, transmissionFilter, driveFilter, minPower ? 'power' : '', statusFilter === 'available' ? 'status' : ''].filter(Boolean).length

  const handleBook = (car: Car) => {
    if (!user) { toast('Войдите в аккаунт для бронирования', 'error'); nav('/auth'); return }
    if (car.status === 'busy') { toast('Автомобиль недоступен', 'error'); return }
    setBookingCar(car)
  }

  const resetFilters = () => {
    setCatFilter('')
    setCityFilter('')
    setFuelFilter('')
    setTransmissionFilter('')
    setDriveFilter('')
    setMinPower(0)
    setMaxPrice(10000)
    setStatusFilter('all')
    setSortBy('priceAsc')
    toast('Фильтры сброшены')
  }

  const filters = (
    <div className="catalog-filter-panel">
      <div className="catalog-filter-head">
        <div>
          <div className="font-syne font-bold text-sm">Фильтры</div>
          <div className="text-[11px] text-gray-500">{activeFilters ? `${activeFilters} активно` : 'подберите авто'}</div>
        </div>
        <button type="button" className="catalog-filter-close md:hidden" onClick={() => setFiltersOpen(false)}>×</button>
      </div>

      <label className="catalog-filter-field">
        <span>Город</span>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <option value="">Все города</option>
          {cities.map(city => <option key={city}>{city}</option>)}
        </select>
      </label>

      <div className="catalog-filter-field">
        <span>Категория</span>
        <div className="catalog-chip-list">
          {cats.map(cat => (
            <button key={cat.value} type="button" className={catFilter === cat.value ? 'is-active' : ''} onClick={() => setCatFilter(cat.value)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <label className="catalog-filter-field">
        <span>Топливо</span>
        <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}>
          <option value="">Любое</option>
          {fuels.map(fuel => <option key={fuel}>{fuel}</option>)}
        </select>
      </label>

      <label className="catalog-filter-field">
        <span>Коробка</span>
        <select value={transmissionFilter} onChange={e => setTransmissionFilter(e.target.value)}>
          <option value="">Любая</option>
          {transmissions.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>

      <label className="catalog-filter-field">
        <span>Привод</span>
        <select value={driveFilter} onChange={e => setDriveFilter(e.target.value)}>
          <option value="">Любой</option>
          {drives.map(drive => <option key={drive}>{drive}</option>)}
        </select>
      </label>

      <div className="catalog-filter-field">
        <span>Мощность от {minPower || 'любой'} л.с.</span>
        <input type="range" min={0} max={350} step={25} value={minPower} onChange={e => setMinPower(Number(e.target.value))} />
      </div>

      <div className="catalog-filter-field">
        <span>Цена до {maxPrice.toLocaleString('ru')} ₽/сут</span>
        <input type="range" min={1500} max={12000} step={500} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
      </div>

      <div className="catalog-filter-field">
        <span>Доступность</span>
        <div className="catalog-chip-list">
          {[{ v: 'all', l: 'Все' }, { v: 'available', l: 'Свободные' }].map(item => (
            <button key={item.v} type="button" className={statusFilter === item.v ? 'is-active' : ''} onClick={() => setStatusFilter(item.v as 'all' | 'available')}>
              {item.l}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={resetFilters} className="catalog-reset">Сбросить фильтры</button>
    </div>
  )

  return (
    <div className="catalog-page">
      <div className="catalog-toolbar">
        <div>
          <div className="font-syne font-extrabold text-2xl">Каталог автомобилей</div>
          <div className="text-sm text-gray-500">{filtered.length} автомобилей из {cars.length}</div>
        </div>
        <div className="catalog-toolbar-actions">
          <button type="button" className="catalog-mobile-filter" onClick={() => setFiltersOpen(true)}>
            Фильтры {activeFilters ? `(${activeFilters})` : ''}
          </button>
          <select className="input w-auto text-xs" value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}>
            <option value="priceAsc">Цена ↑</option>
            <option value="priceDesc">Цена ↓</option>
            <option value="yearDesc">Сначала новые</option>
            <option value="powerDesc">Мощнее</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout">
        <aside className={`catalog-aside ${filtersOpen ? 'is-open' : ''}`}>
          {filters}
        </aside>

        <main className="catalog-results">
          {loading && cars.length === 0 ? (
            <div className="catalog-grid">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="catalog-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="catalog-empty">
              <div className="catalog-empty-icon">⌕</div>
              <div className="font-syne font-bold text-lg">Авто не найдено</div>
              <p>Попробуйте убрать часть фильтров или выбрать другой город.</p>
              <button type="button" onClick={resetFilters}>Сбросить фильтры</button>
            </div>
          ) : (
            <div className="catalog-grid">
              {filtered.map((car, index) => (
                <article key={car.id} className="catalog-car-card" onClick={() => nav(`/car/${car.id}`)}>
                  <div className="car-card-photo relative">
                    <CarImage car={car} className="h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                    <span className="catalog-card-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className={`absolute top-2 right-2 badge ${car.status === 'available' ? 'badge-green' : 'badge-red'}`}>
                      {car.status === 'available' ? 'Доступен' : 'Занят'}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-syne font-bold text-sm">{car.name}</div>
                        <div className="text-xs text-gray-500">{car.year} · {car.fuel} · {car.city}</div>
                      </div>
                      <span className="catalog-card-tag">{cats.find(cat => cat.value === car.cat)?.label}</span>
                    </div>
                    <div className="car-specs-mini">
                      <span>{car.horsepower ? `${car.horsepower} л.с.` : 'мощность —'}</span>
                      <span>{car.engineVolume ?? 'объем —'}</span>
                      <span>{car.drive ?? 'привод —'}</span>
                    </div>
                    <div className="catalog-card-footer">
                      <div className="font-syne font-extrabold text-base">
                        {car.price.toLocaleString('ru')} ₽<span>/сут</span>
                      </div>
                      <button
                        type="button"
                        className={car.status === 'available' ? 'catalog-book-btn' : 'catalog-book-btn is-disabled'}
                        onClick={event => { event.stopPropagation(); handleBook(car) }}
                        disabled={car.status === 'busy'}
                      >
                        {car.status === 'available' ? 'Бронировать' : 'Занят'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {filtersOpen && <button className="catalog-filter-backdrop" type="button" onClick={() => setFiltersOpen(false)} aria-label="Закрыть фильтры" />}

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
