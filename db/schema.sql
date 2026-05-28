-- ════════════════════════════════════════════════════════════════════
-- Slotly database schema
-- Paste this whole file into Neon's SQL Editor (production branch) and run.
-- Safe to re-run: every statement uses IF NOT EXISTS / DROP IF EXISTS.
-- ════════════════════════════════════════════════════════════════════
--
-- How auth fits in:
--   - Neon Auth provisions a read-only mirror table at neon_auth.users_sync
--     containing { id (uuid), email, name, created_at, ... } for every user
--     that signs up through your auth endpoint.
--   - We never store passwords ourselves. The `id` column below references
--     neon_auth.users_sync.id (the Neon Auth user id, which matches the
--     `sub` claim inside the JWT the Data API receives).
--   - RLS is enforced on every table. The JWT claim `sub` is exposed by
--     PostgREST as auth.user_id() / current_setting('request.jwt.claim.sub').
-- ════════════════════════════════════════════════════════════════════


-- ── profiles ────────────────────────────────────────────────────────
-- One row per Neon Auth user. Stores Slotly-specific fields the auth
-- table doesn't carry (role, mobile, gender, dob, ...).
--
-- PREREQUISITE: Neon Auth must be enabled in your Neon Console BEFORE
-- running this schema. Auth → Enable Neon Auth → wait ~10s for the
-- neon_auth schema and users_sync table to be provisioned.
--
-- The FK to neon_auth.users_sync is added conditionally below so this
-- script doesn't hard-fail if the table isn't provisioned yet.
create table if not exists public.profiles (
  id              uuid primary key,
  role            text not null check (role in ('patient', 'doctor')),
  first_name      text not null,
  last_name       text,
  mobile          text not null,
  gender          text,
  date_of_birth   date,
  created_at      timestamptz not null default now()
);

-- Add FK to neon_auth.users_sync only when Neon Auth has been enabled.
-- Safe to re-run: skips silently if the constraint already exists or
-- if users_sync doesn't exist yet.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'neon_auth' and table_name = 'users_sync'
  ) then
    if not exists (
      select 1 from information_schema.table_constraints
      where constraint_name = 'profiles_id_fkey'
        and table_schema    = 'public'
        and table_name      = 'profiles'
    ) then
      alter table public.profiles
        add constraint profiles_id_fkey
        foreign key (id)
        references neon_auth.users_sync(id)
        on delete cascade;
      raise notice 'profiles_id_fkey added — neon_auth.users_sync found.';
    else
      raise notice 'profiles_id_fkey already exists — skipping.';
    end if;
  else
    raise warning 'neon_auth.users_sync not found — FK not added. Enable Neon Auth in the console then re-run this script.';
  end if;
end
$$;

create index if not exists profiles_role_idx   on public.profiles (role);
create index if not exists profiles_mobile_idx on public.profiles (mobile);


-- ── doctors ─────────────────────────────────────────────────────────
-- Extra fields that only apply to users with role = 'doctor'.
create table if not exists public.doctors (
  id                  uuid primary key
                      references public.profiles(id) on delete cascade,
  qualification       text not null,
  experience          text not null,
  speciality          text not null,
  appointment_price   numeric(10,2) not null,
  documents_name      text,
  created_at          timestamptz not null default now()
);

create index if not exists doctors_speciality_idx on public.doctors (speciality);


-- ════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.doctors  enable row level security;

-- Helper: extract the authenticated user id from the JWT.
-- Neon's Data API exposes JWT claims via request.jwt.claims.
create or replace function public.current_user_id()
returns uuid
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    ''
  )::uuid;
$$;

-- profiles ----------------------------------------------------------
drop policy if exists "profiles: read own"          on public.profiles;
drop policy if exists "profiles: insert own"        on public.profiles;
drop policy if exists "profiles: update own"        on public.profiles;
drop policy if exists "profiles: read doctors pub"  on public.profiles;

-- A user can read their own profile.
create policy "profiles: read own"
  on public.profiles for select
  using (id = public.current_user_id());

-- Anyone authenticated can read any *doctor* profile (for browsing).
create policy "profiles: read doctors pub"
  on public.profiles for select
  using (role = 'doctor');

-- A user can insert their own profile row (right after signup).
create policy "profiles: insert own"
  on public.profiles for insert
  with check (id = public.current_user_id());

-- A user can update their own profile.
create policy "profiles: update own"
  on public.profiles for update
  using (id = public.current_user_id());

-- doctors -----------------------------------------------------------
drop policy if exists "doctors: read all"     on public.doctors;
drop policy if exists "doctors: insert own"   on public.doctors;
drop policy if exists "doctors: update own"   on public.doctors;

-- Any authenticated visitor may read doctor profiles (catalog).
create policy "doctors: read all"
  on public.doctors for select
  using (true);

create policy "doctors: insert own"
  on public.doctors for insert
  with check (id = public.current_user_id());

