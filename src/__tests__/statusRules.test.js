import { describe, it, expect } from 'vitest'
import {
  calcularStatus,
  diasDecorridos,
  podeProcurarApac,
  enrich,
  STATUS,
  PASTAS,
} from '../lib/statusRules'

describe('Regras de status', () => {
  it('Regra 1: sem APAC, sem laudo, sem original -> SEM APAC E SEM LAUDO', () => {
    expect(
      calcularStatus({ possui_apac: false, possui_laudo: false, pedido_original: false }),
    ).toBe(STATUS.SEM_APAC_SEM_LAUDO)
  })

  it('Regra 2: sem APAC, com original -> ORIGINAL SEM APAC', () => {
    expect(
      calcularStatus({ possui_apac: false, possui_laudo: false, pedido_original: true }),
    ).toBe(STATUS.ORIGINAL_SEM_APAC)
  })

  it('Regra 3: com APAC, sem laudo -> AGUARDANDO LAUDO', () => {
    expect(
      calcularStatus({ possui_apac: true, possui_laudo: false, pedido_original: false }),
    ).toBe(STATUS.AGUARDANDO_LAUDO)
  })

  it('Regra 4: com APAC, com laudo -> FINALIZADO', () => {
    expect(
      calcularStatus({ possui_apac: true, possui_laudo: true, pedido_original: false }),
    ).toBe(STATUS.FINALIZADO)
  })

  it('FINALIZADO tem precedencia mesmo com original', () => {
    expect(
      calcularStatus({ possui_apac: true, possui_laudo: true, pedido_original: true }),
    ).toBe(STATUS.FINALIZADO)
  })
})

describe('Controle dos 20 dias', () => {
  const hoje = new Date('2026-06-11')

  it('calcula dias decorridos corretamente', () => {
    expect(diasDecorridos('2026-06-01', hoje)).toBe(10)
    expect(diasDecorridos('2026-05-22', hoje)).toBe(20)
  })

  it('retorna null para data invalida/ausente', () => {
    expect(diasDecorridos(null, hoje)).toBeNull()
    expect(diasDecorridos('', hoje)).toBeNull()
  })

  it('pode procurar APAC: >=20 dias e sem APAC', () => {
    expect(podeProcurarApac({ data_solicitacao: '2026-05-22', possui_apac: false }, hoje)).toBe(true)
    expect(podeProcurarApac({ data_solicitacao: '2026-05-23', possui_apac: false }, hoje)).toBe(false)
  })

  it('NAO pode procurar APAC se ja tem APAC', () => {
    expect(podeProcurarApac({ data_solicitacao: '2026-01-01', possui_apac: true }, hoje)).toBe(false)
  })
})

describe('enrich', () => {
  it('adiciona status, dias e flag de alerta', () => {
    const e = enrich(
      { data_solicitacao: '2026-05-01', possui_apac: false, possui_laudo: false, pedido_original: false },
      new Date('2026-06-11'),
    )
    expect(e.status).toBe(STATUS.SEM_APAC_SEM_LAUDO)
    expect(e.dias_decorridos).toBe(41)
    expect(e.pode_procurar_apac).toBe(true)
  })
})

describe('Pastas automaticas', () => {
  it('todas as 7 pastas estao definidas com predicado', () => {
    expect(PASTAS).toHaveLength(7)
    PASTAS.forEach((p) => {
      expect(typeof p.test).toBe('function')
      expect(p.label).toBeTruthy()
    })
  })

  it('filtra TC finalizado corretamente', () => {
    const pasta = PASTAS.find((p) => p.id === 'tc-finalizado')
    const exame = enrich({
      tipo_exame: 'TC', data_solicitacao: '2026-06-01',
      possui_apac: true, possui_laudo: true, pedido_original: false,
    })
    expect(pasta.test(exame)).toBe(true)
  })
})
