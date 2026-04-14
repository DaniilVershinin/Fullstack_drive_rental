import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CatalogPage from '../pages/CatalogPage'
import { renderWithApp } from './utils'

describe('CatalogPage', () => {
  it('filters by category and can reset filters back to the full list', async () => {
    const user = userEvent.setup()

    renderWithApp(<CatalogPage />, '/catalog')

    expect(screen.getByText('Kia Rio')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Внедорожник' }))

    expect(screen.queryByText('Kia Rio')).not.toBeInTheDocument()
    expect(screen.getByText('Toyota RAV4')).toBeInTheDocument()
    expect(screen.getByText('VW Tiguan')).toBeInTheDocument()
    expect(screen.getByText(/2 автомобилей/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))

    expect(await screen.findByText('Kia Rio')).toBeInTheDocument()
    expect(screen.getByText(/8 автомобилей/i)).toBeInTheDocument()
  })
})
