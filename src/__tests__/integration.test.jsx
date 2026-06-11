/**
 * Teste de integracao: simula um usuario real usando o app inteiro no modo local.
 * Cobre login, cadastro de exame, status automatico, busca, pastas, edicao e exclusao.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent, screen, within, waitFor } from '@testing-library/react'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

function renderApp() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>,
  )
}

async function entrar(nome = 'QA Tester') {
  fireEvent.change(screen.getByPlaceholderText(/Ex\.: Vitoria/i), { target: { value: nome } })
  fireEvent.click(screen.getByRole('button', { name: /^Entrar$/i }))
  await screen.findByText(/Relatorio de Exames/i)
}

async function cadastrarExame({ nome, tipo = 'TC', apac = false, laudo = false, original = false }) {
  fireEvent.click(screen.getAllByRole('button', { name: /Novo exame/i })[0])
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByPlaceholderText(/Nome completo/i), { target: { value: nome } })
  fireEvent.change(within(dialog).getByDisplayValue(/Tomografia/i), { target: { value: tipo } })
  if (apac) fireEvent.click(within(dialog).getAllByRole('button', { name: /^Sim$/i })[0])
  if (laudo) fireEvent.click(within(dialog).getAllByRole('button', { name: /^Sim$/i })[1])
  if (original) fireEvent.click(within(dialog).getAllByRole('button', { name: /^Sim$/i })[2])
  fireEvent.click(within(dialog).getByRole('button', { name: /Cadastrar exame/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}

describe('Fluxo completo (modo local)', () => {
  it('faz login pela tela inicial', async () => {
    renderApp()
    expect(screen.getByText(/Modo local/i)).toBeTruthy()
    await entrar()
    expect(screen.getByText(/Novo exame/i)).toBeTruthy()
  })

  it('cadastra exame e calcula status SEM APAC E SEM LAUDO', async () => {
    renderApp()
    await entrar()
    await cadastrarExame({ nome: 'Paciente Um' })
    expect(await screen.findAllByText(/Paciente Um/i)).not.toHaveLength(0)
    expect(screen.getAllByText(/SEM APAC E SEM LAUDO/i).length).toBeGreaterThan(0)
  })

  it('cadastra exame FINALIZADO (APAC + Laudo)', async () => {
    renderApp()
    await entrar()
    await cadastrarExame({ nome: 'Paciente Final', apac: true, laudo: true })
    expect(screen.getAllByText(/FINALIZADO/i).length).toBeGreaterThan(0)
  })

  it('busca instantanea filtra por nome', async () => {
    renderApp()
    await entrar()
    await cadastrarExame({ nome: 'Carlos Souza' })
    await cadastrarExame({ nome: 'Mariana Lima' })
    fireEvent.change(screen.getByPlaceholderText(/Buscar por paciente/i), {
      target: { value: 'Carlos' },
    })
    await waitFor(() => {
      expect(screen.queryAllByText(/Mariana Lima/i)).toHaveLength(0)
      expect(screen.getAllByText(/Carlos Souza/i).length).toBeGreaterThan(0)
    })
  })

  it('edita um exame existente', async () => {
    renderApp()
    await entrar()
    await cadastrarExame({ nome: 'Para Editar' })
    fireEvent.click(screen.getAllByTitle(/Editar/i)[0])
    const dialog = await screen.findByRole('dialog')
    const inputNome = within(dialog).getByDisplayValue(/Para Editar/i)
    fireEvent.change(inputNome, { target: { value: 'Nome Editado' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Salvar alteracoes/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findAllByText(/Nome Editado/i)).not.toHaveLength(0)
  })

  it('exclui um exame com confirmacao', async () => {
    renderApp()
    await entrar()
    await cadastrarExame({ nome: 'Para Excluir' })
    fireEvent.click(screen.getAllByTitle(/Excluir/i)[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Excluir$/i }))
    await waitFor(() => {
      expect(screen.queryAllByText(/Para Excluir/i)).toHaveLength(0)
    })
  })

  it('alterna tema claro/escuro', async () => {
    renderApp()
    await entrar()
    const root = document.documentElement
    const tinhaDark = root.classList.contains('dark')
    fireEvent.click(screen.getByLabelText(/^Tema$/i))
    expect(root.classList.contains('dark')).toBe(!tinhaDark)
  })

  it('faz logout e volta para o login', async () => {
    renderApp()
    await entrar()
    fireEvent.click(screen.getByLabelText(/^Sair$/i))
    expect(await screen.findByText(/Modo local/i)).toBeTruthy()
  })
})
