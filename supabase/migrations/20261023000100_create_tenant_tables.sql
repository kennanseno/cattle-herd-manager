create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cattle (
  farm_id uuid not null references public.farms (id) on delete cascade,
  tag_number text not null,
  nickname text not null default '',
  date_of_birth date not null,
  sire_tag_number text not null default '',
  dam_tag_number text not null default '',
  sex text not null check (sex in ('male', 'female')),
  breed text not null,
  birth_weight numeric,
  weaning_weight numeric,
  image_path text not null default '',
  photos text,
  notes text,
  status text not null check (status in ('active', 'sold', 'deceased', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (farm_id, tag_number)
);

create table public.breeding (
  farm_id uuid not null references public.farms (id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  cow_tag_number text not null,
  sire_tag_number text not null default '',
  breed_date date not null,
  breed_date_to date,
  possible_calving_date date not null,
  actual_calving_date date,
  calf_tag_number text not null default '',
  notes text not null default '',
  status text not null check (status in ('pending', 'calved', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (farm_id, id),
  check (breed_date_to is null or breed_date_to >= breed_date)
);

create table public.health (
  farm_id uuid not null references public.farms (id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  record_date date not null,
  vaccination_type text not null default '',
  tag_numbers text not null default '',
  veterinarian text not null default '',
  cost numeric,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (farm_id, id)
);

create table public.finances (
  farm_id uuid not null references public.farms (id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  date date not null,
  date_to date,
  type text not null check (type in ('income', 'expense')),
  category text not null default '',
  amount numeric not null,
  description text not null default '',
  notes text not null default '',
  related_tag_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (farm_id, id),
  check (date_to is null or date_to >= date)
);

create table public.farm_settings (
  farm_id uuid primary key references public.farms (id) on delete cascade,
  owner_name text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  logo_path text not null default ''
);

create table public.pdf_exports (
  farm_id uuid not null references public.farms (id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  tag_number text not null,
  generated_at timestamptz not null default now(),
  owner_name text not null default '',
  notes text not null default '',
  sample_copy boolean not null default false,
  primary key (farm_id, id)
);

create index cattle_farm_status_idx on public.cattle (farm_id, status);
create index breeding_farm_cow_date_idx on public.breeding (farm_id, cow_tag_number, breed_date desc);
create index health_farm_date_idx on public.health (farm_id, record_date desc);
create index finances_farm_date_idx on public.finances (farm_id, date desc);
create index pdf_exports_farm_generated_idx on public.pdf_exports (farm_id, generated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger farms_set_updated_at
before update on public.farms
for each row execute function public.set_updated_at();

create trigger cattle_set_updated_at
before update on public.cattle
for each row execute function public.set_updated_at();

create trigger breeding_set_updated_at
before update on public.breeding
for each row execute function public.set_updated_at();

create trigger health_set_updated_at
before update on public.health
for each row execute function public.set_updated_at();

create trigger finances_set_updated_at
before update on public.finances
for each row execute function public.set_updated_at();

create or replace function public.create_farm_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(
    pg_catalog.btrim(new.raw_user_meta_data ->> 'farm_name'),
    ''
  );

  if requested_name is null or pg_catalog.char_length(requested_name) < 2 then
    requested_name := 'My Farm';
  elsif pg_catalog.char_length(requested_name) > 120 then
    requested_name := pg_catalog.left(requested_name, 120);
  end if;

  insert into public.farms (owner_id, name)
  values (new.id, requested_name)
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_create_farm
after insert on auth.users
for each row execute function public.create_farm_for_new_user();

create or replace function public.user_owns_farm(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farms
    where id = target_farm_id
      and owner_id = (select auth.uid())
  );
$$;

revoke all on function public.user_owns_farm(uuid) from public, anon;
grant execute on function public.user_owns_farm(uuid) to authenticated;
revoke all on function public.create_farm_for_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

alter table public.farms enable row level security;
alter table public.cattle enable row level security;
alter table public.breeding enable row level security;
alter table public.health enable row level security;
alter table public.finances enable row level security;
alter table public.farm_settings enable row level security;
alter table public.pdf_exports enable row level security;

revoke all on table public.farms from anon, authenticated;
grant select on table public.farms to authenticated;
grant update (name) on table public.farms to authenticated;

create policy "Users can view their own farm"
on public.farms for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can rename their own farm"
on public.farms for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

revoke all on table public.cattle, public.breeding, public.health,
  public.finances, public.farm_settings, public.pdf_exports from anon, authenticated;
grant select, insert, update, delete on table public.cattle, public.breeding,
  public.health, public.finances, public.farm_settings, public.pdf_exports to authenticated;

create policy "Farm owners can manage cattle"
on public.cattle for all to authenticated
using ((select public.user_owns_farm(farm_id)))
with check ((select public.user_owns_farm(farm_id)));

create policy "Farm owners can manage breeding"
on public.breeding for all to authenticated
using ((select public.user_owns_farm(farm_id)))
with check ((select public.user_owns_farm(farm_id)));

create policy "Farm owners can manage health"
on public.health for all to authenticated
using ((select public.user_owns_farm(farm_id)))
with check ((select public.user_owns_farm(farm_id)));

create policy "Farm owners can manage finances"
on public.finances for all to authenticated
using ((select public.user_owns_farm(farm_id)))
with check ((select public.user_owns_farm(farm_id)));

create policy "Farm owners can manage settings"
on public.farm_settings for all to authenticated
using ((select public.user_owns_farm(farm_id)))
with check ((select public.user_owns_farm(farm_id)));

create policy "Farm owners can manage PDF exports"
on public.pdf_exports for all to authenticated
using ((select public.user_owns_farm(farm_id)))
with check ((select public.user_owns_farm(farm_id)));
