-- ============================================================
--  BANCO DE QUESTÕES EMMAN - Schema Supabase
--  Cole este SQL no SQL Editor do Supabase (em partes se precisar)
-- ============================================================

-- ── 1. EXTENSÕES ──────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 2. TABELA DE PERFIS (espelha auth.users) ─────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text unique not null,
  name        text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user','admin')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Trigger: cria perfil automaticamente no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3. ÁREAS / DISCIPLINAS ────────────────────────────────
create table public.areas (
  id    serial primary key,
  slug  text unique not null,  -- 'biologia', 'matematica', etc.
  name  text not null,
  icon  text,                  -- emoji ou nome do ícone
  color text,                  -- hex: '#22c55e'
  categoria text not null check (categoria in ('humanas','exatas','natureza','linguagens','redacao'))
);

insert into public.areas (slug, name, icon, color, categoria) values
  ('matematica',       'Matemática',          '📐', '#6366f1', 'exatas'),
  ('fisica',           'Física',              '⚡', '#f59e0b', 'exatas'),
  ('quimica',          'Química',             '🧪', '#10b981', 'exatas'),
  ('biologia',         'Biologia',            '🧬', '#22c55e', 'natureza'),
  ('historia',         'História',            '🏛️', '#ef4444', 'humanas'),
  ('geografia',        'Geografia',           '🌍', '#3b82f6', 'humanas'),
  ('filosofia',        'Filosofia',           '🤔', '#8b5cf6', 'humanas'),
  ('sociologia',       'Sociologia',          '👥', '#ec4899', 'humanas'),
  ('portugues',        'Português',           '📚', '#f97316', 'linguagens'),
  ('literatura',       'Literatura',          '📖', '#14b8a6', 'linguagens'),
  ('ingles',           'Inglês',              '🇬🇧', '#0ea5e9', 'linguagens'),
  ('espanhol',         'Espanhol',            '🇪🇸', '#f43f5e', 'linguagens'),
  ('redacao',          'Redação',             '✍️', '#a855f7', 'redacao');

-- ── 4. VESTIBULARES ──────────────────────────────────────
create table public.vestibulares (
  id    serial primary key,
  slug  text unique not null,  -- 'enem', 'uva', 'fuvest', etc.
  name  text not null,
  logo_url text,
  uf    text                   -- estado (null = nacional)
);

insert into public.vestibulares (slug, name, uf) values
  ('enem',   'ENEM',            null),
  ('uva',    'UVA',             'CE'),
  ('fuvest', 'FUVEST',         'SP'),
  ('unicamp','UNICAMP',         'SP'),
  ('uece',   'UECE',           'CE'),
  ('upe',    'UPE',            'PE'),
  ('ufce',   'UFC',            'CE');

-- ── 5. QUESTÕES ──────────────────────────────────────────
create table public.questions (
  id            uuid default uuid_generate_v4() primary key,
  vestibular_id integer references public.vestibulares not null,
  area_id       integer references public.areas not null,
  ano           integer not null check (ano >= 2000 and ano <= 2100),
  numero        integer,                         -- número na prova original
  enunciado     text not null,
  contexto      text,                            -- texto de apoio, se houver
  imagem_url    text,                            -- imagem no enunciado
  alternativas  jsonb not null,
  -- formato: [{"letra":"A","texto":"...","correta":false}, ...]
  gabarito      char(1) not null check (gabarito in ('A','B','C','D','E')),
  explicacao    text,                            -- resolução comentada
  dificuldade   text default 'medio' check (dificuldade in ('facil','medio','dificil')),
  tags          text[],
  ativo         boolean default true,
  created_by    uuid references public.profiles,
  created_at    timestamptz default now()
);

create index idx_questions_vestibular on public.questions(vestibular_id);
create index idx_questions_area on public.questions(area_id);
create index idx_questions_ano on public.questions(ano);

-- ── 6. PROVAS SEMANAIS (Enem do Emman) ───────────────────
create table public.weekly_exams (
  id           uuid default uuid_generate_v4() primary key,
  titulo       text not null default 'Enem do Emman',
  semana_inicio date not null,  -- segunda-feira da semana
  semana_fim   date not null,   -- domingo da semana
  descricao    text,
  publicada    boolean default false,
  created_at   timestamptz default now()
);

-- questões de cada prova semanal
create table public.weekly_exam_questions (
  id            serial primary key,
  exam_id       uuid references public.weekly_exams on delete cascade,
  question_id   uuid references public.questions on delete cascade,
  ordem         integer,
  caderno       text check (caderno in ('humanas','exatas')),  -- qual caderno
  unique (exam_id, question_id)
);

