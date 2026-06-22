-- ============================================================
--  Pedidos Alvaro — Esquema para Supabase (Postgres)
--  Copiá y pegá TODO esto en: Supabase → SQL Editor → Run.
--  Es seguro ejecutarlo más de una vez.
-- ============================================================

-- ---------- Perfiles de usuario (rol y estado) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'trabajador'
             check (role in ('administrador','encargado','trabajador')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando alguien se registra.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Devuelve el rol del usuario actual (para las políticas de seguridad).
create or replace function public.user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------- Proveedores ----------
create table if not exists public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  contact_name text,
  phone        text,
  whatsapp     text,
  email        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Faltantes (cuaderno digital) ----------
create table if not exists public.shortages (
  id                 text primary key,
  product_id         text,
  product_snapshot   jsonb,
  supplier           text,
  unclassified_text  text,
  quantity           numeric not null default 1,
  unit               text not null default 'unidad',
  urgency            text not null default 'normal' check (urgency in ('baja','normal','alta')),
  status             text not null default 'pendiente'
                     check (status in ('pendiente','revisado','pedido','recibido','cancelado')),
  notes              text,
  location           text,
  purchase_order_id  text,
  created_by         uuid references public.profiles(id),
  created_by_name    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists shortages_status_idx on public.shortages (status);
create index if not exists shortages_supplier_idx on public.shortages (supplier);

-- ---------- Pedidos de compra ----------
create table if not exists public.purchase_orders (
  id              text primary key,
  supplier        text not null,
  status          text not null default 'borrador'
                  check (status in ('borrador','enviado','recibido','cancelado')),
  notes           text,
  created_by      uuid references public.profiles(id),
  created_by_name text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id                text primary key default gen_random_uuid()::text,
  purchase_order_id text not null references public.purchase_orders(id) on delete cascade,
  shortage_id       text,
  label             text not null,
  quantity          numeric not null default 1,
  unit              text not null default 'unidad'
);

-- ============================================================
--  Seguridad por filas (RLS)
--  Regla simple para personal de confianza: cualquier usuario
--  autenticado puede leer y operar; solo administradores
--  gestionan usuarios.
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.suppliers           enable row level security;
alter table public.shortages           enable row level security;
alter table public.purchase_orders     enable row level security;
alter table public.purchase_order_items enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for update to authenticated
  using (public.user_role() = 'administrador') with check (true);

-- Tablas operativas: lectura/escritura para autenticados.
do $$
declare t text;
begin
  foreach t in array array['suppliers','shortages','purchase_orders','purchase_order_items'] loop
    execute format('drop policy if exists %1$s_all on public.%1$s', t);
    execute format('create policy %1$s_all on public.%1$s for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ============================================================
--  PASO FINAL: convertite en administrador
--  Cambiá el email por el tuyo y ejecutá esta línea una vez,
--  después de haber creado tu cuenta desde la app.
-- ============================================================
-- update public.profiles set role = 'administrador'
-- where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
