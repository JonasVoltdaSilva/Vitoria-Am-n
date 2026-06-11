import { useCallback, useEffect, useState } from 'react'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import * as local from '../lib/localStore'
import { enrich } from '../lib/statusRules'

/**
 * Hook central de dados: carrega exames, documentos e expoe operacoes CRUD,
 * upload de documentos e registro de historico.
 *
 * Funciona em dois modos:
 *  - Supabase (quando VITE_SUPABASE_URL esta configurado)
 *  - Local (localStorage + IndexedDB) — dados salvos no proprio dispositivo
 */
export function useExames(user) {
  const [exames, setExames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const hoje = new Date()

    if (!supabase) {
      // Modo local
      try {
        const data = await local.listExames()
        setExames(data.map((e) => enrich(e, hoje)))
      } catch (err) {
        setError(err.message)
        setExames([])
      }
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('exames')
      .select('*, documentos(*)')
      .order('data_solicitacao', { ascending: false })

    if (error) {
      setError(error.message)
      setExames([])
    } else {
      setExames((data || []).map((e) => enrich(e, hoje)))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Registra uma entrada no historico de alteracoes
  const registrarHistorico = useCallback(
    async (exameId, acao, detalhes = '') => {
      const entrada = {
        exame_id: exameId,
        usuario: user?.user_metadata?.nome || user?.email || 'sistema',
        acao,
        detalhes,
      }
      if (!supabase) {
        await local.addHistorico(entrada)
        return
      }
      await supabase.from('historico').insert(entrada)
    },
    [user],
  )

  const criarExame = useCallback(
    async (payload) => {
      let data
      if (!supabase) {
        data = await local.createExame(payload)
      } else {
        const res = await supabase.from('exames').insert(payload).select().single()
        if (res.error) throw res.error
        data = res.data
      }
      await registrarHistorico(data.id, 'CRIACAO', `Exame criado para ${data.nome_paciente}`)
      await carregar()
      return data
    },
    [carregar, registrarHistorico],
  )

  const atualizarExame = useCallback(
    async (id, payload) => {
      let data
      if (!supabase) {
        data = await local.updateExame(id, payload)
      } else {
        const res = await supabase.from('exames').update(payload).eq('id', id).select().single()
        if (res.error) throw res.error
        data = res.data
      }
      await registrarHistorico(id, 'EDICAO', `Exame atualizado: ${data.nome_paciente}`)
      await carregar()
      return data
    },
    [carregar, registrarHistorico],
  )

  const removerExame = useCallback(
    async (id, nome) => {
      if (!supabase) {
        await local.deleteExame(id)
      } else {
        const { error } = await supabase.from('exames').delete().eq('id', id)
        if (error) throw error
      }
      await registrarHistorico(id, 'EXCLUSAO', `Exame removido: ${nome || ''}`)
      await carregar()
    },
    [carregar, registrarHistorico],
  )

  // Upload de um documento (PDF/foto) vinculado ao exame
  const enviarDocumento = useCallback(
    async (exameId, file, tipo) => {
      if (!supabase) {
        await local.addDocumento(exameId, file, tipo)
      } else {
        const ext = file.name.split('.').pop()
        const caminho = `${exameId}/${tipo}-${Date.now()}.${ext}`

        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(caminho, file, { upsert: false })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(caminho)

        const { error: insErr } = await supabase.from('documentos').insert({
          exame_id: exameId,
          tipo,
          nome_arquivo: file.name,
          caminho,
          url: pub.publicUrl,
        })
        if (insErr) throw insErr
      }

      await registrarHistorico(exameId, 'UPLOAD', `Documento anexado (${tipo}): ${file.name}`)
      await carregar()
    },
    [carregar, registrarHistorico],
  )

  const removerDocumento = useCallback(
    async (doc) => {
      if (!supabase) {
        await local.removeDocumento(doc)
      } else {
        await supabase.storage.from(STORAGE_BUCKET).remove([doc.caminho])
        const { error } = await supabase.from('documentos').delete().eq('id', doc.id)
        if (error) throw error
      }
      await registrarHistorico(doc.exame_id, 'EXCLUSAO_DOC', `Documento removido: ${doc.nome_arquivo}`)
      await carregar()
    },
    [carregar, registrarHistorico],
  )

  return {
    exames,
    loading,
    error,
    recarregar: carregar,
    criarExame,
    atualizarExame,
    removerExame,
    enviarDocumento,
    removerDocumento,
  }
}
