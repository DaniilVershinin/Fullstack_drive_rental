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

const colorMap: Record<string, string> = {
  'Белый': '#eef2f7',
  'Черный': '#111827',
  'Синий': '#1d4ed8',
  'Серый': '#64748b',
  'Серебристый': '#cbd5e1',
  'Красный': '#dc2626',
  'Зеленый': '#15803d',
}

export function carFallbackImage(car: Pick<Car, 'name' | 'cat' | 'color' | 'bodyType'>) {
  const body = colorMap[car.color ?? ''] ?? (
    car.cat === 'business' ? '#111827' : car.cat === 'suv' ? '#0f766e' : car.cat === 'comfort' ? '#1d4ed8' : '#e94560'
  )
  const roofY = car.cat === 'suv' || car.bodyType === 'Кроссовер' ? 70 : 84
  const roofH = car.cat === 'suv' || car.bodyType === 'Кроссовер' ? 58 : 46
  const label = car.name.replace(/&/g, '&amp;')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f8fafc"/>
          <stop offset="0.54" stop-color="#dbeafe"/>
          <stop offset="1" stop-color="#fee2e2"/>
        </linearGradient>
        <linearGradient id="body" x1="0" x2="1">
          <stop offset="0" stop-color="${body}"/>
          <stop offset="1" stop-color="#f8fafc"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="28" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.26"/>
        </filter>
      </defs>
      <rect width="900" height="560" fill="url(#bg)"/>
      <path d="M90 390 C210 330 690 330 810 390" fill="none" stroke="#0f172a" stroke-opacity="0.12" stroke-width="34" stroke-linecap="round"/>
      <g filter="url(#shadow)" transform="translate(48 112)">
        <path d="M168 194 C206 122 256 ${roofY} 370 ${roofY} H520 C615 ${roofY} 674 124 716 194 L768 212 C800 223 820 252 816 286 L806 330 H104 L96 286 C90 252 112 222 146 212 Z" fill="url(#body)"/>
        <path d="M262 ${roofY + roofH} C292 ${roofY + 16} 325 ${roofY + 8} 376 ${roofY + 8} H510 C568 ${roofY + 8} 606 ${roofY + 25} 642 ${roofY + roofH} Z" fill="#dbeafe" opacity="0.92"/>
        <path d="M398 ${roofY + 6} V${roofY + roofH}" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
        <rect x="140" y="222" width="620" height="94" rx="40" fill="${body}" opacity="0.88"/>
        <path d="M162 234 H740" stroke="#ffffff" stroke-opacity="0.32" stroke-width="13" stroke-linecap="round"/>
        <circle cx="220" cy="326" r="58" fill="#0f172a"/>
        <circle cx="220" cy="326" r="25" fill="#cbd5e1"/>
        <circle cx="690" cy="326" r="58" fill="#0f172a"/>
        <circle cx="690" cy="326" r="25" fill="#cbd5e1"/>
        <rect x="695" y="242" width="70" height="20" rx="10" fill="#fde68a"/>
      </g>
      <text x="50%" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#0f172a">${label}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
