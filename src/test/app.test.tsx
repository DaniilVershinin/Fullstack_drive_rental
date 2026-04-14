import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App main flows', () => {
  it('redirects an unauthenticated user away from the manager page', async () => {
    window.history.pushState({}, '', '/manager')

    render(<App />)

    expect(await screen.findByText(/Аренда авто/i)).toBeInTheDocument()
    expect(screen.queryByText(/Панель менеджера/i)).not.toBeInTheDocument()
  })

  it('logs in through the auth page and returns to the home page', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/auth')

    render(<App />)

    const loginButtons = screen.getAllByRole('button', { name: 'Войти' })
    await user.click(loginButtons[loginButtons.length - 1])

    expect(await screen.findByText(/Аренда авто/i)).toBeInTheDocument()
    expect(screen.getByText('Алексей')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('shows an age validation error during registration', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/auth')

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Регистрация' }))
    await user.type(screen.getByPlaceholderText('Иван'), 'Иван')
    await user.type(screen.getByPlaceholderText('email@mail.com'), 'ivan@example.com')
    const dobInput = document.querySelector('input[type="date"]')
    if (!dobInput) throw new Error('Date input not found')
    await user.type(dobInput, '2008-01-01')
    await user.type(screen.getByPlaceholderText('77 22 456789'), '77 22 456789')
    await user.type(screen.getByPlaceholderText('Минимум 8 символов'), 'password123')

    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }))

    expect(await screen.findByText(/Минимальный возраст/i)).toBeInTheDocument()
  })
})
