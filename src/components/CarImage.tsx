import { useState } from 'react'
import type { Car } from '../types'
import { carFallbackImage, carImage } from '../lib/carImages'

interface Props {
  car: Car
  className?: string
  size?: string
}

export default function CarImage({ car, className = '', size = '900x600' }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const fallback = carFallbackImage(car)
  const src = car.photoUrl && !failed ? carImage(car, size) : fallback

  return (
    <div className={`car-image ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setFailed(true)}
        className="car-image__backdrop"
      />
      <img
        src={src}
        alt={car.name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={loaded || failed ? 'is-visible' : ''}
      />
    </div>
  )
}
