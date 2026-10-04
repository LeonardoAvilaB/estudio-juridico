-- ============================================================================
-- Aislamiento por abogado (Row Level Security)
--
-- Toda la separación entre estudios depende de estas políticas: la app filtra
-- por `abogado_id` en cada consulta, pero eso es una comodidad y no una barrera
-- (cualquiera con la anon key puede consultar la API directamente). Sin RLS
-- activo, un abogado puede leer los clientes y pagos de todos los demás.
--
-- Correr en el SQL Editor de Supabase. Es idempotente: se puede correr de nuevo.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Activar RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.pagos    enable row level security;
alter table public.notas    enable row level security;

-- ---------------------------------------------------------------------------
-- 2. profiles: cada uno ve y edita solo el suyo
-- ---------------------------------------------------------------------------
drop policy if exists "perfil propio: leer"   on public.profiles;
drop policy if exists "perfil propio: editar" on public.profiles;

create policy "perfil propio: leer"
  on public.profiles for select
  using (id = auth.uid());

create policy "perfil propio: editar"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- El plan y el cupo no los define el usuario. Sin esto, cualquiera puede hacer
-- un update de su propia fila y subirse el límite de clientes.
create or replace function public.bloquear_cambio_de_plan()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.plan is distinct from old.plan
     or new.limite_clientes is distinct from old.limite_clientes then
    raise exception 'El plan y el límite de clientes no se pueden modificar desde la app';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bloquear_cambio_de_plan on public.profiles;
create trigger trg_bloquear_cambio_de_plan
  before update on public.profiles
  for each row execute function public.bloquear_cambio_de_plan();

-- ---------------------------------------------------------------------------
-- 3. clientes: dueño = abogado_id
-- ---------------------------------------------------------------------------
drop policy if exists "clientes propios: leer"     on public.clientes;
drop policy if exists "clientes propios: crear"    on public.clientes;
drop policy if exists "clientes propios: editar"   on public.clientes;
drop policy if exists "clientes propios: eliminar" on public.clientes;

create policy "clientes propios: leer"
  on public.clientes for select
  using (abogado_id = auth.uid());

-- `with check` evita que se cree un cliente a nombre de otro abogado.
create policy "clientes propios: crear"
  on public.clientes for insert
  with check (abogado_id = auth.uid());

create policy "clientes propios: editar"
  on public.clientes for update
  using (abogado_id = auth.uid())
  with check (abogado_id = auth.uid());

create policy "clientes propios: eliminar"
  on public.clientes for delete
  using (abogado_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. pagos y notas: cuelgan del cliente, así que heredan su dueño
-- ---------------------------------------------------------------------------
create or replace function public.es_cliente_propio(id_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clientes c
    where c.id = id_cliente and c.abogado_id = auth.uid()
  );
$$;

drop policy if exists "pagos propios: leer"     on public.pagos;
drop policy if exists "pagos propios: crear"    on public.pagos;
drop policy if exists "pagos propios: editar"   on public.pagos;
drop policy if exists "pagos propios: eliminar" on public.pagos;

create policy "pagos propios: leer"
  on public.pagos for select using (public.es_cliente_propio(cliente_id));
create policy "pagos propios: crear"
  on public.pagos for insert with check (public.es_cliente_propio(cliente_id));
create policy "pagos propios: editar"
  on public.pagos for update
  using (public.es_cliente_propio(cliente_id))
  with check (public.es_cliente_propio(cliente_id));
create policy "pagos propios: eliminar"
  on public.pagos for delete using (public.es_cliente_propio(cliente_id));

drop policy if exists "notas propias: leer"     on public.notas;
drop policy if exists "notas propias: crear"    on public.notas;
drop policy if exists "notas propias: editar"   on public.notas;
drop policy if exists "notas propias: eliminar" on public.notas;

create policy "notas propias: leer"
  on public.notas for select using (public.es_cliente_propio(cliente_id));
create policy "notas propias: crear"
  on public.notas for insert with check (public.es_cliente_propio(cliente_id));
create policy "notas propias: editar"
  on public.notas for update
  using (public.es_cliente_propio(cliente_id))
  with check (public.es_cliente_propio(cliente_id));
create policy "notas propias: eliminar"
  on public.notas for delete using (public.es_cliente_propio(cliente_id));

-- ---------------------------------------------------------------------------
-- 5. Índices
--
-- Ahora la app filtra en el servidor en vez de traerse la tabla entera, así que
-- estas columnas se usan en cada consulta.
-- ---------------------------------------------------------------------------
create index if not exists idx_clientes_abogado    on public.clientes (abogado_id);
create index if not exists idx_pagos_cliente       on public.pagos    (cliente_id);
create index if not exists idx_pagos_fecha         on public.pagos    (fecha_pago desc);
create index if not exists idx_notas_cliente       on public.notas    (cliente_id);

-- ---------------------------------------------------------------------------
-- 6. Verificación
--
-- Las cuatro tablas deben quedar con rowsecurity = true.
-- ---------------------------------------------------------------------------
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'clientes', 'pagos', 'notas')
order by tablename;
