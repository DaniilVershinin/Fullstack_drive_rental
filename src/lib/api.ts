import { supabase, isSupabaseConfigured } from './supabase'
import { ALL_ORDERS, CARS, EXTRAS, EXISTING_BOOKINGS, MY_ORDERS, PICKUP_POINTS, USERS } from '../data'
import type { AuthUser, Car, CarCategory, CarStatus, Extra, Order, OrderStatus, PickupPoint, Role, User } from '../types'

type CarRow = {
  id: number
  name: string
  year: number | null
  category: CarCategory
  price_per_day: number | null
  status: CarStatus | null
  icon: string | null
  fuel: string | null
  transmission: string | null
  seats: number | null
  city: string | null
  drive: string | null
  horsepower: number | null
  engine_volume: string | null
  body_type: string | null
  color: string | null
  trunk_volume: number | null
  photo_url: string | null
}

type ExtraRow = { id: string; name: string | null; price_per_day: number | null }
type PickupPointRow = { id: number; name: string | null; address: string | null; city: string | null; hours?: string | null; phone?: string | null }

type OrderRow = {
  id: string
  car_id: number
  date_from: string
  date_to: string
  total_price: number | null
  status: OrderStatus | null
  extras: string[] | null
  pickup_point?: { name: string | null; city: string | null } | null
  cars?: Pick<CarRow, 'id' | 'name' | 'icon' | 'category'> | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  role: Role | null
  dob: string | null
  phone?: string | null
  driver_license?: string | null
  orders_count?: number | null
}

function mapCar(row: CarRow): Car {
  return {
    id: row.id,
    name: row.name,
    year: row.year ?? new Date().getFullYear(),
    cat: row.category,
    price: row.price_per_day ?? 0,
    status: row.status ?? 'available',
    icon: row.icon ?? '🚗',
    fuel: row.fuel ?? '',
    transmission: row.transmission ?? '',
    seats: row.seats ?? 5,
    city: row.city ?? '',
    drive: row.drive ?? undefined,
    horsepower: row.horsepower ?? undefined,
    engineVolume: row.engine_volume ?? undefined,
    bodyType: row.body_type ?? undefined,
    color: row.color ?? undefined,
    trunkVolume: row.trunk_volume ?? undefined,
    photoUrl: row.photo_url ?? undefined,
  }
}

function carToRow(car: Partial<Car>) {
  return {
    name: car.name,
    year: car.year,
    category: car.cat,
    price_per_day: car.price,
    status: car.status,
    icon: car.icon,
    fuel: car.fuel,
    transmission: car.transmission,
    seats: car.seats,
    city: car.city,
    drive: car.drive,
    horsepower: car.horsepower,
    engine_volume: car.engineVolume,
    body_type: car.bodyType,
    color: car.color,
    trunk_volume: car.trunkVolume,
    photo_url: car.photoUrl,
  }
}

function mapPickupPoint(row: PickupPointRow): PickupPoint {
  return {
    id: row.id,
    name: row.name ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    hours: row.hours ?? '09:00-20:00',
    phone: row.phone ?? undefined,
  }
}

function mapOrder(row: OrderRow): Order {
  const car = row.cars
  const status = effectiveOrderStatus(row.status, row.date_from, row.date_to)
  return {
    id: row.id,
    carId: row.car_id,
    car: car?.name ?? `Автомобиль #${row.car_id}`,
    icon: car?.icon ?? '🚗',
    from: row.date_from,
    to: row.date_to,
    status,
    total: row.total_price ?? 0,
    overdueDays: status === 'active' && row.date_to < new Date().toISOString().split('T')[0]
      ? Math.ceil((Date.now() - new Date(row.date_to).getTime()) / 86400000)
      : 0,
    point: row.pickup_point?.name ?? row.pickup_point?.city ?? '',
    extras: row.extras ?? [],
  }
}

function effectiveOrderStatus(status: OrderStatus | null, from: string, to: string): OrderStatus {
  const value = status ?? 'pending'
  if (value === 'done' || value === 'cancelled') return value
  const today = new Date().toISOString().split('T')[0]
  if (from > today) return 'pending'
  if (from <= today && to >= today && value !== 'pending') return 'active'
  return value
}

function profileToUser(profile: ProfileRow): User {
  return {
    id: profile.id.slice(0, 8),
    name: profile.full_name ?? 'Без имени',
    email: profile.email ?? '',
    role: profile.role === 'manager' ? 'Менеджер' : profile.role === 'admin' ? 'Админ' : 'Клиент',
    orders: profile.orders_count ?? 0,
  }
}

function assertConfigured() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
}

