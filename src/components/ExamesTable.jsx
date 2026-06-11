import { format } from 'date-fns'
import { AlertTriangle, Pencil, Trash2, Paperclip, FileText } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { TIPO_LABEL } from '../lib/statusRules'

const fmtData = (d) => {
  if (!d) return '—'
  try {
    return format(new Date(d), 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

const SimNao = ({ value }) => (
  <span
    className={`badge ${
      value
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    }`}
  >
    {value ? 'Sim' : 'Nao'}
  </span>
)

export default function ExamesTable({ exames, onEdit, onDelete, onDocs }) {
  if (exames.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 p-12 text-center">
        <FileText className="h-12 w-12 text-slate-300" />
        <p className="text-lg font-semibold text-slate-500">Nenhum exame encontrado</p>
        <p className="text-sm text-slate-400">Ajuste a busca/filtros ou cadastre um novo exame.</p>
      </div>
    )
  }

  return (
    <>
      {/* Tabela (desktop) */}
      <div className="card hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Solicitacao</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3">Dias</th>
              <th className="px-4 py-3">APAC</th>
              <th className="px-4 py-3">Laudo</th>
              <th className="px-4 py-3">Original</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 no-print">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {exames.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="font-semibold">{e.nome_paciente}</div>
                  {e.numero_apac && (
                    <div className="text-xs text-slate-400">APAC: {e.numero_apac}</div>
                  )}
                  {e.observacoes && (
                    <div className="max-w-[220px] truncate text-xs text-slate-400" title={e.observacoes}>
                      {e.observacoes}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{e.tipo_exame}</span>
                  <div className="text-xs text-slate-400">{TIPO_LABEL[e.tipo_exame]}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtData(e.data_solicitacao)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtData(e.data_entrada)}</td>
                <td className="px-4 py-3">
                  {e.pode_procurar_apac ? (
                    <span className="badge animate-pulse bg-red-600 text-white" title="Pode procurar APAC">
                      <AlertTriangle className="h-3.5 w-3.5" /> {e.dias_decorridos}d
                    </span>
                  ) : (
                    <span className="text-slate-500">{e.dias_decorridos ?? '—'}d</span>
                  )}
                </td>
                <td className="px-4 py-3"><SimNao value={e.possui_apac} /></td>
                <td className="px-4 py-3"><SimNao value={e.possui_laudo} /></td>
                <td className="px-4 py-3"><SimNao value={e.pedido_original} /></td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                  {e.pode_procurar_apac && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" /> PODE PROCURAR APAC
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 no-print">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onDocs(e)} className="btn-ghost relative !p-2" title="Documentos">
                      <Paperclip className="h-5 w-5" />
                      {e.documentos?.length > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                          {e.documentos.length}
                        </span>
                      )}
                    </button>
                    <button onClick={() => onEdit(e)} className="btn-ghost !p-2" title="Editar">
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDelete(e)} className="btn-ghost !p-2 text-red-600" title="Excluir">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartoes (mobile/tablet) */}
      <div className="grid gap-4 lg:hidden">
        {exames.map((e) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold">{e.nome_paciente}</h3>
                <p className="text-sm text-slate-400">
                  {e.tipo_exame} &middot; {TIPO_LABEL[e.tipo_exame]}
                </p>
              </div>
              <StatusBadge status={e.status} />
            </div>

            {e.pode_procurar_apac && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white">
                <AlertTriangle className="h-5 w-5" /> PODE PROCURAR APAC ({e.dias_decorridos} dias)
              </div>
            )}

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Solicitacao</dt>
                <dd>{fmtData(e.data_solicitacao)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Entrada</dt>
                <dd>{fmtData(e.data_entrada)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Dias decorridos</dt>
                <dd>{e.dias_decorridos ?? '—'} dias</dd>
              </div>
              {e.numero_apac && (
                <div>
                  <dt className="text-xs text-slate-400">N. APAC</dt>
                  <dd>{e.numero_apac}</dd>
                </div>
              )}
            </dl>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span>APAC: <SimNao value={e.possui_apac} /></span>
              <span>Laudo: <SimNao value={e.possui_laudo} /></span>
              <span>Original: <SimNao value={e.pedido_original} /></span>
            </div>

            {e.observacoes && (
              <p className="mt-3 rounded-lg bg-slate-100 p-2 text-sm text-slate-500 dark:bg-slate-800/60">
                {e.observacoes}
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 no-print">
              <button onClick={() => onDocs(e)} className="btn-secondary !px-2 !py-2">
                <Paperclip className="h-5 w-5" />
                {e.documentos?.length > 0 ? e.documentos.length : ''}
              </button>
              <button onClick={() => onEdit(e)} className="btn-secondary !px-2 !py-2">
                <Pencil className="h-5 w-5" />
              </button>
              <button onClick={() => onDelete(e)} className="btn-danger !px-2 !py-2">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
