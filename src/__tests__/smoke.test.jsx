/**
 * Teste de fumaca: garante que o app renderiza sem crash
 * no modo local (sem Supabase configurado).
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, screen, cleanup } from '@testing-library/react'

afterEach(cleanup)

// jsdom nao implementa ResizeObserver (usado pelo recharts); navegadores reais tem.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import App from '../App'

function renderApp() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>,
  )
}

describe('App (modo local)', () => {
  it('renderiza a tela de login sem crash', () => {
    renderApp()
    expect(screen.getByText(/Controle de Exames/i)).toBeTruthy()
    expect(screen.getByText(/Modo local/i)).toBeTruthy()
  })

  it('entra com nome e mostra a tela principal', async () => {
    localStorage.clear()
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/Ex\.: Vitoria/i), {
      target: { value: 'Teste QA' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Entrar$/i }))
    // Tela principal deve aparecer
    expect(await screen.findByText(/Relatorio de Exames/i)).toBeTruthy()
    expect(screen.getByText(/Novo exame/i)).toBeTruthy()
  })
})
