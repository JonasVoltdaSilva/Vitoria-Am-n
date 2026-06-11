import { describe, it, expect, beforeEach } from 'vitest'
import {
  listExames, createExame, updateExame, deleteExame,
  addDocumento, removeDocumento, addHistorico, listHistorico, backupLocal,
} from '../lib/localStore'

beforeEach(() => {
  localStorage.clear()
})

describe('localStore - exames', () => {
  it('cria, lista, atualiza e remove um exame', async () => {
    const novo = await createExame({
      nome_paciente: 'Maria Silva', tipo_exame: 'TC',
      data_solicitacao: '2026-06-01', data_entrada: '2026-06-02',
      possui_apac: false, possui_laudo: false, pedido_original: false,
    })
    expect(novo.id).toBeTruthy()

    let lista = await listExames()
    expect(lista).toHaveLength(1)
    expect(lista[0].nome_paciente).toBe('Maria Silva')
    expect(lista[0].documentos).toEqual([])

    await updateExame(novo.id, { possui_apac: true })
    lista = await listExames()
    expect(lista[0].possui_apac).toBe(true)

    await deleteExame(novo.id)
    lista = await listExames()
    expect(lista).toHaveLength(0)
  })

  it('ordena por data de solicitacao (mais recente primeiro)', async () => {
    await createExame({ nome_paciente: 'A', tipo_exame: 'US', data_solicitacao: '2026-01-01' })
    await createExame({ nome_paciente: 'B', tipo_exame: 'US', data_solicitacao: '2026-12-01' })
    const lista = await listExames()
    expect(lista[0].nome_paciente).toBe('B')
  })
})

describe('localStore - documentos (IndexedDB)', () => {
  it('anexa e remove documento de um exame', async () => {
    const ex = await createExame({ nome_paciente: 'Joao', tipo_exame: 'MG', data_solicitacao: '2026-06-01' })
    const file = new File(['conteudo'], 'pedido.pdf', { type: 'application/pdf' })
    await addDocumento(ex.id, file, 'pedido')

    let lista = await listExames()
    expect(lista[0].documentos).toHaveLength(1)
    expect(lista[0].documentos[0].nome_arquivo).toBe('pedido.pdf')
    expect(lista[0].documentos[0].tipo).toBe('pedido')

    await removeDocumento(lista[0].documentos[0])
    lista = await listExames()
    expect(lista[0].documentos).toHaveLength(0)
  })

  it('remove documentos junto com o exame', async () => {
    const ex = await createExame({ nome_paciente: 'Ana', tipo_exame: 'RX', data_solicitacao: '2026-06-01' })
    await addDocumento(ex.id, new File(['x'], 'apac.jpg'), 'apac')
    await deleteExame(ex.id)
    const backup = await backupLocal()
    expect(backup.documentos.filter((d) => d.exame_id === ex.id)).toHaveLength(0)
  })
})

describe('localStore - historico e backup', () => {
  it('registra e lista historico', async () => {
    await addHistorico({ exame_id: '1', usuario: 'Teste', acao: 'CRIACAO', detalhes: 'criou' })
    await addHistorico({ exame_id: '2', usuario: 'Teste', acao: 'EDICAO', detalhes: 'editou' })
    const todos = await listHistorico()
    expect(todos).toHaveLength(2)
    const doExame1 = await listHistorico('1')
    expect(doExame1).toHaveLength(1)
  })

  it('backup retorna exames, documentos e historico', async () => {
    await createExame({ nome_paciente: 'X', tipo_exame: 'TC', data_solicitacao: '2026-06-01' })
    const b = await backupLocal()
    expect(b).toHaveProperty('exames')
    expect(b).toHaveProperty('documentos')
    expect(b).toHaveProperty('historico')
    expect(b.exames).toHaveLength(1)
  })
})
