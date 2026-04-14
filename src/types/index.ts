export type Role = 'client' | 'manager' | 'admin'
export type CarStatus = 'available' | 'busy'
export type OrderStatus = 'pending' | 'active' | 'done' | 'cancelled'
export type CarCategory = 'economy' | 'comfort' | 'business' | 'suv'

export interface Car {
  id: number
  name: string
  year: number
  cat: CarCategory
  price: number
  status: CarStatus
  icon: string
  fuel: string
  transmission: string
  seats: number
  city: string
  drive?: string
  horsepower?: number
  engineVolume?: string
  bodyType?: string
  color?: string
  trunkVolume?: number
}

export interface Extra {
  id: string
  name: string
  price: number
}

export interface Order {
  id: string
  carId: number
  car: string
  icon: string
  from: string
  to: string
  status: OrderStatus
  total: number
  overdueDays: number
  point: string
  extras: string[]
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  orders: number
}

export interface AuthUser {
  id?: string
  name: string
  email: string
  initials: string
  dob: string
  role: Role
}

export const PENALTY: Record<CarCategory, number> = {
  economy: 500,
  comfort: 800,
  business: 1500,
  suv: 1200,
}

export const CAT_NAMES: Record<CarCategory, string> = {
  economy: 'Эконом',
  comfort: 'Комфорт',
  business: 'Бизнес',
  suv: 'Внедорожник',
}
