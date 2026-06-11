import * as XLSX from 'xlsx'
import { format } from 'date-fns'

const fmt = (d) => {
  if (!d) return ''
  try {
    return format(typeof d === 'string' ? new Date(d) : d, 'dd/MM/yyyy')
  } catch {
    return ''
  }
}

const SimNao = (v) => (v ? 'Sim' : 'Nao')

/** Converte a lista de exames em linhas planas para planilha. */
function toRows(exames) {
  return exames.map((e) => ({
    Paciente: e.nome_paciente,
    'Tipo de Exame': e.tipo_exame,
    'Numero APAC': e.numero_apac || '',
    'Data Solicitacao': fmt(e.data_solicitacao),
    'Data Entrada': fmt(e.data_entrada),
    'Possui APAC': SimNao(e.possui_apac),
    'Possui Laudo': SimNao(e.possui_laudo),
    'Pedido Original': SimNao(e.pedido_original),
    'Dias Decorridos': e.dias_decorridos ?? '',
    Status: e.status,
    Observacoes: e.observacoes || '',
  }))
}

/** Exporta os exames para um arquivo .xlsx (Excel). */
export function exportarExcel(exames, nomeArquivo = 'exames-oncologia') {
  const rows = toRows(exames)
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 40 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Exames')
  XLSX.writeFile(wb, `${nomeArquivo}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

/** Faz backup completo (JSON) dos dados informados. */
export function exportarBackupJSON(payload, nomeArquivo = 'backup-exames') {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nomeArquivo}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Dispara a impressao do relatorio (usa o CSS de impressao). */
export function imprimirRelatorio() {
  window.print()
}
