import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Воронеж', 'Белгород', 'Старый Оскол', 'Липецк', 'Елец', 'Борисоглебск', 'Россошь']

const CATEGORIES = [
  { value: '', label: 'Любая', note: 'все классы' },
  { value: 'economy', label: 'Эконом', note: 'от 1 500 ₽' },
  { value: 'comfort', label: 'Комфорт', note: 'универсально' },
  { value: 'business', label: 'Бизнес', note: 'премиум' },
  { value: 'suv', label: 'SUV', note: 'кроссоверы' },
]

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
      <section className="home-hero">
        <div className="home-hero__content">
          <div className="home-copy">
            <p className="home-kicker">Онлайн-аренда без звонков</p>
            <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white leading-tight mb-3">
              Авто на нужные даты за пару кликов
              <span className="sr-only">Аренда авто</span>
            </h1>
            <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-xl">
              Выберите город, класс машины и даты поездки. Каталог покажет доступные варианты из Supabase.
            </p>
          </div>

          <div className="home-search-panel">
            <div className="home-field home-field--wide">
              <span className="home-field__label">Город</span>
              <select value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(item => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="home-category-grid">
              {CATEGORIES.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCat(item.value)}
                  className={`home-category ${cat === item.value ? 'is-active' : ''}`}
                >
                  <span>{item.label}</span>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>

            <div className="home-dates">
              <label className="home-field">
                <span className="home-field__label">Начало</span>
                <input type="date" value={from} min={today} onChange={e => setFrom(e.target.value)} />
              </label>
              <label className="home-field">
                <span className="home-field__label">Возврат</span>
                <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} />
              </label>
              <button onClick={search} className="home-search-button">
                Найти авто
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="home-stats">
        {[['247', 'Автомобилей'], ['12', 'Городов'], ['4.9', 'Рейтинг'], ['24/7', 'Поддержка']].map(([n, l]) => (
          <div key={l}>
            <div className="font-syne font-extrabold text-xl text-[#e94560]">{n}</div>
            <div className="text-xs text-gray-500 mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <div className="px-4 mt-8 mb-4">
        <h2 className="font-syne font-bold text-xl mb-4">Почему DriveGO?</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: '01', title: 'Быстро', text: 'Оформите аренду за 5 минут, без звонков и очередей' },
            { icon: '02', title: 'Безопасно', text: 'Роли, заказы и оплата связаны с Supabase Auth и RLS' },
            { icon: '03', title: 'Большой выбор', text: 'Города центральной России, разные классы и подробные характеристики' },
          ].map(f => (
            <div key={f.title} className="card p-4">
              <div className="home-feature-num mb-2">{f.icon}</div>
              <div className="font-semibold text-sm mb-1">{f.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
