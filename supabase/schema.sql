-- Esquema fase 1: convocatorias, asistencia, partidos de EA y tarjetas.
-- Ejecutar en Supabase > SQL Editor.

create table if not exists players (
  id            bigint generated always as identity primary key,
  discord_id    text unique not null,
  discord_name  text,
  gamertag      text,             -- lo pone el jugador con /vincular
  ea_player_id  text unique,      -- se resuelve solo al cruzar con los partidos de EA
  created_at    timestamptz not null default now()
);

create table if not exists sessions (            -- convocatorias
  id             bigint generated always as identity primary key,
  guild_id       text,
  channel_id     text,
  match_type     text not null check (match_type in ('liga', 'amistoso')),
  starts_at      timestamptz not null,
  note           text,
  created_by     text,
  reminder_sent  boolean not null default false,
  closed         boolean not null default false,  -- ya se evaluaron las ausencias
  created_at     timestamptz not null default now()
);

create table if not exists rsvps (
  session_id  bigint not null references sessions(id) on delete cascade,
  discord_id  text not null,
  status      text not null check (status in ('voy', 'no', 'quizas')),
  updated_at  timestamptz not null default now(),
  primary key (session_id, discord_id)
);

create table if not exists matches (
  match_id       text primary key,
  played_at      timestamptz not null,
  match_type     text not null,      -- leagueMatch | friendlyMatch | playoffMatch
  goals_for      int,
  goals_against  int,
  result         text,               -- victoria | derrota | empate | victoria_dnf | derrota_dnf
  opponent       text,
  raw            jsonb,
  created_at     timestamptz not null default now()
);

create table if not exists match_players (
  match_id        text not null references matches(match_id) on delete cascade,
  ea_player_id    text not null,
  gamertag        text,
  pos             text,
  seconds_played  int,
  rating          numeric,
  goals           int,
  assists         int,
  mom             boolean,
  primary key (match_id, ea_player_id)
);

create table if not exists cards (
  id          bigint generated always as identity primary key,
  discord_id  text not null,
  type        text not null check (type in ('amarilla', 'roja')),
  reason      text,
  session_id  bigint references sessions(id) on delete set null,
  match_id    text references matches(match_id) on delete set null,
  auto        boolean not null default true,   -- false = puesta a mano por el capitán
  created_by  text,
  created_at  timestamptz not null default now()
);

create index if not exists sessions_starts_at_idx on sessions (starts_at);
create index if not exists matches_played_at_idx on matches (played_at);
create index if not exists cards_discord_idx on cards (discord_id);

-- RLS activado sin políticas: solo el backend (service role) puede leer/escribir.
alter table players       enable row level security;
alter table sessions      enable row level security;
alter table rsvps         enable row level security;
alter table matches       enable row level security;
alter table match_players enable row level security;
alter table cards         enable row level security;

-- Estado del club en EA (una sola fila, la actualiza el sync)
create table if not exists club_status (
  id                int primary key default 1 check (id = 1),
  current_division  int,               -- numeración de EA: 1 = Élite, 2 = División 1 … 6 = División 5
  best_division     int,
  updated_at        timestamptz not null default now()
);
alter table club_status enable row level security;
