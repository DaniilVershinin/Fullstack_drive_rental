import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import { isSupabaseConfigured } from '../lib/supabase'
import { login, register } from '../lib/api'
import type { AuthUser, Role } from '../types'

type DemoAccount = AuthUser & { password: string }

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Алексей Иванов',
    email: 'aleksey@email.com',
    initials: 'АИ',
    dob: '1990-05-15',
    role: 'client',
    password: 'password123',
  },
  {
    name: 'Игорь Смирнов',
    email: 'igor@email.com',
    initials: 'ИС',
    dob: '1988-08-11',
    role: 'manager',
    password: 'manager123',
  },
  {
    name: 'Анна Козлова',
    email: 'anna.admin@email.com',
    initials: 'АК',
    dob: '1987-02-19',
    role: 'admin',
    password: 'admin123',
  },
]

function roleLabel(role: Role) {
  return role === 'client' ? 'Клиент' : role === 'manager' ? 'Менеджер' : 'Админ'
}

export default function AuthPage() {
  const { setUser, toast, rotateCsrf } = useApp()
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'reg'>('login')

  const [email, setEmail] = useState(isSupabaseConfigured ? '' : 'aleksey@email.com')
  const [pass, setPass] = useState(isSupabaseConfigured ? '' : 'password123')

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [dl, setDl] = useState('')
  const [regPass, setRegPass] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalErr, setGlobalErr] = useState('')

  const doLogin = async () => {
    if (!email || !pass) { setGlobalErr('Заполните все поля'); return }
    try {
      const account = isSupabaseConfigured
        ? await login(email, pass)
        : DEMO_ACCOUNTS.find(acc => acc.email.toLowerCase() === email.toLowerCase().trim() && acc.password === pass)
      if (!account) { setGlobalErr('Неверный email или пароль'); return }

      rotateCsrf()
      setUser(account)
      toast(`Добро пожаловать, ${account.name.split(' ')[0]}! Роль: ${roleLabel(account.role)}`)
      nav(account.role === 'manager' ? '/manager' : account.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : 'Не удалось войти')
    }
  }

  const doRegister = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Введите имя'
    if (!regEmail || !regEmail.includes('@')) errs.email = 'Некорректный email'
    if (regPass.length < 8) errs.pass = 'Минимум 8 символов'
    if (!dob) { errs.dob = 'Укажите дату рождения' }
    else {
      const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
      if (age < 23) errs.dob = 'Минимальный возраст - 23 года'
    }
    if (!dl.trim()) errs.dl = 'Укажите номер удостоверения'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      const initials = (name[0] || '?').toUpperCase() + (surname[0] || '?').toUpperCase()
      const account = isSupabaseConfigured
        ? await register({ email: regEmail, password: regPass, name, surname, dob, phone, dl })
        : { name: `${name} ${surname}`.trim(), email: regEmail, initials, dob, role: 'client' as const }
      rotateCsrf()
      setUser(account)
      toast(`Аккаунт создан! Письмо отправлено на ${regEmail}`)
      nav('/')
    } catch (error) {
      setGlobalErr(error instanceof Error ? error.message : 'Не удалось создать аккаунт')
    }
  }

  return (
    <div className="min-h-[calc(100vh-48px)] auth-screen p-4">
      <div className="auth-shell">
        <div className="hidden md:block auth-side">
          <div className="auth-side__copy">
            <p className="text-xs uppercase text-white/50 mb-3">DriveGO ID</p>
            <h1 className="font-syne font-extrabold text-4xl leading-tight text-white mb-3">Личный доступ к аренде</h1>
            <p className="text-sm text-white/70 leading-relaxed">Заказы, оплата и роли берутся из Supabase Auth и базы проекта.</p>
          </div>
          <div className="auth-car-3d">
            <div className="auth-car-3d__body" />
            <div className="auth-car-3d__shine" />
          </div>
        </div>

        <div className="auth-panel">
          <div className="font-syne font-extrabold text-xl text-[#1a1a2e] text-center mb-1">
            DRIVE<span className="text-[#e94560]">GO</span>
          </div>
          <p className="text-center text-xs text-gray-500 mb-5">Система аренды автомобилей</p>

          {isSupabaseConfigured && (
            <div className="rounded-lg border border-[#0f3460]/15 bg-[#0f3460]/5 p-3 mb-4 text-xs text-[#0f3460] leading-relaxed">
              Введите email и пароль пользователя из Supabase. Для менеджера и админа проверьте `profiles.role`.
            </div>
          )}

          <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-5 bg-gray-50 p-1">
            <button onClick={() => { setMode('login'); setGlobalErr('') }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}>Войти</button>
            <button onClick={() => { setMode('reg'); setGlobalErr('') }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'reg' ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}>Регистрация</button>
          </div>

          {globalErr && <div className="bg-red-50 text-red-800 text-xs rounded-lg p-2.5 mb-3 border border-red-100">{globalErr}</div>}

          {mode === 'login' ? (
            <div>
              <div className="mb-3">
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="label">Пароль</label>
                <input className="input" type="password" placeholder="Введите пароль" value={pass} onChange={e => setPass(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={doLogin}>Войти</button>
              {!isSupabaseConfigured && (
                <div className="text-center text-xs text-gray-400 mt-3 space-y-1">
                  <p>Демо-аккаунты: клиент `aleksey@email.com`, менеджер `igor@email.com`, админ `anna.admin@email.com`</p>
                  <p>Пароли: `password123`, `manager123`, `admin123`</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="label">Имя *</label>
                  <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="Иван" value={name} onChange={e => setName(e.target.value)} />
                  {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="label">Фамилия</label>
                  <input className="input" placeholder="Иванов" value={surname} onChange={e => setSurname(e.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <label className="label">Email *</label>
                <input className={`input ${errors.email ? 'border-red-400' : ''}`} type="email" placeholder="email@mail.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
              </div>
              <div className="mb-3">
                <label className="label">Телефон</label>
                <input className="input" type="tel" placeholder="+7 (___) ___-__-__" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="label">Дата рождения * (мин. 23 года)</label>
                <input className={`input date-field ${errors.dob ? 'border-red-400' : ''}`} type="date" value={dob} onChange={e => setDob(e.target.value)} />
                {errors.dob && <p className="text-red-500 text-[10px] mt-1">{errors.dob}</p>}
              </div>
              <div className="mb-3">
                <label className="label">Вод. удостоверение *</label>
                <input className={`input ${errors.dl ? 'border-red-400' : ''}`} placeholder="77 22 456789" value={dl} onChange={e => setDl(e.target.value)} />
                {errors.dl && <p className="text-red-500 text-[10px] mt-1">{errors.dl}</p>}
              </div>
              <div className="mb-5">
                <label className="label">Пароль * (мин. 8 символов)</label>
                <input className={`input ${errors.pass ? 'border-red-400' : ''}`} type="password" placeholder="Минимум 8 символов" value={regPass} onChange={e => setRegPass(e.target.value)} />
                {errors.pass && <p className="text-red-500 text-[10px] mt-1">{errors.pass}</p>}
              </div>
              <button className="btn-primary" onClick={doRegister}>Создать аккаунт</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