export async function getCars(filters?: { city?: string; cat?: string }) {
  if (!isSupabaseConfigured) {
    return CARS.filter(car => (!filters?.city || car.city === filters.city) && (!filters?.cat || car.cat === filters.cat))
  }

  let query = supabase.from('cars').select('*').order('id')
  if (filters?.city) query = query.eq('city', filters.city)
  if (filters?.cat) query = query.eq('category', filters.cat)

  const { data, error } = await query
  if (error) throw error
  return (data as CarRow[]).map(mapCar)
}

export async function getCarById(id: number) {
  if (!isSupabaseConfigured) return CARS.find(car => car.id === id) ?? null

  const { data, error } = await supabase.from('cars').select('*').eq('id', id).single()
  if (error) throw error
  return mapCar(data as CarRow)
}

export async function getExtras() {
  if (!isSupabaseConfigured) return EXTRAS

  const { data, error } = await supabase.from('extras').select('*').order('name')
  if (error) throw error
  return (data as ExtraRow[]).map((row): Extra => ({
    id: row.id,
    name: row.name ?? row.id,
    price: row.price_per_day ?? 0,
  }))
}

export async function getPickupPoints() {
  if (!isSupabaseConfigured) return PICKUP_POINTS

  const { data, error } = await supabase.from('pickup_points').select('*').order('city').order('name')
  if (error) throw error
  return (data as PickupPointRow[]).map(point => `${point.city ?? ''} — ${point.name ?? ''}${point.address ? ` (${point.address})` : ''}`)
}

export async function getPickupPointRows(): Promise<PickupPoint[]> {
  if (!isSupabaseConfigured) {
    return PICKUP_POINTS.map((point, index) => {
      const [city = '', rest = ''] = point.split(' — ')
      const name = rest.replace(/\s*\(.+\)\s*$/, '')
      const address = rest.match(/\((.+)\)/)?.[1] ?? name
      return { id: index + 1, city, name, address, hours: index === 1 ? '24/7' : '09:00-20:00' }
    })
  }

  const { data, error } = await supabase.from('pickup_points').select('*').order('city').order('name')
  if (error) throw error
  return (data as PickupPointRow[]).map(mapPickupPoint)
}

export async function savePickupPoint(point: Partial<PickupPoint>): Promise<PickupPoint> {
  const payload = {
    name: point.name,
    address: point.address,
    city: point.city,
    hours: point.hours ?? '09:00-20:00',
    phone: point.phone,
  }

  if (!isSupabaseConfigured) {
    return { id: point.id ?? Date.now(), name: payload.name ?? '', address: payload.address ?? '', city: payload.city ?? '', hours: payload.hours, phone: payload.phone }
  }

  const query = point.id
    ? supabase.from('pickup_points').update(payload).eq('id', point.id).select().single()
    : supabase.from('pickup_points').insert(payload).select().single()
  const { data, error } = await query
  if (error) throw error
  return mapPickupPoint(data as PickupPointRow)
}

export async function saveCar(car: Partial<Car>): Promise<Car> {
  const payload = carToRow(car)
  if (!isSupabaseConfigured) {
    return {
      id: car.id ?? Date.now(),
      name: car.name ?? 'Новый автомобиль',
      year: car.year ?? new Date().getFullYear(),
      cat: car.cat ?? 'economy',
      price: car.price ?? 0,
      status: car.status ?? 'available',
      icon: car.icon ?? '🚗',
      fuel: car.fuel ?? 'Бензин',
      transmission: car.transmission ?? 'Автомат',
      seats: car.seats ?? 5,
      city: car.city ?? '',
      drive: car.drive,
      horsepower: car.horsepower,
      engineVolume: car.engineVolume,
      bodyType: car.bodyType,
      color: car.color,
      trunkVolume: car.trunkVolume,
      photoUrl: car.photoUrl,
    }
  }

  const query = car.id
    ? supabase.from('cars').update(payload).eq('id', car.id).select().single()
    : supabase.from('cars').insert(payload).select().single()
  const { data, error } = await query
  if (error) throw error
  return mapCar(data as CarRow)
}

export async function updateCarStatus(carId: number, status: CarStatus) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('cars').update({ status }).eq('id', carId)
  if (error) throw error
}

