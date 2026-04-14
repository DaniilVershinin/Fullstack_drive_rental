-- 1. First create these users in Supabase Dashboard -> Authentication -> Users:
--    client.demo@drivego.local
--    manager.demo@drivego.local
--    admin.demo@drivego.local
--
-- 2. Then run this file in SQL Editor.
--    You may replace the emails below with your real registered emails.

update public.profiles
set full_name = 'Алексей Иванов', role = 'client', dob = '1990-05-15'
where email = 'client.demo@drivego.local';

update public.profiles
set full_name = 'Игорь Смирнов', role = 'manager', dob = '1988-08-11'
where email = 'manager.demo@drivego.local';

update public.profiles
set full_name = 'Анна Козлова', role = 'admin', dob = '1987-02-19'
where email = 'admin.demo@drivego.local';

with client_profile as (
  select id from public.profiles where email = 'client.demo@drivego.local' limit 1
),
order_seed as (
  select
    client_profile.id as user_id,
    cars.id as car_id,
    pickup_points.id as point_id,
    seed.date_from::date,
    seed.date_to::date,
    seed.total_price,
    seed.status::public.order_status,
    seed.extras::text[]
  from client_profile
  cross join (values
    ('Kia Rio', 'Москва', '2026-04-20', '2026-04-23', 5400, 'pending', array['gps']),
    ('Haval Jolion', 'Воронеж', '2026-04-25', '2026-04-28', 11700, 'active', array['insurance', 'wifi']),
    ('Kia K5', 'Липецк', '2026-05-02', '2026-05-05', 18600, 'pending', array['insurance'])
  ) as seed(car_name, city, date_from, date_to, total_price, status, extras)
  join public.cars on cars.name = seed.car_name and cars.city = seed.city
  join public.pickup_points on pickup_points.city = seed.city
)
insert into public.orders (user_id, car_id, pickup_point_id, return_point_id, date_from, date_to, total_price, status, extras)
select user_id, car_id, point_id, point_id, date_from, date_to, total_price, status, extras
from order_seed
where not exists (
  select 1
  from public.orders o
  where o.user_id = order_seed.user_id
    and o.car_id = order_seed.car_id
    and o.date_from = order_seed.date_from
    and o.date_to = order_seed.date_to
);

insert into public.payments (order_id, amount, method, status, paid_at)
select orders.id, orders.total_price, 'card', 'paid', now()
from public.orders
join public.profiles on profiles.id = orders.user_id
where profiles.email = 'client.demo@drivego.local'
  and orders.status = 'active'
  and not exists (select 1 from public.payments where payments.order_id = orders.id);
