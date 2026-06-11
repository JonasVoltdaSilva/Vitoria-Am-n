# 🩺 Controle de Exames Oncológicos

Sistema web **responsivo** para controle de exames oncológicos (**Tomografia, Ultrassom, Mamografia e Raio-X**), com foco em gerenciar **APACs, laudos e documentos físicos** recebidos pela oncologia.

Construído com **React + Vite**, **Tailwind CSS** e **Supabase** (banco de dados, autenticação e armazenamento de arquivos).

---

## ✨ Funcionalidades

- **Tabela principal** com: paciente, tipo de exame, data da solicitação, data de entrada, possui APAC?, possui laudo?, pedido original?, observações e status.
- **Regras automáticas de status** (calculadas em tempo real):
  | Condição | Status |
  | --- | --- |
  | APAC = Não, Laudo = Não, Original = Não | `SEM APAC E SEM LAUDO` |
  | APAC = Não, Original = Sim | `ORIGINAL SEM APAC` |
  | APAC = Sim, Laudo = Não | `AGUARDANDO LAUDO` |
  | APAC = Sim, Laudo = Sim | `FINALIZADO` |
- **Controle dos 20 dias**: calcula `dias decorridos = hoje − data da solicitação`. Se `≥ 20 dias` **e** sem APAC, exibe alerta vermelho **"PODE PROCURAR APAC"** com ícone de alerta.
- **Busca instantânea** por nome do paciente, número da APAC, mês e tipo de exame.
- **Upload de documentos** (PDF, foto do pedido, foto da APAC, foto do laudo), armazenados por paciente no Supabase Storage.
- **Dashboard com gráficos**: sem APAC, aguardando laudo, finalizados, originais sem APAC e aptos para procurar APAC (>20 dias).
- **Organização automática** em pastas/filtros (TC sem APAC e sem laudo, TC original sem APAC, TC aguardando laudo, TC finalizado, US/MG/RX sem APAC).
- **Recursos avançados**: histórico de alterações, usuários e login, exportação para Excel, impressão de relatórios e backup (JSON).
- **Interface hospitalar**: botões grandes, **modo escuro**, compatível com celular e computador.

---

## 🚀 Como rodar

### 1. Pré-requisitos
- Node.js 18+ e npm
- Uma conta no [Supabase](https://supabase.com) (plano gratuito serve)

### 2. Configurar o Supabase
1. Crie um novo projeto no Supabase.
2. Abra **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql). Isso cria as tabelas, políticas (RLS) e o bucket de Storage `documentos`.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env`:
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### 4. Instalar e iniciar
```bash
npm install
npm run dev
```
Acesse `http://localhost:5173`. Crie um usuário na tela de cadastro (confirme o e-mail conforme a configuração de Auth do seu projeto Supabase) e faça login.

### 5. Build de produção
```bash
npm run build
npm run preview   # pré-visualiza o build localmente
```
O conteúdo final fica em `dist/` — publique em qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages, etc.).

---

## 🗂️ Estrutura do projeto

```
.
├── index.html
├── supabase/
│   └── schema.sql            # Tabelas, RLS, triggers e bucket de Storage
└── src/
    ├── main.jsx
    ├── App.jsx               # Layout, busca, filtros e orquestração dos modais
    ├── index.css             # Tailwind + componentes (botões grandes, dark mode)
    ├── context/
    │   ├── AuthContext.jsx    # Login / cadastro / sessão (Supabase Auth)
    │   └── ThemeContext.jsx   # Modo claro/escuro
    ├── hooks/
    │   └── useExames.js       # CRUD, upload de documentos e histórico
    ├── lib/
    │   ├── supabase.js        # Cliente Supabase
    │   ├── statusRules.js     # Regras de status, 20 dias e pastas automáticas
    │   └── exportUtils.js     # Excel, backup JSON e impressão
    └── components/
        ├── Login.jsx
        ├── Dashboard.jsx      # KPIs + gráficos (Recharts)
        ├── ExamesTable.jsx    # Tabela (desktop) + cartões (mobile)
        ├── FolderFilters.jsx  # Pastas automáticas
        ├── ExameForm.jsx      # Cadastro/edição com preview do status
        ├── DocumentManager.jsx
        ├── HistoryView.jsx
        ├── StatusBadge.jsx
        └── Modal.jsx
```

---

## 🔐 Segurança

- A autenticação é feita pelo **Supabase Auth**.
- As tabelas usam **Row Level Security (RLS)**: por padrão, qualquer usuário **autenticado** pode ler e gravar. Ajuste as políticas em `supabase/schema.sql` conforme as regras do seu hospital (ex.: restringir por perfil/setor).
- A **anon key** é pública por natureza — a proteção real vem das políticas de RLS.

---

## 💾 Backup

O botão **Backup** exporta um arquivo JSON com exames, documentos (metadados) e histórico. Para backups gerenciados e point-in-time recovery, utilize também os recursos nativos de backup do Supabase.

---

## 📄 Licença

Uso interno / hospitalar. Adapte conforme necessário.
