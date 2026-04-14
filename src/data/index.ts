import type { Car, Extra, Order, User } from '../types'

export const CARS: Car[] = [
  { id: 1, name: 'Kia Rio', year: 2022, cat: 'economy', price: 1800, status: 'available', icon: '🚗', fuel: 'Бензин', transmission: 'Механика', seats: 5, city: 'Москва' },
  { id: 2, name: 'Toyota Camry', year: 2023, cat: 'comfort', price: 3500, status: 'available', icon: '🚙', fuel: 'Гибрид', transmission: 'Автомат', seats: 5, city: 'Москва' },
  { id: 3, name: 'BMW 5 Series', year: 2023, cat: 'business', price: 7500, status: 'busy', icon: '🏎️', fuel: 'Бензин', transmission: 'Автомат', seats: 5, city: 'Санкт-Петербург' },
  { id: 4, name: 'Toyota RAV4', year: 2022, cat: 'suv', price: 4200, status: 'available', icon: '🚐', fuel: 'Бензин', transmission: 'Автомат', seats: 5, city: 'Москва' },
  { id: 5, name: 'Hyundai Solaris', year: 2023, cat: 'economy', price: 1600, status: 'available', icon: '🚗', fuel: 'Бензин', transmission: 'Механика', seats: 5, city: 'Казань' },
  { id: 6, name: 'Mercedes E-Class', year: 2023, cat: 'business', price: 9000, status: 'available', icon: '🏎️', fuel: 'Дизель', transmission: 'Автомат', seats: 5, city: 'Санкт-Петербург' },
  { id: 7, name: 'VW Tiguan', year: 2022, cat: 'suv', price: 5200, status: 'busy', icon: '🚐', fuel: 'Бензин', transmission: 'Автомат', seats: 7, city: 'Новосибирск' },
  { id: 8, name: 'Skoda Octavia', year: 2023, cat: 'comfort', price: 2800, status: 'available', icon: '🚙', fuel: 'Дизель', transmission: 'Автомат', seats: 5, city: 'Москва' },
]

export const EXTRAS: Extra[] = [
  { id: 'gps', name: 'GPS навигатор', price: 200 },
  { id: 'child', name: 'Детское кресло', price: 300 },
  { id: 'insurance', name: 'Полная страховка', price: 500 },
  { id: 'wifi', name: 'Wi-Fi роутер', price: 150 },
]

export const MY_ORDERS: Order[] = [
  { id: 'DR-2047', carId: 2, car: 'Toyota Camry', icon: '🚙', from: '2026-04-05', to: '2026-04-08', status: 'active', total: 10500, overdueDays: 0, point: 'Москва — Центр', extras: ['gps'] },
  { id: 'DR-1983', carId: 1, car: 'Kia Rio', icon: '🚗', from: '2026-03-20', to: '2026-03-23', status: 'done', total: 5400, overdueDays: 0, point: 'Москва — Аэропорт', extras: [] },
  { id: 'DR-2051', carId: 4, car: 'Toyota RAV4', icon: '🚐', from: '2026-04-10', to: '2026-04-15', status: 'pending', total: 21000, overdueDays: 0, point: 'Москва — Центр', extras: ['insurance', 'gps'] },
  { id: 'DR-2040', carId: 6, car: 'Mercedes E-Class', icon: '🏎️', from: '2026-03-28', to: '2026-04-02', status: 'done', total: 45000, overdueDays: 4, point: 'СПб — Невский', extras: ['insurance'] },
]

export interface ManagerOrder { id: string; client: string; car: string; dates: string; total: number; status: string; overdueDays: number; }
export const ALL_ORDERS: ManagerOrder[] = [
  { id: 'DR-2051', client: 'Алексей И.', car: 'Toyota RAV4', dates: '10–15 апр', total: 21000, status: 'pending', overdueDays: 0 },
  { id: 'DR-2047', client: 'Мария П.', car: 'Toyota Camry', dates: '05–08 апр', total: 10500, status: 'active', overdueDays: 0 },
  { id: 'DR-2044', client: 'Игорь С.', car: 'Kia Rio', dates: '01–03 апр', total: 3600, status: 'done', overdueDays: 0 },
  { id: 'DR-2048', client: 'Анна К.', car: 'Toyota RAV4', dates: '06–09 апр', total: 12600, status: 'pending', overdueDays: 0 },
  { id: 'DR-2050', client: 'Дмитрий В.', car: 'Skoda Octavia', dates: '07–10 апр', total: 8400, status: 'active', overdueDays: 3 },
]

export const USERS: User[] = [
  { id: '#001', name: 'Алексей Иванов', email: 'aleksey@email.com', role: 'Клиент', orders: 4 },
  { id: '#002', name: 'Мария Петрова', email: 'maria@email.com', role: 'Клиент', orders: 12 },
  { id: '#003', name: 'Игорь Смирнов', email: 'igor@email.com', role: 'Менеджер', orders: 0 },
  { id: '#004', name: 'Анна Козлова', email: 'anna@email.com', role: 'Клиент', orders: 3 },
]

export const EXISTING_BOOKINGS = [
  { carId: 1, from: '2026-04-07', to: '2026-04-09' },
  { carId: 2, from: '2026-04-05', to: '2026-04-08' },
]

export const PICKUP_POINTS = [
  'Москва — Центр (Тверская, 15)',
  'Москва — Аэропорт (Шереметьево)',
  'Санкт-Петербург — Невский пр-т, 40',
  'Казань — ул. Баумана, 12',
]
