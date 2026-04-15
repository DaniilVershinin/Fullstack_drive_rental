import { useState, useEffect } from 'react'
import { EXTRAS, EXISTING_BOOKINGS, PICKUP_POINTS } from '../data'
import type { Car } from '../types'
import { useApp } from '../hooks/useApp'
import { createBooking, getExistingBookings, getExtras, getPickupPoints } from '../lib/api'
import CarImage from './CarImage'

interface Props { car: Car; onClose: () => void; onBooked: () => void }

function daysCount(from: string, to: string) {
  return Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000))
}

function formatCard(v: string) {
  return v.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

export default function BookingModal({ car, onClose, onBooked }: Props) {
  const { user, toast, csrfToken } = useApp()
  const today = new Date().toISOString().split('T')[0]
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

  const [step, setStep] = useState(1)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(in3)
  const [point, setPoint] = useState(PICKUP_POINTS[0])
  const [returnPoint, setReturnPoint] = useState('Тот же пункт')
  const [points, setPoints] = useState(PICKUP_POINTS)
  const [extras, setExtras] = useState(EXTRAS)
  const [bookings, setBookings] = useState(EXISTING_BOOKINGS)
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [payMethod, setPayMethod] = useState('card')
  const [cardNum, setCardNum] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [conflict, setConflict] = useState(false)
  const [done, setDone] = useState(false)
  const [ref] = useState(`DR-${2052 + Math.floor(Math.random() * 20)}`)

  const applyPreset = (days: number) => {
    const nextFrom = new Date()
    const nextTo = new Date(Date.now() + days * 86400000)
    setFrom(nextFrom.toISOString().split('T')[0])
    setTo(nextTo.toISOString().split('T')[0])
  }

  useEffect(() => {
    Promise.all([getExtras(), getPickupPoints(), getExistingBookings(car.id)])
      .then(([nextExtras, nextPoints, nextBookings]) => {
        setExtras(nextExtras)
        setPoints(nextPoints)
        setPoint(nextPoints[0] ?? '')
        setBookings(nextBookings)
      })
      .catch(() => toast('Не удалось загрузить данные бронирования', 'error'))
  }, [car.id, toast])

  useEffect(() => {
    setConflict(bookings.some(b => b.carId === car.id && !(to <= b.from || from >= b.to)))
  }, [bookings, from, to, car.id])

  const days = daysCount(from, to)
  const extraTotal = selectedExtras.reduce((s, id) => s + (extras.find(e => e.id === id)?.price ?? 0), 0)
  const total = (car.price + extraTotal) * days

  const toggleExtra = (id: string) => {
    setSelectedExtras(p => p.includes(id) ? p.filter(e => e !== id) : [...p, id])
  }

  const goStep2 = () => {
    if (!from || !to) { toast('Укажите даты аренды', 'error'); return }
    if (new Date(to) <= new Date(from)) { toast('Дата окончания должна быть позже начала', 'error'); return }
    if (conflict) { toast('Двойное бронирование! Выберите другие даты', 'error'); return }
    setStep(2)
  }

  const confirmBooking = async () => {
    if (payMethod === 'card') {
      if (cardNum.replace(/\s/g, '').length < 16) { toast('Некорректный номер карты', 'error'); return }
      if (cardExp.length < 5) { toast('Укажите срок действия карты', 'error'); return }
      if (cardCvv.length < 3) { toast('Укажите CVV', 'error'); return }
      if (!cardName.trim()) { toast('Введите имя на карте', 'error'); return }
    }
    try {
      const orderId = await createBooking(
        {
          userId: user?.id,
          car,
          from,
          to,
          total,
          extras: selectedExtras,
          pickupPoint: point,
          returnPoint,
          paymentMethod: payMethod,
        },
        { csrfToken },
      )
      setDone(true)
      setStep(4)
      toast('Заказ оформлен! Подтверждение отправлено на email', 'success')
      onBooked()
      if (orderId) {
        // Keep the generated reference only for unconfigured demo mode.
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось оформить заказ', 'error')
    }
  }

  const stepDots = [1, 2, 3]

  return (
    <div className="modal-backdrop">
      <div className="booking-dialog">
        <div className="flex items-start justify-between mb-3">
          <div className="font-syne font-bold text-base">{car.name} · Бронирование</div>
          <button onClick={onClose} className="bg-gray-100 rounded-lg w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
        </div>

        {!done && (
          <>
            <div className="flex gap-1.5 mb-2">
              {stepDots.map(s => (
                <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-4">
              {['1. Параметры', '2. Услуги', '3. Оплата'].map((l, i) => (
                <span key={l} className={step === i + 1 ? 'text-[#e94560] font-semibold' : ''}>{l}</span>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <div>
            <div className="booking-car-strip">
              <CarImage car={car} className="h-20 w-28 rounded-lg" />
              <div>
                <div className="font-semibold text-sm">{car.name} {car.year}</div>
                <div className="text-xs text-gray-500">{car.fuel} · {car.transmission}</div>
                <div className="text-sm font-bold text-[#0f3460]">{car.price.toLocaleString('ru')} ₽/сут</div>
              </div>
            </div>

            {conflict && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 mb-3">
                ⛔ Автомобиль уже забронирован на эти даты. Выберите другие.
              </div>
            )}

            <div className="date-popover mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">Даты аренды</div>
                  <div className="text-xs text-gray-500">{days} дн. · {total.toLocaleString('ru')} ₽</div>
                </div>
                <div className="flex gap-1">
                  {[2, 3, 7].map(preset => (
                    <button key={preset} type="button" className="date-preset" onClick={() => applyPreset(preset)}>
                      {preset} дн.
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Дата начала *</label>
                <input type="date" className="input date-field" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">Дата окончания *</label>
                <input type="date" className="input date-field" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="label">Пункт выдачи</label>
              <select className="input" value={point} onChange={e => setPoint(e.target.value)}>
                {points.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="label">Пункт возврата</label>
              <select className="input" value={returnPoint} onChange={e => setReturnPoint(e.target.value)}>
                <option>Тот же пункт</option>
                {points.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <button className="btn-primary" onClick={goStep2} disabled={conflict}>
              Выбрать доп. услуги →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Выберите дополнительные услуги ({days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}):</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {extras.map(e => (
                <div
                  key={e.id}
                  onClick={() => toggleExtra(e.id)}
                  className={`border-2 rounded-xl p-2.5 cursor-pointer transition-all ${selectedExtras.includes(e.id) ? 'border-[#0f3460] bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="text-xs font-semibold">{e.name}</div>
                  <div className="text-xs text-gray-500">+{e.price} ₽/сут</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Аренда ({days} дн. × {car.price.toLocaleString('ru')} ₽)</span>
                <span>{(car.price * days).toLocaleString('ru')} ₽</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Доп. услуги ({days} дн.)</span>
                <span>{(extraTotal * days).toLocaleString('ru')} ₽</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                <span>Итого</span>
                <span>{total.toLocaleString('ru')} ₽</span>
              </div>
            </div>

            <button className="btn-primary mb-2" onClick={() => setStep(3)}>К оплате →</button>
            <button className="btn-secondary" onClick={() => setStep(1)}>Назад</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{car.name}, {days} дн.</span>
                <span>{(car.price * days).toLocaleString('ru')} ₽</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                <span>К оплате</span>
                <span>{total.toLocaleString('ru')} ₽</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="label">Способ оплаты</label>
              <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="card">Банковская карта</option>
                <option value="sbp">СБП</option>
                <option value="cash">При получении</option>
              </select>
            </div>

            {payMethod === 'card' && (
              <>
                <div className="mb-3 relative">
                  <label className="label">Номер карты</label>
                  <input className="input" placeholder="0000 0000 0000 0000" maxLength={19}
                    value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} />
                  <span className="absolute right-3 top-8 text-lg">💳</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="label">Срок действия</label>
                    <input className="input" placeholder="MM/YY" maxLength={5} value={cardExp}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').substring(0, 4)
                        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
                        setCardExp(v)
                      }} />
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input className="input" placeholder="•••" maxLength={3} type="password"
                      value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="label">Имя на карте</label>
                  <input className="input" placeholder="IVAN IVANOV" value={cardName}
                    onChange={e => setCardName(e.target.value.toUpperCase())} />
                </div>
              </>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
              🔒 Платёж защищён TLS 1.3 · Supabase Auth
            </div>

            <button className="btn-primary mb-2" onClick={confirmBooking}>
              Оплатить {total.toLocaleString('ru')} ₽
            </button>
            <button className="btn-secondary" onClick={() => setStep(2)}>Назад</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
            <div className="font-syne font-bold text-lg mb-2">Бронирование подтверждено!</div>
            <div className="bg-gray-50 rounded-xl py-2 px-4 my-3 font-syne font-bold text-lg tracking-widest text-[#0f3460]">{ref}</div>
            <div className="bg-blue-50 rounded-xl p-2.5 text-xs text-blue-800 flex items-center gap-2 mb-3">
              📧 Подтверждение отправлено на {user?.email}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Возьмите паспорт и водительское удостоверение.<br />Отмена возможна за 24 ч до начала аренды.</p>
            <button className="btn-primary mt-4" onClick={onClose}>Отлично!</button>
          </div>
        )}
      </div>
    </div>
  )
}
