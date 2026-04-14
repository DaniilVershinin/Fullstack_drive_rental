import type { Car } from '../types'

const modelQueries: Record<string, string> = {
  'Kia Rio': 'kia rio sedan car',
  'Toyota Camry': 'toyota camry sedan car',
  'BMW 5 Series': 'bmw 5 series sedan',
  'Toyota RAV4': 'toyota rav4 suv',
  'Hyundai Solaris': 'hyundai solaris sedan',
  'Mercedes E-Class': 'mercedes e class sedan',
  'VW Tiguan': 'volkswagen tiguan suv',
  'Skoda Octavia': 'skoda octavia car',
  'Lada Vesta SW Cross': 'lada vesta sw cross',
  'Haval Jolion': 'haval jolion suv',
  'Geely Coolray': 'geely coolray suv',
  'Chery Tiggo 7 Pro': 'chery tiggo 7 pro',
  'Kia K5': 'kia k5 sedan',
  'Renault Duster': 'renault duster suv',
  'Volkswagen Polo': 'volkswagen polo sedan',
  'Toyota Corolla': 'toyota corolla sedan',
}

export function carImage(car: Pick<Car, 'name' | 'photoUrl'>, size = '900x600') {
  if (car.photoUrl) return car.photoUrl
  const query = encodeURIComponent(modelQueries[car.name] ?? `${car.name} car`)
  return `https://source.unsplash.com/${size}/?${query}`
}
