-- Resa Småland 2026 — gratis Supabase-setup
-- Kör i Supabase Dashboard → SQL Editor (Free plan räcker)
-- Gäster (utan inloggning) kan SE bilder. Bara inloggade kan LADDA UPP/ÄNDRA.

insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = true;

create table if not exists public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  caption text not null default '',
  created_at timestamptz not null default now()
);

alter table public.trip_photos enable row level security;

drop policy if exists "trip_photos select" on public.trip_photos;
drop policy if exists "trip_photos insert" on public.trip_photos;
drop policy if exists "trip_photos update" on public.trip_photos;
drop policy if exists "trip_photos delete" on public.trip_photos;

-- Guests may read the photo list.
create policy "trip_photos select"
on public.trip_photos for select to anon, authenticated using (true);

-- Only signed-in users (Niklas & Elin) may write.
create policy "trip_photos insert"
on public.trip_photos for insert to authenticated with check (true);

create policy "trip_photos update"
on public.trip_photos for update to authenticated using (true) with check (true);

create policy "trip_photos delete"
on public.trip_photos for delete to authenticated using (true);

drop policy if exists "trip-photos select" on storage.objects;
drop policy if exists "trip-photos insert" on storage.objects;
drop policy if exists "trip-photos update" on storage.objects;
drop policy if exists "trip-photos delete" on storage.objects;

-- Guests may read files (bucket is public, this covers API access too).
create policy "trip-photos select"
on storage.objects for select to anon, authenticated
using (bucket_id = 'trip-photos');

create policy "trip-photos insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'trip-photos');

create policy "trip-photos update"
on storage.objects for update to authenticated
using (bucket_id = 'trip-photos');

create policy "trip-photos delete"
on storage.objects for delete to authenticated
using (bucket_id = 'trip-photos');

grant usage on schema public to anon, authenticated;
grant select on public.trip_photos to anon;
grant select, insert, update, delete on public.trip_photos to authenticated;
