import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import BookingModal from '../components/BookingModal'
import { CARS } from '../data'
import { renderWithApp } from './utils'

describe('BookingModal', () => {
  it('detects conflicting dates and blocks moving to the next step', async () => {
    const user = userEvent.setup()

    renderWithApp(
      <BookingModal car={CARS[1]} onClose={() => {}} onBooked={() => {}} />
    )

    const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/)
    await user.clear(dateInputs[0])
    await user.type(dateInputs[0], '2026-04-06')
    await user.clear(dateInputs[1])
    await user.type(dateInputs[1], '2026-04-07')

    expect(await screen.findByText(/уже забронирован/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Выбрать доп\. услуги/i })).toBeDisabled()
  })

  it('validates card fields before confirming payment', async () => {
    const user = userEvent.setup()

    renderWithApp(
      <BookingModal car={CARS[3]} onClose={() => {}} onBooked={() => {}} />
    )

    await user.click(screen.getByRole('button', { name: /Выбрать доп\. услуги/i }))
    await user.click(screen.getByRole('button', { name: /К оплате/i }))
    await user.click(screen.getByRole('button', { name: /Оплатить/i }))

    expect(await screen.findByText(/Некорректный номер карты/i)).toBeInTheDocument()
  })

  it('completes a booking after valid card details are entered', async () => {
    const user = userEvent.setup()
    const onBooked = { called: false }

    renderWithApp(
      <BookingModal
        car={CARS[3]}
        onClose={() => {}}
        onBooked={() => {
          onBooked.called = true
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: /Выбрать доп\. услуги/i }))
    await user.click(screen.getByRole('button', { name: /К оплате/i }))

    const cardNumber = screen.getByPlaceholderText('0000 0000 0000 0000')
    const expiry = screen.getByPlaceholderText('MM/YY')
    const name = screen.getByPlaceholderText('IVAN IVANOV')
    const cvvInput = screen.getByPlaceholderText('•••')

    await user.type(cardNumber, '4111111111111111')
    await user.type(expiry, '1228')
    await user.type(cvvInput, '123')
    await user.type(name, 'IVAN IVANOV')

    await user.click(screen.getByRole('button', { name: /Оплатить/i }))

    expect(await screen.findByText(/Бронирование подтверждено/i)).toBeInTheDocument()
    expect(onBooked.called).toBe(true)
  })
})
