import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AppProvider } from '../hooks/useApp'
import Toasts from '../components/Toasts'

export function renderWithApp(ui: ReactElement, route = '/') {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[route]}>
        {ui}
        <Toasts />
      </MemoryRouter>
    </AppProvider>
  )
}
