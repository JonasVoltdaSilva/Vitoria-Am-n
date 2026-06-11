import { useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { STATUS, TIPO_LABEL } from '../lib/statusRules'
import { AlertTriangle, FileWarning, FileClock, CheckCircle2, FileX } from 'lucide-react'

function Kpi({ icon: Icon, label, valor, cor }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${cor}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-3xl font-extrabold leading-none">{valor}</p>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

const CORES_STATUS = {
  [STATUS.SEM_APAC_SEM_LAUDO]: '#ef4444',
  [STATUS.ORIGINAL_SEM_APAC]: '#f97316',
  [STATUS.AGUARDANDO_LAUDO]: '#f59e0b',
  [STATUS.FINALIZADO]: '#10b981',
  [STATUS.SEM_APAC]: '#64748b',
}

export default function Dashboard({ exames }) {
  const stats = useMemo(() => {
    const semApac = exames.filter((e) => !e.possui_apac).length
    const aguardandoLaudo = exames.filter((e) => e.status === STATUS.AGUARDANDO_LAUDO).length
    const finalizado = exames.filter((e) => e.status === STATUS.FINALIZADO).length
    const originalSemApac = exames.filter((e) => e.status === STATUS.ORIGINAL_SEM_APAC).length
    const aptoApac = exames.filter((e) => e.pode_procurar_apac).length

    // Distribuicao por status
    const porStatus = Object.values(STATUS)
      .map((s) => ({ name: s, value: exames.filter((e) => e.status === s).length }))
      .filter((d) => d.value > 0)

    // Distribuicao por tipo de exame
    const porTipo = ['TC', 'US', 'MG', 'RX'].map((t) => ({
      name: TIPO_LABEL[t],
      total: exames.filter((e) => e.tipo_exame === t).length,
      'Sem APAC': exames.filter((e) => e.tipo_exame === t && !e.possui_apac).length,
    }))

    return { semApac, aguardandoLaudo, finalizado, originalSemApac, aptoApac, porStatus, porTipo }
  }, [exames])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={FileX} label="Sem APAC" valor={stats.semApac} cor="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" />
        <Kpi icon={FileClock} label="Aguardando laudo" valor={stats.aguardandoLaudo} cor="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" />
        <Kpi icon={CheckCircle2} label="Finalizados" valor={stats.finalizado} cor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300" />
        <Kpi icon={FileWarning} label="Original sem APAC" valor={stats.originalSemApac} cor="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300" />
        <Kpi icon={AlertTriangle} label="Apto p/ APAC (>20 dias)" valor={stats.aptoApac} cor="bg-red-600 text-white" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-lg font-bold">Distribuicao por status</h3>
          {stats.porStatus.length === 0 ? (
            <p className="text-slate-400">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.porStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {stats.porStatus.map((entry) => (
                    <Cell key={entry.name} fill={CORES_STATUS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-lg font-bold">Exames por tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.porTipo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total" fill="#1c5ef5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Sem APAC" name="Sem APAC" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