-- ── 7. RESPOSTAS DOS USUÁRIOS ─────────────────────────────
create table public.user_answers (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles on delete cascade not null,
  question_id uuid references public.questions not null,
  exam_id     uuid references public.weekly_exams,  -- null = questão avulsa
  resposta    char(1) check (resposta in ('A','B','C','D','E')),
  correta     boolean,
  tempo_seg   integer,  -- tempo em segundos para responder
  created_at  timestamptz default now(),
  unique(user_id, question_id, exam_id)
);

create index idx_user_answers_user on public.user_answers(user_id);
create index idx_user_answers_question on public.user_answers(question_id);

-- ── 8. ESTATÍSTICAS (view) ────────────────────────────────
create or replace view public.user_stats as
select
  ua.user_id,
  count(*) as total_respondidas,
  count(*) filter (where ua.correta) as total_corretas,
  round(count(*) filter (where ua.correta) * 100.0 / nullif(count(*), 0), 1) as pct_acerto,
  avg(ua.tempo_seg) as tempo_medio_seg,
  count(distinct ua.question_id) as questoes_unicas
from public.user_answers ua
group by ua.user_id;

-- ── 9. RLS - ROW LEVEL SECURITY ──────────────────────────
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.weekly_exams enable row level security;
alter table public.weekly_exam_questions enable row level security;
alter table public.user_answers enable row level security;

-- Perfis: cada um vê o próprio; admin vê todos
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

create policy "profiles_admin" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Questões: qualquer autenticado lê; só admin escreve
create policy "questions_read" on public.questions
  for select using (auth.role() = 'authenticated' and ativo = true);

create policy "questions_admin" on public.questions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Provas: qualquer autenticado lê publicadas; admin gerencia
create policy "exams_read" on public.weekly_exams
  for select using (auth.role() = 'authenticated' and publicada = true);

create policy "exams_admin" on public.weekly_exams
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "exam_questions_read" on public.weekly_exam_questions
  for select using (auth.role() = 'authenticated');

create policy "exam_questions_admin" on public.weekly_exam_questions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Respostas: cada um vê/cria as suas
create policy "answers_own" on public.user_answers
  for all using (auth.uid() = user_id);

-- ── 10. FUNÇÃO: TORNAR ADMIN (só você usa no SQL Editor) ──
-- Para dar admin a alguém:
-- select set_admin('email@exemplo.com');
create or replace function public.set_admin(target_email text)
returns text language plpgsql security definer as $$
declare
  rows_affected integer;
begin
  update public.profiles set role = 'admin'
  where email = target_email;
  get diagnostics rows_affected = row_count;
  if rows_affected = 0 then
    return 'Usuário não encontrado: ' || target_email;
  end if;
  return 'Admin concedido para: ' || target_email;
end;
$$;

-- ── 11. FUNÇÃO: GERAR PROVA SEMANAL AUTOMÁTICA ───────────
create or replace function public.generate_weekly_exam()
returns uuid language plpgsql security definer as $$
declare
  new_exam_id uuid;
  seg date := date_trunc('week', current_date)::date;
  dom date := seg + 6;
  q record;
  ord integer := 1;
begin
  -- Cria a prova
  insert into public.weekly_exams (semana_inicio, semana_fim, publicada)
  values (seg, dom, true)
  returning id into new_exam_id;

  -- Caderno Humanas: 45 questões (historia, geo, filosofia, sociologia)
  for q in (
    select id from public.questions
    where area_id in (select id from public.areas where categoria = 'humanas')
      and vestibular_id = (select id from public.vestibulares where slug = 'enem')
      and ativo = true
    order by random() limit 45
  ) loop
    insert into public.weekly_exam_questions (exam_id, question_id, ordem, caderno)
    values (new_exam_id, q.id, ord, 'humanas');
    ord := ord + 1;
  end loop;

  ord := 1;
  -- Caderno Exatas: 45 questões (matematica, fisica, quimica, biologia)
  for q in (
    select id from public.questions
    where area_id in (select id from public.areas where categoria in ('exatas','natureza'))
      and vestibular_id = (select id from public.vestibulares where slug = 'enem')
      and ativo = true
    order by random() limit 45
  ) loop
    insert into public.weekly_exam_questions (exam_id, question_id, ordem, caderno)
    values (new_exam_id, q.id, ord, 'exatas');
    ord := ord + 1;
  end loop;

  return new_exam_id;
end;
$$;