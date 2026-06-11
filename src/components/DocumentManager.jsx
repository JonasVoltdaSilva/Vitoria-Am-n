import { useRef, useState } from 'react'
import { FileText, Image, Trash2, Upload, ExternalLink } from 'lucide-react'

const TIPOS_DOC = [
  { value: 'pedido', label: 'Foto do Pedido' },
  { value: 'apac', label: 'Foto da APAC' },
  { value: 'laudo', label: 'Foto do Laudo' },
  { value: 'pdf', label: 'PDF / Outro' },
]

function iconePorTipo(nome = '') {
  return nome.toLowerCase().endsWith('.pdf') ? FileText : Image
}

export default function DocumentManager({ exame, onUpload, onRemove }) {
  const [tipo, setTipo] = useState('pedido')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef(null)
  const docs = exame.documentos || []

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    setEnviando(true)
    try {
      await onUpload(exame.id, file, tipo)
    } catch (err) {
      setErro(err.message || 'Falha no upload.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <label className="label">Anexar documento (PDF ou foto)</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className="input sm:max-w-[220px]" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
          >
            <Upload className="h-5 w-5" />
            {enviando ? 'Enviando...' : 'Selecionar arquivo'}
          </button>
        </div>
        {erro && <p className="mt-2 text-sm font-medium text-red-600">{erro}</p>}
        <p className="mt-2 text-xs text-slate-400">
          Dica: no celular, voce pode usar a camera para fotografar o documento.
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          Documentos anexados ({docs.length})
        </h4>
        {docs.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum documento anexado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => {
              const Icone = iconePorTipo(d.nome_arquivo)
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <Icone className="h-6 w-6 flex-shrink-0 text-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.nome_arquivo}</p>
                    <p className="text-xs uppercase text-slate-400">{d.tipo}</p>
                  </div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost !p-2"
                    title="Abrir"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => onRemove(d)}
                    className="btn-ghost !p-2 text-red-600"
                    title="Remover"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
