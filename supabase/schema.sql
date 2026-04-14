do $$ begin create type public.user_role as enum ('client', 'manager', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.car_category as enum ('economy', 'comfort', 'business', 'suv'); exception when duplicate_object then null; end $$;
do $$ begin create type public.car_status as enum ('available', 'busy'); exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum ('pending', 'active', 'done', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pending', 'paid', 'failed'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'client',
  dob date,
  phone text,
  driver_license text,
  created_at timestamptz not null default now()
);

create table if not exists public.cars (
  id bigint generated always as identity primary key,
  name text not null,
  year int not null,
  category public.car_category not null,
  price_per_day int not null,
  status public.car_status not null default 'available',
  icon text not null default '🚗',
  fuel text not null,
  transmission text not null,
  seats int not null default 5,
  city text not null,
  drive text,
  horsepower int,
  engine_volume text,
  body_type text,
  color text,
  trunk_volume int,
  photo_url text
);

create table if not exists public.pickup_points (
  id bigint generated always as identity primary key,
  name text not null,
  address text not null,
  city text not null,
  hours text not null,
  phone text
);

create table if not exists public.extras (
  id text primary key,
  name text not null,
  price_per_day int not null
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  car_id bigint not null references public.cars(id),
  pickup_point_id bigint references public.pickup_points(id),
  return_point_id bigint references public.pickup_points(id),
  date_from date not null,
  date_to date not null,
  total_price int not null,
  status public.order_status not null default 'pending',
  extras text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint orders_dates_valid check (date_to > date_from)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount int not null,
  method text not null check (method in ('card', 'sbp', 'cash')),
  status public.payment_status not null default 'pending',
  paid_at timestamptz
);

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'client'::public.user_role);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, dob, phone, driver_license)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')::public.user_role,
    nullif(new.raw_user_meta_data->>'dob', '')::date,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'driver_license'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    dob = excluded.dob,
    phone = excluded.phone,
    driver_license = excluded.driver_license;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.pickup_points enable row level security;
alter table public.extras enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profiles select own or staff" on public.profiles;
create policy "profiles select own or staff" on public.profiles
for select using (auth.uid() = id or public.current_role() in ('manager', 'admin'));

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "cars public read" on public.cars;
create policy "cars public read" on public.cars for select using (true);

drop policy if exists "cars staff write" on public.cars;
create policy "cars staff write" on public.cars
for all using (public.current_role() in ('manager', 'admin')) with check (public.current_role() in ('manager', 'admin'));

drop policy if exists "pickup points public read" on public.pickup_points;
create policy "pickup points public read" on public.pickup_points for select using (true);

drop policy if exists "pickup points admin write" on public.pickup_points;
create policy "pickup points admin write" on public.pickup_points
for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy if exists "extras public read" on public.extras;
create policy "extras public read" on public.extras for select using (true);

drop policy if exists "extras admin write" on public.extras;
create policy "extras admin write" on public.extras
for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy if exists "orders select own or staff" on public.orders;
create policy "orders select own or staff" on public.orders
for select using (auth.uid() = user_id or public.current_role() in ('manager', 'admin'));

drop policy if exists "orders insert own" on public.orders;
create policy "orders insert own" on public.orders
for insert with check (auth.uid() = user_id);

drop policy if exists "orders update own cancel or staff" on public.orders;
create policy "orders update own cancel or staff" on public.orders
for update using (auth.uid() = user_id or public.current_role() in ('manager', 'admin'))
with check (auth.uid() = user_id or public.current_role() in ('manager', 'admin'));

drop policy if exists "payments select own or staff" on public.payments;
create policy "payments select own or staff" on public.payments
for select using (
  public.current_role() in ('manager', 'admin')
  or exists (select 1 from public.orders where orders.id = payments.order_id and orders.user_id = auth.uid())
);

drop policy if exists "payments insert own" on public.payments;
create policy "payments insert own" on public.payments
for insert with check (
  exists (select 1 from public.orders where orders.id = payments.order_id and orders.user_id = auth.uid())
);

insert into public.cars (name, year, category, price_per_day, status, icon, fuel, transmission, seats, city)
values
  ('Kia Rio', 2022, 'economy', 1800, 'available', '🚗', 'Бензин', 'Механика', 5, 'Москва'),
  ('Toyota Camry', 2023, 'comfort', 3500, 'available', '🚙', 'Гибрид', 'Автомат', 5, 'Москва'),
  ('BMW 5 Series', 2023, 'business', 7500, 'busy', '🏎️', 'Бензин', 'Автомат', 5, 'Санкт-Петербург'),
  ('Toyota RAV4', 2022, 'suv', 4200, 'available', '🚐', 'Бензин', 'Автомат', 5, 'Москва'),
  ('Hyundai Solaris', 2023, 'economy', 1600, 'available', '🚗', 'Бензин', 'Механика', 5, 'Казань'),
  ('Mercedes E-Class', 2023, 'business', 9000, 'available', '🏎️', 'Дизель', 'Автомат', 5, 'Санкт-Петербург'),
  ('VW Tiguan', 2022, 'suv', 5200, 'busy', '🚐', 'Бензин', 'Автомат', 7, 'Новосибирск'),
  ('Skoda Octavia', 2023, 'comfort', 2800, 'available', '🚙', 'Дизель', 'Автомат', 5, 'Москва')
on conflict do nothing;

alter table public.cars add column if not exists drive text;
alter table public.cars add column if not exists horsepower int;
alter table public.cars add column if not exists engine_volume text;
alter table public.cars add column if not exists body_type text;
alter table public.cars add column if not exists color text;
alter table public.cars add column if not exists trunk_volume int;

insert into public.extras (id, name, price_per_day)
values
  ('gps', 'GPS навигатор', 200),
  ('child', 'Детское кресло', 300),
  ('insurance', 'Полная страховка', 500),
  ('wifi', 'Wi-Fi роутер', 150)
on conflict (id) do update set name = excluded.name, price_per_day = excluded.price_per_day;

insert into public.pickup_points (name, address, city, hours, phone)
values
  ('Центр', 'Тверская, 15', 'Москва', '07:00-22:00', '+7 495 000-00-01'),
  ('Аэропорт', 'Шереметьево', 'Москва', '24/7', '+7 495 000-00-02'),
  ('Невский', 'Невский пр-т, 40', 'Санкт-Петербург', '08:00-21:00', '+7 812 000-00-01'),
  ('Баумана', 'ул. Баумана, 12', 'Казань', '09:00-20:00', '+7 843 000-00-01')
on conflict do nothing;
