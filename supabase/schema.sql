-- ApplyReady schema. Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null, -- null until the magic link is confirmed
  email text,
  reminders_enabled boolean not null default false,
  source_url text,
  title text not null,
  organization text,
  type text not null,                          -- scholarship | job | admission | grant | other
  deadline date,                               -- null = no fixed deadline
  deadline_text text,                          -- as written in the announcement
  tight boolean not null default false,
  key_details jsonb not null default '[]',     -- [{label, value, importance}]
  guidance jsonb not null default '[]',        -- [{piece, wordLimit, points[]}]
  status text not null default 'in_progress',  -- in_progress | submitted
  submitted_at timestamptz,
  follow_up_at timestamptz,
  follow_up_sent boolean not null default false,
  last_reminder_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  title text not null,
  detail text,
  importance text not null,                    -- critical | important | nice
  best_by date,
  done boolean not null default false,
  position int not null
);

create index if not exists checklist_items_application_id on checklist_items(application_id);
create index if not exists applications_user_id on applications(user_id);

-- No public policies: the browser never talks to these tables directly.
-- All reads and writes go through server routes using the service role key.
alter table applications enable row level security;
alter table checklist_items enable row level security;
