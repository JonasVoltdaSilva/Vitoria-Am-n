import { PASTAS } from '../lib/statusRules'

export default function FolderFilters({ exames, ativo, onSelect }) {
  // Conta quantos exames caem em cada pasta
  const contagem = (pasta) => exames.filter(pasta.test).length

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
          ativo === null
            ? 'bg-brand-600 text-white'
            : 'hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        <span>📋 Todos os exames</span>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
          {exames.length}
        </span>
      </button>

      <div className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        Pastas automaticas
      </div>

      {PASTAS.map((pasta) => {
        const qtd = contagem(pasta)
        return (
          <button
            key={pasta.id}
            onClick={() => onSelect(pasta.id)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              ativo === pasta.id
                ? 'bg-brand-600 font-semibold text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span className="truncate">
              {pasta.icon} {pasta.label}
            </span>
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                ativo === pasta.id ? 'bg-black/10 dark:bg-white/10' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              {qtd}
            </span>
          </button>
        )
      })}
    </div>
  )
}
