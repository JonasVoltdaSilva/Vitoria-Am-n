import { differenceInCalendarDays, parseISO } from 'date-fns'

// Tipos de exame suportados
export const TIPOS_EXAME = [
  { value: 'TC', label: 'Tomografia (TC)' },
  { value: 'US', label: 'Ultrassom (US)' },
  { value: 'MG', label: 'Mamografia (MG)' },
  { value: 'RX', label: 'Raio-X (RX)' },
]

export const TIPO_LABEL = {
  TC: 'Tomografia',
  US: 'Ultrassom',
  MG: 'Mamografia',
  RX: 'Raio-X',
}

// Status possiveis
export const STATUS = {
  SEM_APAC_SEM_LAUDO: 'SEM APAC E SEM LAUDO',
  ORIGINAL_SEM_APAC: 'ORIGINAL SEM APAC',
  AGUARDANDO_LAUDO: 'AGUARDANDO LAUDO',
  FINALIZADO: 'FINALIZADO',
  SEM_APAC: 'SEM APAC',
}

export const PRAZO_DIAS = 20

/**
 * Calcula o status automatico de um exame com base nas regras de negocio.
 * Ordem de precedencia:
 *  - APAC = Sim e Laudo = Sim  -> FINALIZADO            (Regra 4)
 *  - APAC = Sim e Laudo = Nao  -> AGUARDANDO LAUDO      (Regra 3)
 *  - APAC = Nao e Original = Sim -> ORIGINAL SEM APAC   (Regra 2)
 *  - APAC = Nao, Laudo = Nao, Original = Nao -> SEM APAC E SEM LAUDO (Regra 1)
 *  - Demais casos sem APAC      -> SEM APAC (fallback)
 */
export function calcularStatus({ possui_apac, possui_laudo, pedido_original }) {
  const apac = Boolean(possui_apac)
  const laudo = Boolean(possui_laudo)
  const original = Boolean(pedido_original)

  if (apac && laudo) return STATUS.FINALIZADO
  if (apac && !laudo) return STATUS.AGUARDANDO_LAUDO
  if (!apac && original) return STATUS.ORIGINAL_SEM_APAC
  if (!apac && !laudo && !original) return STATUS.SEM_APAC_SEM_LAUDO
  return STATUS.SEM_APAC
}

/** Dias decorridos desde a data da solicitacao medica ate hoje. */
export function diasDecorridos(dataSolicitacao, hoje = new Date()) {
  if (!dataSolicitacao) return null
  const d = typeof dataSolicitacao === 'string' ? parseISO(dataSolicitacao) : dataSolicitacao
  if (Number.isNaN(d.getTime())) return null
  return differenceInCalendarDays(hoje, d)
}

/**
 * Controle dos 20 dias: retorna true se o paciente ja pode procurar a APAC.
 * Regra: dias decorridos >= 20 E APAC = Nao.
 */
export function podeProcurarApac(exame, hoje = new Date()) {
  if (exame.possui_apac) return false
  const dias = diasDecorridos(exame.data_solicitacao, hoje)
  return dias !== null && dias >= PRAZO_DIAS
}

/** Cores (classes Tailwind) por status para badges. */
export function statusBadgeClasses(status) {
  switch (status) {
    case STATUS.FINALIZADO:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    case STATUS.AGUARDANDO_LAUDO:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case STATUS.ORIGINAL_SEM_APAC:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    case STATUS.SEM_APAC_SEM_LAUDO:
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  }
}

/**
 * Pastas/Filtros automaticos de organizacao.
 * Cada pasta possui um predicado que avalia o exame (com status ja calculado).
 */
export const PASTAS = [
  {
    id: 'tc-sem-apac-sem-laudo',
    label: 'TC sem APAC e sem laudo',
    icon: '📁',
    test: (e) => e.tipo_exame === 'TC' && e.status === STATUS.SEM_APAC_SEM_LAUDO,
  },
  {
    id: 'tc-original-sem-apac',
    label: 'TC original sem APAC',
    icon: '📁',
    test: (e) => e.tipo_exame === 'TC' && e.status === STATUS.ORIGINAL_SEM_APAC,
  },
  {
    id: 'tc-aguardando-laudo',
    label: 'TC aguardando laudo',
    icon: '📁',
    test: (e) => e.tipo_exame === 'TC' && e.status === STATUS.AGUARDANDO_LAUDO,
  },
  {
    id: 'tc-finalizado',
    label: 'TC finalizado',
    icon: '📁',
    test: (e) => e.tipo_exame === 'TC' && e.status === STATUS.FINALIZADO,
  },
  {
    id: 'us-sem-apac',
    label: 'US sem APAC',
    icon: '📁',
    test: (e) => e.tipo_exame === 'US' && !e.possui_apac,
  },
  {
    id: 'mg-sem-apac',
    label: 'MG sem APAC',
    icon: '📁',
    test: (e) => e.tipo_exame === 'MG' && !e.possui_apac,
  },
  {
    id: 'rx-sem-apac',
    label: 'RX sem APAC',
    icon: '📁',
    test: (e) => e.tipo_exame === 'RX' && !e.possui_apac,
  },
]

/** Aplica status e flags calculadas a um exame vindo do banco. */
export function enrich(exame, hoje = new Date()) {
  const status = calcularStatus(exame)
  return {
    ...exame,
    status,
    dias_decorridos: diasDecorridos(exame.data_solicitacao, hoje),
    pode_procurar_apac: podeProcurarApac(exame, hoje),
  }
}
