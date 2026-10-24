create or replace function public.delete_own_farm(confirmation_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_farm_name text;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select farms.name
  into current_farm_name
  from public.farms
  where farms.owner_id = current_user_id
  for update;

  if current_farm_name is null then
    raise exception 'Farm workspace not found.';
  end if;

  if confirmation_name is distinct from current_farm_name then
    raise exception 'Farm name confirmation does not match.';
  end if;

  delete from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'Account deletion failed.';
  end if;
end;
$$;

revoke all on function public.delete_own_farm(text) from public, anon;
grant execute on function public.delete_own_farm(text) to authenticated;
