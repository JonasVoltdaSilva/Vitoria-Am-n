/**
 * Armazenamento local (modo offline / sem Supabase).
 * - Exames e historico: localStorage (JSON pequeno)
 * - Arquivos (PDF/fotos): IndexedDB (suporta arquivos grandes)
 *
 * A API espelha a usada com o Supabase, entao o app funciona igual nos dois modos.
 */

const LS_EXAMES = 'onco_exames'
const LS_HISTORICO = 'onco_historico'
export const LS_USUARIO = 'onco_usuario'

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`

function lsGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}
function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ----------------------------------------------------------------------------
// IndexedDB para os arquivos
// ----------------------------------------------------------------------------
function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('onco-documentos', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('docs', { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(registro) {
  return abrirDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('docs', 'readwrite')
        tx.objectStore('docs').put(registro)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

function idbAll() {
  return abrirDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = db.transaction('docs', 'readonly').objectStore('docs').getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      }),
  )
}

function idbDelete(id) {
  return abrirDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('docs', 'readwrite')
        tx.objectStore('docs').delete(id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

// Cache de Object URLs para nao recriar a cada render
const urlCache = new Map()
function urlDoBlob(id, blob) {
  if (!urlCache.has(id)) {
    try {
      // Garante um Blob valido (alguns ambientes serializam o File em objeto)
      const b = blob instanceof Blob ? blob : new Blob([blob])
      urlCache.set(id, URL.createObjectURL(b))
    } catch {
      urlCache.set(id, '') // nao quebra a listagem se o arquivo estiver corrompido
    }
  }
  return urlCache.get(id)
}

// ----------------------------------------------------------------------------
// Exames
// ----------------------------------------------------------------------------
export async function listExames() {
  const exames = lsGet(LS_EXAMES)
  const docs = await idbAll().catch(() => [])
  const porExame = new Map()
  for (const d of docs) {
    const lista = porExame.get(d.exame_id) || []
    lista.push({
      id: d.id,
      exame_id: d.exame_id,
      tipo: d.tipo,
      nome_arquivo: d.nome_arquivo,
      caminho: d.id,
      url: urlDoBlob(d.id, d.blob),
      created_at: d.created_at,
    })
    porExame.set(d.exame_id, lista)
  }
  return exames
    .map((e) => ({ ...e, documentos: porExame.get(e.id) || [] }))
    .sort((a, b) => (b.data_solicitacao || '').localeCompare(a.data_solicitacao || ''))
}

export async function createExame(payload) {
  const exames = lsGet(LS_EXAMES)
  const novo = { id: uid(), created_at: new Date().toISOString(), ...payload }
  exames.push(novo)
  lsSet(LS_EXAMES, exames)
  return novo
}

export async function updateExame(id, payload) {
  const exames = lsGet(LS_EXAMES)
  const i = exames.findIndex((e) => e.id === id)
  if (i === -1) throw new Error('Exame nao encontrado.')
  exames[i] = { ...exames[i], ...payload, updated_at: new Date().toISOString() }
  lsSet(LS_EXAMES, exames)
  return exames[i]
}

export async function deleteExame(id) {
  lsSet(LS_EXAMES, lsGet(LS_EXAMES).filter((e) => e.id !== id))
  const docs = await idbAll().catch(() => [])
  await Promise.all(docs.filter((d) => d.exame_id === id).map((d) => idbDelete(d.id)))
}

// ----------------------------------------------------------------------------
// Documentos
// ----------------------------------------------------------------------------
export async function addDocumento(exameId, file, tipo) {
  await idbPut({
    id: uid(),
    exame_id: exameId,
    tipo,
    nome_arquivo: file.name,
    blob: file,
    created_at: new Date().toISOString(),
  })
}

export async function removeDocumento(doc) {
  urlCache.delete(doc.id)
  await idbDelete(doc.id)
}

// ----------------------------------------------------------------------------
// Historico
// ----------------------------------------------------------------------------
export async function addHistorico({ exame_id, usuario, acao, detalhes }) {
  const hist = lsGet(LS_HISTORICO)
  hist.unshift({
    id: uid(),
    exame_id,
    usuario,
    acao,
    detalhes,
    created_at: new Date().toISOString(),
  })
  // Mantem no maximo 500 registros
  lsSet(LS_HISTORICO, hist.slice(0, 500))
}

export async function listHistorico(exameId) {
  const hist = lsGet(LS_HISTORICO)
  return exameId ? hist.filter((h) => h.exame_id === exameId) : hist
}

// ----------------------------------------------------------------------------
// Backup
// ----------------------------------------------------------------------------
export async function backupLocal() {
  const docs = await idbAll().catch(() => [])
  return {
    exames: lsGet(LS_EXAMES),
    documentos: docs.map(({ blob, ...meta }) => meta), // eslint-disable-line no-unused-vars
    historico: lsGet(LS_HISTORICO),
  }
}