export async function getExistingBookings(carId?: number) {
  if (!isSupabaseConfigured) return carId ? EXISTING_BOOKINGS.filter(booking => booking.carId === carId) : EXISTING_BOOKINGS

  let query = supabase.from('orders').select('car_id, date_from, date_to').in('status', ['pending', 'active'])
  if (carId) query = query.eq('car_id', carId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(row => ({
    carId: Number(row.car_id),
    from: String(row.date_from),
    to: String(row.date_to),
  }))
}

export async function getMyOrders(userId?: string) {
  if (!isSupabaseConfigured || !userId) return MY_ORDERS

  const { data, error } = await supabase
    .from('orders')
    .select('*, cars(id, name, icon, category), pickup_point:pickup_points!orders_pickup_point_id_fkey(name, city)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as OrderRow[]).map(mapOrder)
}

export async function getAllOrders() {
  if (!isSupabaseConfigured) {
    return ALL_ORDERS
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, cars(id, name, icon, category), profiles(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const status = effectiveOrderStatus(row.status, row.date_from, row.date_to)
    return {
      id: row.id,
      client: row.profiles?.full_name ?? 'Клиент',
      car: row.cars?.name ?? `Автомобиль #${row.car_id}`,
      dates: `${row.date_from} — ${row.date_to}`,
      total: row.total_price ?? 0,
      status,
      overdueDays: status === 'active' && row.date_to < new Date().toISOString().split('T')[0]
        ? Math.ceil((Date.now() - new Date(row.date_to).getTime()) / 86400000)
        : 0,
    }
  })
}

export async function createBooking(input: {
  userId?: string
  car: Car
  from: string
  to: string
  total: number
  extras: string[]
  pickupPoint: string
  returnPoint: string
  paymentMethod: string
}) {
  if (!isSupabaseConfigured) return `DR-${Math.floor(2000 + Math.random() * 1000)}`

  const pointId = await findPickupPointId(input.pickupPoint)
  const returnPointId = input.returnPoint === 'Тот же пункт' ? pointId : await findPickupPointId(input.returnPoint)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      car_id: input.car.id,
      pickup_point_id: pointId,
      return_point_id: returnPointId,
      date_from: input.from,
      date_to: input.to,
      total_price: input.total,
      status: 'pending',
      extras: input.extras,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const { error: paymentError } = await supabase.from('payments').insert({
    order_id: order.id,
    amount: input.total,
    method: input.paymentMethod,
    status: input.paymentMethod === 'cash' ? 'pending' : 'paid',
    paid_at: input.paymentMethod === 'cash' ? null : new Date().toISOString(),
  })

  if (paymentError) throw paymentError
  return order.id as string
}

export async function cancelOrder(orderId: string) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
  if (error) throw error
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw error
}

export async function getUsers() {
  if (!isSupabaseConfigured) return USERS

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, dob')
    .order('full_name')

  if (error) throw error
  return (data as ProfileRow[]).map(profileToUser)
}

export async function updateProfile(input: { id: string; fullName: string; dob: string; phone?: string; driverLicense?: string }): Promise<AuthUser> {
  if (!isSupabaseConfigured) {
    const [first = '', second = ''] = input.fullName.split(' ')
    return {
      id: input.id,
      name: input.fullName,
      email: '',
      initials: `${first[0] ?? '?'}${second[0] ?? ''}`.toUpperCase(),
      dob: input.dob,
      role: 'client',
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      dob: input.dob || null,
      phone: input.phone,
      driver_license: input.driverLicense,
    })
    .eq('id', input.id)
    .select('*')
    .single()

  if (error) throw error
  return toAuthUser(input.id, (data as ProfileRow).email ?? '', data as ProfileRow)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const authUser = sessionData.session?.user
  if (!authUser) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
  return toAuthUser(authUser.id, authUser.email ?? '', profile as ProfileRow | null, authUser.user_metadata)
}

export async function login(email: string, password: string): Promise<AuthUser> {
  assertConfigured()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const authUser = data.user
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
  return toAuthUser(authUser.id, authUser.email ?? email, profile as ProfileRow | null, authUser.user_metadata)
}

export async function register(input: { email: string; password: string; name: string; surname: string; dob: string; phone: string; dl: string }) {
  assertConfigured()
  const fullName = `${input.name} ${input.surname}`.trim()
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: fullName,
        dob: input.dob,
        phone: input.phone,
        driver_license: input.dl,
        role: 'client',
      },
    },
  })
  if (error) throw error
  if (!data.user) throw new Error('Пользователь не создан')

  return toAuthUser(data.user.id, data.user.email ?? input.email, {
    id: data.user.id,
    full_name: fullName,
    email: input.email,
    role: 'client',
    dob: input.dob,
  })
}

export async function logout() {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

async function findPickupPointId(label: string) {
  const { data, error } = await supabase.from('pickup_points').select('id, name, city, address')
  if (error) throw error
  const point = (data as PickupPointRow[]).find(row => label.includes(row.name ?? '') || label.includes(row.address ?? ''))
  const id = point?.id ?? (data?.[0]?.id as number | undefined)
  if (!id) throw new Error('Не найден пункт выдачи')
  return id
}

function toAuthUser(id: string, email: string, profile?: ProfileRow | null, meta: Record<string, any> = {}): AuthUser {
  const name = profile?.full_name ?? meta.full_name ?? email
  const [first = '', second = ''] = name.split(' ')
  return {
    id,
    name,
    email,
    initials: `${first[0] ?? '?'}${second[0] ?? ''}`.toUpperCase(),
    dob: profile?.dob ?? meta.dob ?? '',
    role: profile?.role ?? meta.role ?? 'client',
  }
}
