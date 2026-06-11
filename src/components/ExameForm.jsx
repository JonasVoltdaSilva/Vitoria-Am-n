import { useState } from 'react'
import { TIPOS_EXAME, calcularStatus } from '../lib/statusRules'
import StatusBadge from './StatusBadge'

const hojeISO = () => new Date().toISOString().slice(0, 10)

const vazio = {
  nome_paciente: '',
  tipo_exame: 'TC',
  numero_apac: '',
  data_solicitacao: hojeISO(),
  data_entrada: hojeISO(),
  possui_apac: false,
  possui_laudo: false,
  pedido_original: false,
  observacoes: '',
}

// Botao grande de alternancia Sim/Nao
function ToggleSimNao({ label, value, onChange }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`btn ${value ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`btn ${!value ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
        >
          Nao
        </button>
      </div>
    </div>
  )
}

export default function ExameForm({ exame, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    exame
      ? {
          nome_paciente: exame.nome_paciente || '',
          tipo_exame: exame.tipo_exame || 'TC',
          numero_apac: exame.numero_apac || '',
          data_solicitacao: exame.data_solicitacao || hojeISO(),
          data_entrada: exame.data_entrada || hojeISO(),
          possui_apac: !!exame.possui_apac,
          possui_laudo: !!exame.possui_laudo,
          pedido_original: !!exame.pedido_original,
          observacoes: exame.observacoes || '',
        }
      : vazio,
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const statusPreview = calcularStatus(form)

  const submit = async (e) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await onSubmit({ ...form, numero_apac: form.numero_apac.trim() || null })
    } catch (err) {
      setErro(err.message || 'Erro ao salvar.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {erro && (
        <div className="rounded-xl bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
          {erro}
        </div>
      )}

      <div>
        <label className="label">Nome do paciente *</label>
        <input
          className="input"
          value={form.nome_paciente}
          onChange={(e) => set('nome_paciente', e.target.value)}
          placeholder="Nome completo"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tipo de exame *</label>
          <select
            className="input"
            value={form.tipo_exame}
            onChange={(e) => set('tipo_exame', e.target.value)}
          >
            {TIPOS_EXAME.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Numero da APAC</label>
          <input
            className="input"
            value={form.numero_apac}
            onChange={(e) => set('numero_apac', e.target.value)}
            placeholder="Ex.: 3525..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Data da solicitacao medica *</label>
          <input
            type="date"
            className="input"
            value={form.data_solicitacao}
            onChange={(e) => set('data_solicitacao', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Data de entrada do pedido *</label>
          <input
            type="date"
            className="input"
            value={form.data_entrada}
            onChange={(e) => set('data_entrada', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ToggleSimNao label="Possui APAC?" value={form.possui_apac} onChange={(v) => set('possui_apac', v)} />
        <ToggleSimNao label="Possui Laudo?" value={form.possui_laudo} onChange={(v) => set('possui_laudo', v)} />
        <ToggleSimNao label="Pedido Original?" value={form.pedido_original} onChange={(v) => set('pedido_original', v)} />
      </div>

      <div>
        <label className="label">Observacoes</label>
        <textarea
          className="input min-h-[90px]"
          value={form.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          placeholder="Anotacoes sobre o pedido, paciente, pendencias..."
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 dark:bg-slate-800/60">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Status automatico:</span>
        <StatusBadge status={statusPreview} />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : exame ? 'Salvar alteracoes' : 'Cadastrar exame'}
        </button>
      </div>
    </form>
  )
}
