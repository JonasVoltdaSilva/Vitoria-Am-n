import { useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { useExames } from './hooks/useExames'
import { PASTAS, TIPOS_EXAME } from './lib/statusRules'
import { exportarExcel, exportarBackupJSON, imprimirRelatorio } from './lib/exportUtils'
import { supabase } from './lib/supabase'

import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ExamesTable from './components/ExamesTable'
import FolderFilters from './components/FolderFilters'
import ExameForm from './components/ExameForm'
import DocumentManager from './components/DocumentManager'
import HistoryView from './components/HistoryView'
import Modal from './components/Modal'

import {
  Activity, Search, Plus, Moon, Sun, LogOut, FileSpreadsheet, Printer,
  DatabaseBackup, LayoutDashboard, Menu, X, History,
} from 'lucide-react'

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function App() {
  const { user, loading: authLoading, signOut, nomeUsuario } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const dados = useExames(user)

  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [pastaAtiva, setPastaAtiva] = useState(null)
  const [mostrarDashboard, setMostrarDashboard] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  // Modais
  const [modalForm, setModalForm] = useState(false)
  const [exameEditando, setExameEditando] = useState(null)
  const [modalDocs, setModalDocs] = useState(null)
  const [modalHistorico, setModalHistorico] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(null)

  // Lista filtrada (busca instantanea + filtros + pasta)
  const examesFiltrados = useMemo(() => {
    let lista = dados.exames

    if (pastaAtiva) {
      const pasta = PASTAS.find((p) => p.id === pastaAtiva)
      if (pasta) lista = lista.filter(pasta.test)
    }
    if (filtroTipo) lista = lista.filter((e) => e.tipo_exame === filtroTipo)
    if (filtroMes) {
      lista = lista.filter((e) => {
        if (!e.data_solicitacao) return false
        return new Date(e.data_solicitacao).getMonth() + 1 === Number(filtroMes)
      })
    }
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      lista = lista.filter(
        (e) =>
          e.nome_paciente?.toLowerCase().includes(q) ||
          e.numero_apac?.toLowerCase().includes(q) ||
          e.tipo_exame?.toLowerCase().includes(q) ||
          e.observacoes?.toLowerCase().includes(q),
      )
    }
    return lista
  }, [dados.exames, pastaAtiva, filtroTipo, filtroMes, busca])

  // O documento sendo gerenciado precisa refletir uploads/remocoes em tempo real
  const docsExame = useMemo(() => {
    if (!modalDocs) return null
    return dados.exames.find((e) => e.id === modalDocs.id) || modalDocs
  }, [modalDocs, dados.exames])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Activity className="h-10 w-10 animate-pulse text-brand-500" />
      </div>
    )
  }

  if (!user) return <Login />

  // Handlers
  const abrirNovo = () => {
    setExameEditando(null)
    setModalForm(true)
  }
  const abrirEdicao = (e) => {
    setExameEditando(e)
    setModalForm(true)
  }
  const salvarExame = async (payload) => {
    if (exameEditando) {
      await dados.atualizarExame(exameEditando.id, payload)
    } else {
      await dados.criarExame(payload)
    }
    setModalForm(false)
    setExameEditando(null)
  }
  const excluir = async () => {
    await dados.removerExame(confirmarExclusao.id, confirmarExclusao.nome_paciente)
    setConfirmarExclusao(null)
  }

  const fazerBackup = async () => {
    const { data: documentos } = await supabase.from('documentos').select('*')
    const { data: historico } = await supabase.from('historico').select('*')
    exportarBackupJSON({
      gerado_em: new Date().toISOString(),
      gerado_por: nomeUsuario,
      exames: dados.exames.map(({ documentos, ...rest }) => rest), // eslint-disable-line no-unused-vars
      documentos: documentos || [],
      historico: historico || [],
    })
  }

  return (
    <div className="min-h-screen">
      {/* Cabecalho */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3">
          <button
            className="btn-ghost !p-2 lg:hidden"
            onClick={() => setSidebarAberta((s) => !s)}
            aria-label="Menu"
          >
            {sidebarAberta ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold leading-tight">Controle de Exames</h1>
              <p className="text-xs text-slate-400">Oncologia</p>
            </div>
          </div>

          {/* Busca instantanea */}
          <div className="relative ml-2 flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="input !py-2.5 pl-11"
              placeholder="Buscar por paciente, APAC, tipo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleTheme} className="btn-ghost !p-2.5" title="Alternar tema" aria-label="Tema">
              {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
            <button onClick={signOut} className="btn-ghost !p-2.5" title="Sair" aria-label="Sair">
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar de pastas/filtros */}
        <aside
          className={`no-print fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-white p-4 pt-20 transition-transform dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0 lg:pt-4 ${
            sidebarAberta ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 hidden items-center gap-2 px-1 lg:flex">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-400">Organizacao</span>
          </div>
          <FolderFilters
            exames={dados.exames}
            ativo={pastaAtiva}
            onSelect={(id) => {
              setPastaAtiva(id)
              setSidebarAberta(false)
            }}
          />
        </aside>

        {sidebarAberta && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarAberta(false)}
          />
        )}

        {/* Conteudo principal */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {/* Barra de acoes */}
          <div className="no-print mb-5 flex flex-wrap items-center gap-2">
            <button onClick={abrirNovo} className="btn-primary">
              <Plus className="h-5 w-5" /> Novo exame
            </button>
            <button
              onClick={() => setMostrarDashboard((s) => !s)}
              className="btn-secondary"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden sm:inline">{mostrarDashboard ? 'Ocultar' : 'Mostrar'} painel</span>
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select className="input !w-auto !py-2.5" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos os tipos</option>
                {TIPOS_EXAME.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <select className="input !w-auto !py-2.5" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
                <option value="">Todos os meses</option>
                {MESES.slice(1).map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>

              <button onClick={() => exportarExcel(examesFiltrados)} className="btn-secondary" title="Exportar Excel">
                <FileSpreadsheet className="h-5 w-5" /> <span className="hidden md:inline">Excel</span>
              </button>
              <button onClick={imprimirRelatorio} className="btn-secondary" title="Imprimir relatorio">
                <Printer className="h-5 w-5" /> <span className="hidden md:inline">Imprimir</span>
              </button>
              <button onClick={fazerBackup} className="btn-secondary" title="Backup (JSON)">
                <DatabaseBackup className="h-5 w-5" /> <span className="hidden md:inline">Backup</span>
              </button>
              <button onClick={() => setModalHistorico(true)} className="btn-secondary" title="Historico geral">
                <History className="h-5 w-5" /> <span className="hidden md:inline">Historico</span>
              </button>
            </div>
          </div>

          {/* Saudacao + cabecalho de relatorio (visivel na impressao) */}
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold">
              Relatorio de Exames
              {pastaAtiva && (
                <span className="text-brand-600">
                  {' '}— {PASTAS.find((p) => p.id === pastaAtiva)?.label}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400">
              {examesFiltrados.length} exame(s) &middot; Usuario: {nomeUsuario}
            </p>
          </div>

          {dados.error && (
            <div className="mb-5 rounded-xl bg-red-100 p-4 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
              Erro ao carregar dados: {dados.error}. Verifique a configuracao do Supabase e o schema do banco.
            </div>
          )}

          {mostrarDashboard && (
            <div className="mb-6">
              <Dashboard exames={dados.exames} />
            </div>
          )}

          {dados.loading ? (
            <div className="card flex items-center justify-center gap-2 p-12 text-slate-400">
              <Activity className="h-6 w-6 animate-pulse" /> Carregando exames...
            </div>
          ) : (
            <ExamesTable
              exames={examesFiltrados}
              onEdit={abrirEdicao}
              onDelete={setConfirmarExclusao}
              onDocs={setModalDocs}
            />
          )}
        </main>
      </div>

      {/* Modal: novo/editar exame */}
      <Modal
        open={modalForm}
        onClose={() => setModalForm(false)}
        title={exameEditando ? 'Editar exame' : 'Novo exame'}
      >
        <ExameForm
          exame={exameEditando}
          onSubmit={salvarExame}
          onCancel={() => setModalForm(false)}
        />
      </Modal>

      {/* Modal: documentos */}
      <Modal
        open={!!modalDocs}
        onClose={() => setModalDocs(null)}
        title={`Documentos — ${docsExame?.nome_paciente || ''}`}
      >
        {docsExame && (
          <DocumentManager
            exame={docsExame}
            onUpload={dados.enviarDocumento}
            onRemove={dados.removerDocumento}
          />
        )}
      </Modal>

      {/* Modal: historico geral */}
      <Modal open={modalHistorico} onClose={() => setModalHistorico(false)} title="Historico de alteracoes">
        <HistoryView />
      </Modal>

      {/* Modal: confirmar exclusao */}
      <Modal
        open={!!confirmarExclusao}
        onClose={() => setConfirmarExclusao(null)}
        title="Confirmar exclusao"
        maxWidth="max-w-md"
      >
        <p className="mb-5 text-slate-600 dark:text-slate-300">
          Tem certeza que deseja excluir o exame de{' '}
          <strong>{confirmarExclusao?.nome_paciente}</strong>? Esta acao nao pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmarExclusao(null)} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={excluir} className="btn-danger">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  )
}
