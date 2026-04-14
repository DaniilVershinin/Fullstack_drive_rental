import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CAT_NAMES, PENALTY } from '../types'
import BookingModal from '../components/BookingModal'
import { useApp } from '../hooks/useApp'
import { getCarById, getExistingBookings } from '../lib/api'
import { carImage } from '../lib/carImages'
import type { Car } from '../types'

export default function CarDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user, toast } = useApp()
  const [car, setCar] = useState<Car | null>(null)
  const [bookings, setBookings] = useState<{ carId: number; from: string; to: string }[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(in3)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const carId = Number(id)
    setLoading(true)
    Promise.all([getCarById(carId), getExistingBookings(carId)])
      .then(([nextCar, nextBookings]) => {
        setCar(nextCar)
        setBookings(nextBookings)
      })
      .catch(() => toast('Не удалось загрузить автомобиль', 'error'))
      .finally(() => setLoading(false))
  }, [id, toast])

  if (loading) return <div className="p-6 text-center text-gray-500">Загружаем автомобиль...</div>

  if (!car) return (
    <div className="p-6 text-center text-gray-500">
      <div className="text-4xl mb-2">🔎</div>
      <div>Автомобиль не найден</div>
      <button className="mt-4 text-sm text-[#0f3460] underline" onClick={() => nav('/catalog')}>← Назад к каталогу</button>
    </div>
  )

  const conflict = bookings.some(b => b.carId === car.id && !(to <= b.from || from >= b.to))

  const handleBook = () => {
    if (!user) { toast('Войдите для бронирования', 'error'); nav('/auth'); return }
    if (car.status === 'busy') { toast('Автомобиль недоступен', 'error'); return }
    if (conflict) { toast('Автомобиль занят на эти даты', 'error'); return }
    setShowModal(true)
  }

  const specs = [
    ['Категория', CAT_NAMES[car.cat]],
    ['Год выпуска', String(car.year)],
    ['Топливо', car.fuel],
    ['Коробка передач', car.transmission],
    ['Привод', car.drive],
    ['Мощность', car.horsepower ? `${car.horsepower} л.с.` : undefined],
    ['Объем двигателя', car.engineVolume],
    ['Кузов', car.bodyType],
    ['Цвет', car.color],
    ['Багажник', car.trunkVolume ? `${car.trunkVolume} л` : undefined],
    ['Количество мест', String(car.seats)],
    ['Город', car.city],
    ['Штраф за просрочку', `${PENALTY[car.cat].toLocaleString('ru')} ₽/день`],
  ].filter(([, val]) => Boolean(val))

  return (
    <div className="p-4">
      <button className="flex items-center gap-1 text-xs text-gray-500 mb-4 hover:text-gray-700" onClick={() => nav('/catalog')}>
        ← Назад к каталогу
      </button>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
        <div>
          <div className="car-hero-3d mb-4">
            <img src={carImage(car, '1200x800')} alt={car.name} className="h-full w-full object-cover" />
            <div className="car-hero-3d__plate">
              <span>{car.icon}</span>
              <span>{car.city}</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-syne font-bold text-sm mb-3">Характеристики</div>
            <div>
              {specs.map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-medium ${label.includes('Штраф') ? 'text-[#e94560]' : ''}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="font-syne font-extrabold text-2xl mb-1">{car.name}</div>
          <div className="text-sm text-gray-500 mb-4">{CAT_NAMES[car.cat]} · {car.year}</div>

          <div className="card p-4">
            <div className="font-syne font-extrabold text-2xl mb-1">
              {car.price.toLocaleString('ru')} ₽<span className="text-sm font-normal text-gray-500">/сутки</span>
            </div>

            <span className={`badge mb-4 ${car.status === 'available' ? 'badge-green' : 'badge-red'}`}>
              {car.status === 'available' ? '✓ Доступен' : '✕ Занят'}
            </span>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-4 leading-relaxed">
              ⚠ Мин. возраст: 23 года · Стаж: от 2 лет<br />
              Отмена не позднее чем за 24 ч до начала аренды
            </div>

            <div className="mb-3">
              <label className="label">Дата начала</label>
              <input type="date" className="input" value={from} min={today} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="label">Дата окончания</label>
              <input type="date" className="input" value={to} min={from} onChange={e => setTo(e.target.value)} />
            </div>

            {conflict && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-800 mb-3">
                ⛔ Автомобиль уже забронирован на эти даты. Выберите другие.
              </div>
            )}

            {from && to && !conflict && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>{Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000))} дн. × {car.price.toLocaleString('ru')} ₽</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Итого (без услуг)</span>
                  <span>{(car.price * Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000))).toLocaleString('ru')} ₽</span>
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleBook}
              disabled={car.status === 'busy' || conflict}
            >
              {car.status === 'busy' ? 'Автомобиль занят' : 'Забронировать'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <BookingModal
          car={car}
          onClose={() => setShowModal(false)}
          onBooked={() => {}}
        />
      )}
    </div>
  )
}
