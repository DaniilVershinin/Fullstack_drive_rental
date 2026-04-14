import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const nav = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

  const [city, setCity] = useState('Москва')
  const [cat, setCat] = useState('')
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(in3)

  const search = () => nav(`/catalog?city=${city}&cat=${cat}&from=${from}&to=${to}`)

  return (
    <div>
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] px-4 pt-8 pb-6 relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-[#e94560] opacity-[0.06]" />
        <h1 className="font-syne font-extrabold text-3xl text-white leading-tight mb-1">
          Аренда авто<br />за <span className="text-[#e94560]">5 минут</span>
        </h1>
        <p className="text-white/60 text-sm mb-5">Онлайн-бронирование без звонков и очередей</p>

        <div className="bg-white rounded-2xl p-4 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-2 md:items-end">
          <div>
            <label className="label">Город</label>
            <select className="input" value={city} onChange={e => setCity(e.target.value)}>
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
          <div>
            <label className="label">Категория</label>
            <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Любая</option>
              <option value="economy">Эконом</option>
              <option value="comfort">Комфорт</option>
              <option value="business">Бизнес</option>
              <option value="suv">Внедорожник</option>
            </select>
          </div>
          <div>
            <label className="label">Дата начала</label>
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Дата окончания</label>
            <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button
            onClick={search}
            className="bg-[#e94560] text-white font-semibold rounded-xl px-4 h-9 text-sm hover:opacity-90 transition-opacity col-span-2 md:col-span-1"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Найти →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-gray-200 rounded-xl overflow-hidden mx-4 mt-4">
        {[['247', 'Автомобилей'], ['12', 'Городов'], ['4.9★', 'Рейтинг'], ['24/7', 'Поддержка']].map(([n, l]) => (
          <div key={l} className="bg-white py-3 text-center">
            <div className="font-syne font-extrabold text-xl text-[#e94560]">{n}</div>
            <div className="text-xs text-gray-500 mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <div className="px-4 mt-8 mb-4">
        <h2 className="font-syne font-bold text-xl mb-4">Почему DriveGO?</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: '⚡', title: 'Быстро', text: 'Оформите аренду за 5 минут, без звонков и очередей' },
            { icon: '🔒', title: 'Безопасно', text: 'Защита платежей TLS 1.3, авторизация через Supabase Auth' },
            { icon: '🚗', title: 'Большой выбор', text: '247 автомобилей в 12 городах — от эконома до бизнеса' },
          ].map(f => (
            <div key={f.title} className="card p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm mb-1">{f.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