create policy "doctors: update own"
  on public.doctors for update
  using (id = public.current_user_id());


-- ════════════════════════════════════════════════════════════════════
-- Grants — PostgREST exposes whatever the configured role can see.
-- Neon's Data API uses the `authenticated` role for JWT-bearing requests
-- and `anonymous` for token-less ones (only when allowAnonymous=true).
-- ════════════════════════════════════════════════════════════════════
grant usage on schema public to authenticated, anonymous;

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anonymous;

grant select, insert, update on public.doctors  to authenticated;
grant select on public.doctors to anonymous;

-- ── appointments ───────────────────────────────────────────────────
-- Tracks bookings between a patient and a doctor.
--
-- Status flow:
--   pending   → newly booked, awaiting doctor approval
--   upcoming  → doctor approved, scheduled in the future / today
--   completed → consultation finished
--   cancelled → cancelled by patient or doctor
--   rejected  → doctor declined the booking before approval
create table if not exists public.appointments (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null
                      references public.profiles(id) on delete cascade,
  doctor_id           uuid not null
                      references public.doctors(id) on delete cascade,
  appointment_date    date not null,
  start_time          text not null,
  end_time            text not null,
  fee                 numeric(10,2) not null,
  status              text not null default 'pending',
  created_at          timestamptz not null default now()
);

-- Migrate existing constraint to include the new statuses.
-- Safe to re-run because we drop the old check before adding the new one.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name   = 'appointments'
      and constraint_name = 'appointments_status_check'
  ) then
    alter table public.appointments drop constraint appointments_status_check;
  end if;
end
$$;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending', 'upcoming', 'completed', 'cancelled', 'rejected'));

-- Ensure default is 'pending' (covers the case where the table was created
-- before this change with default 'upcoming').
alter table public.appointments alter column status set default 'pending';

create index if not exists appointments_patient_idx on public.appointments (patient_id);
create index if not exists appointments_doctor_idx  on public.appointments (doctor_id);
create index if not exists appointments_status_idx  on public.appointments (status);

alter table public.appointments enable row level security;

-- appointments policies ---------------------------------------------
drop policy if exists "appointments: read own patient"   on public.appointments;
drop policy if exists "appointments: read own doctor"    on public.appointments;
drop policy if exists "appointments: insert own"         on public.appointments;
drop policy if exists "appointments: update own doctor"  on public.appointments;
drop policy if exists "appointments: update own patient" on public.appointments;

-- Patient can read their own appointments
create policy "appointments: read own patient"
  on public.appointments for select
  using (patient_id = public.current_user_id());

-- Doctor can read appointments booked with them
create policy "appointments: read own doctor"
  on public.appointments for select
  using (doctor_id = public.current_user_id());

-- Patient can insert an appointment for themselves
create policy "appointments: insert own"
  on public.appointments for insert
  with check (patient_id = public.current_user_id());

-- Doctor can update the status of appointments booked with them
-- (approve / reject / complete / cancel)
create policy "appointments: update own doctor"
  on public.appointments for update
  using      (doctor_id = public.current_user_id())
  with check (doctor_id = public.current_user_id());

-- Patient can update (cancel) their own appointments
create policy "appointments: update own patient"
  on public.appointments for update
  using      (patient_id = public.current_user_id())
  with check (patient_id = public.current_user_id());

-- Grants for appointments
grant select, insert, update on public.appointments to authenticated;

-- ── doctor_availability ────────────────────────────────────────────
-- Tracks the time slots (blocks) a doctor is available on a specific date
create table if not exists public.doctor_availability (
  id                  uuid primary key default gen_random_uuid(),
  doctor_id           uuid not null
                      references public.doctors(id) on delete cascade,
  available_date      date not null,
  start_time          text not null,
  end_time            text not null,
  label               text,
  created_at          timestamptz not null default now()
);

create index if not exists doctor_availability_doctor_idx on public.doctor_availability (doctor_id);
create index if not exists doctor_availability_date_idx   on public.doctor_availability (available_date);

alter table public.doctor_availability enable row level security;

-- doctor_availability policies
drop policy if exists "availability: read all" on public.doctor_availability;
drop policy if exists "availability: insert own" on public.doctor_availability;
drop policy if exists "availability: delete own" on public.doctor_availability;

-- Anyone authenticated can read availability blocks
create policy "availability: read all"
  on public.doctor_availability for select
  using (true);

-- Doctor can insert their own availability
create policy "availability: insert own"
  on public.doctor_availability for insert
  with check (doctor_id = public.current_user_id());

-- Doctor can delete their own availability
create policy "availability: delete own"
  on public.doctor_availability for delete
  using (doctor_id = public.current_user_id());

grant select, insert, delete on public.doctor_availability to authenticated;

-- Force PostgREST schema cache to reload
NOTIFY pgrst, reload schema;
