import { Component } from 'react'

/** Captura erros de render e mostra uma tela amigavel em vez de tela branca. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-2xl font-extrabold text-red-500">⚠️ Algo deu errado</p>
        <pre className="max-w-full overflow-auto rounded-xl bg-slate-800 p-4 text-left text-xs text-red-300">
          {this.state.erro.stack || String(this.state.erro)}
        </pre>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Recarregar página
        </button>
      </div>
    )
  }
}
