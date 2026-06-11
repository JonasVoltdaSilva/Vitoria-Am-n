import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { History } from 'lucide-react'

const ACAO_LABEL = {
  CRIACAO: 'Criacao',
  EDICAO: 'Edicao',
  EXCLUSAO: 'Exclusao',
  UPLOAD: 'Upload',
  EXCLUSAO_DOC: 'Documento removido',
}

export default function HistoryView({ exameId }) {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    async function load() {
      let query = supabase
        .from('historico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (exameId) query = query.eq('exame_id', exameId)

      const { data } = await query
      if (ativo) {
        setItens(data || [])
        setCarregando(false)
      }
    }
    load()
    return () => {
      ativo = false
    }
  }, [exameId])

  if (carregando) return <p className="text-sm text-slate-400">Carregando historico...</p>

  if (itens.length === 0)
    return <p className="text-sm text-slate-400">Nenhuma alteracao registrada.</p>

  return (
    <ul className="space-y-3">
      {itens.map((h) => (
        <li key={h.id} className="flex gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <History className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{ACAO_LABEL[h.acao] || h.acao}</span>
              <span className="text-xs text-slate-400">
                {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{h.detalhes}</p>
            <p className="text-xs text-slate-400">por {h.usuario}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
