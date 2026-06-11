-- ============================================================================
--  Controle de Exames Oncologicos  -  Schema do Supabase
--  Execute este arquivo no SQL Editor do Supabase (Dashboard > SQL Editor).
-- ============================================================================

-- Extensao para gerar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tabela principal: exames
-- ----------------------------------------------------------------------------
create table if not exists public.exames (
  id                uuid primary key default gen_random_uuid(),
  nome_paciente     text not null,
  tipo_exame        text not null check (tipo_exame in ('TC', 'US', 'MG', 'RX')),
  numero_apac       text,
  data_solicitacao  date not null,
  data_entrada      date not null,
  possui_apac       boolean not null default false,
  possui_laudo      boolean not null default false,
  pedido_original   boolean not null default false,
  observacoes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_exames_paciente on public.exames (nome_paciente);
create index if not exists idx_exames_tipo on public.exames (tipo_exame);
create index if not exists idx_exames_apac on public.exames (numero_apac);
create index if not exists idx_exames_data on public.exames (data_solicitacao);

-- ----------------------------------------------------------------------------
-- Documentos anexados a cada exame (PDF / fotos)
-- ----------------------------------------------------------------------------
create table if not exists public.documentos (
  id            uuid primary key default gen_random_uuid(),
  exame_id      uuid not null references public.exames (id) on delete cascade,
  tipo          text not null check (tipo in ('pedido', 'apac', 'laudo', 'pdf')),
  nome_arquivo  text not null,
  caminho       text not null,
  url           text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_documentos_exame on public.documentos (exame_id);

-- ----------------------------------------------------------------------------
-- Historico de alteracoes
-- ----------------------------------------------------------------------------
create table if not exists public.historico (
  id          uuid primary key default gen_random_uuid(),
  exame_id    uuid references public.exames (id) on delete set null,
  usuario     text,
  acao        text not null,
  detalhes    text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_historico_exame on public.historico (exame_id);
create index if not exists idx_historico_data on public.historico (created_at desc);

-- ----------------------------------------------------------------------------
-- Atualiza updated_at automaticamente
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_exames_updated_at on public.exames;
create trigger trg_exames_updated_at
  before update on public.exames
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Politica: qualquer usuario autenticado pode ler/gravar.
-- Ajuste conforme a politica do seu hospital.
-- ----------------------------------------------------------------------------
alter table public.exames enable row level security;
alter table public.documentos enable row level security;
alter table public.historico enable row level security;

drop policy if exists "auth_all_exames" on public.exames;
create policy "auth_all_exames" on public.exames
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_documentos" on public.documentos;
create policy "auth_all_documentos" on public.documentos
  for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_historico" on public.historico;
create policy "auth_all_historico" on public.historico
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Storage: bucket "documentos"
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;

drop policy if exists "auth_upload_documentos" on storage.objects;
create policy "auth_upload_documentos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos');

drop policy if exists "auth_read_documentos" on storage.objects;
create policy "auth_read_documentos" on storage.objects
  for select to public
  using (bucket_id = 'documentos');

drop policy if exists "auth_delete_documentos" on storage.objects;
create policy "auth_delete_documentos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos');

-- ----------------------------------------------------------------------------
-- (Opcional) Dados de exemplo - descomente para popular
-- ----------------------------------------------------------------------------
-- insert into public.exames (nome_paciente, tipo_exame, data_solicitacao, data_entrada, possui_apac, possui_laudo, pedido_original)
-- values
--   ('Maria Silva', 'TC', current_date - 25, current_date - 20, false, false, false),
--   ('Joao Souza', 'MG', current_date - 10, current_date - 8, true, false, false),
--   ('Ana Costa', 'US', current_date - 30, current_date - 28, true, true, true);
