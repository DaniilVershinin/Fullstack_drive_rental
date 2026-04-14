alter table public.cars add column if not exists drive text;
alter table public.cars add column if not exists horsepower int;
alter table public.cars add column if not exists engine_volume text;
alter table public.cars add column if not exists body_type text;
alter table public.cars add column if not exists color text;
alter table public.cars add column if not exists trunk_volume int;
alter table public.cars add column if not exists photo_url text;

update public.cars set
  drive = 'Передний',
  horsepower = 123,
  engine_volume = '1.6 л',
  body_type = 'Седан',
  color = 'Белый',
  trunk_volume = 480
where name = 'Kia Rio';

update public.cars set
  drive = 'Передний',
  horsepower = 178,
  engine_volume = '2.5 л',
  body_type = 'Седан',
  color = 'Черный',
  trunk_volume = 493
where name = 'Toyota Camry';

update public.cars set
  drive = 'Полный',
  horsepower = 249,
  engine_volume = '2.0 л',
  body_type = 'Седан',
  color = 'Синий',
  trunk_volume = 530
where name = 'BMW 5 Series';

update public.cars set
  drive = 'Полный',
  horsepower = 199,
  engine_volume = '2.5 л',
  body_type = 'Кроссовер',
  color = 'Серый',
  trunk_volume = 580
where name = 'Toyota RAV4';

update public.cars set
  drive = 'Передний',
  horsepower = 123,
  engine_volume = '1.6 л',
  body_type = 'Седан',
  color = 'Серебристый',
  trunk_volume = 480
where name = 'Hyundai Solaris';

update public.cars set
  drive = 'Задний',
  horsepower = 197,
  engine_volume = '2.0 л',
  body_type = 'Седан',
  color = 'Черный',
  trunk_volume = 540
where name = 'Mercedes E-Class';

update public.cars set
  drive = 'Полный',
  horsepower = 180,
  engine_volume = '2.0 л',
  body_type = 'Кроссовер',
  color = 'Белый',
  trunk_volume = 615
where name = 'VW Tiguan';

update public.cars set
  drive = 'Передний',
  horsepower = 150,
  engine_volume = '1.4 л',
  body_type = 'Лифтбек',
  color = 'Серый',
  trunk_volume = 568
where name = 'Skoda Octavia';

update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Kia%20Rio%20sedan' where name = 'Kia Rio';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Toyota%20Camry%20sedan' where name = 'Toyota Camry';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?BMW%205%20Series%20sedan' where name = 'BMW 5 Series';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Toyota%20RAV4%20suv' where name = 'Toyota RAV4';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Hyundai%20Solaris%20sedan' where name = 'Hyundai Solaris';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Mercedes%20E%20Class%20sedan' where name = 'Mercedes E-Class';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Volkswagen%20Tiguan%20suv' where name = 'VW Tiguan';
update public.cars set photo_url = 'https://source.unsplash.com/1200x800/?Skoda%20Octavia%20car' where name = 'Skoda Octavia';

insert into public.cars (name, year, category, price_per_day, status, icon, fuel, transmission, seats, city, drive, horsepower, engine_volume, body_type, color, trunk_volume, photo_url)
select *
from (values
  ('Lada Vesta SW Cross', 2024, 'economy'::public.car_category, 2100, 'available'::public.car_status, '🚗', 'Бензин', 'Механика', 5, 'Воронеж', 'Передний', 122, '1.8 л', 'Универсал', 'Красный', 480, 'https://source.unsplash.com/1200x800/?Lada%20Vesta%20SW%20Cross'),
  ('Haval Jolion', 2024, 'suv'::public.car_category, 3900, 'available'::public.car_status, '🚙', 'Бензин', 'Робот', 5, 'Воронеж', 'Полный', 150, '1.5 л', 'Кроссовер', 'Синий', 337, 'https://source.unsplash.com/1200x800/?Haval%20Jolion'),
  ('Geely Coolray', 2023, 'comfort'::public.car_category, 3600, 'available'::public.car_status, '🚙', 'Бензин', 'Робот', 5, 'Белгород', 'Передний', 150, '1.5 л', 'Кроссовер', 'Серый', 330, 'https://source.unsplash.com/1200x800/?Geely%20Coolray'),
  ('Chery Tiggo 7 Pro', 2023, 'suv'::public.car_category, 4300, 'available'::public.car_status, '🚙', 'Бензин', 'Вариатор', 5, 'Старый Оскол', 'Передний', 147, '1.5 л', 'Кроссовер', 'Белый', 475, 'https://source.unsplash.com/1200x800/?Chery%20Tiggo%207%20Pro'),
  ('Kia K5', 2022, 'business'::public.car_category, 6200, 'available'::public.car_status, '🚘', 'Бензин', 'Автомат', 5, 'Липецк', 'Передний', 194, '2.5 л', 'Седан', 'Черный', 510, 'https://source.unsplash.com/1200x800/?Kia%20K5%20sedan'),
  ('Renault Duster', 2021, 'suv'::public.car_category, 3100, 'busy'::public.car_status, '🚙', 'Бензин', 'Механика', 5, 'Елец', 'Полный', 143, '2.0 л', 'Кроссовер', 'Зеленый', 408, 'https://source.unsplash.com/1200x800/?Renault%20Duster'),
  ('Volkswagen Polo', 2022, 'economy'::public.car_category, 1900, 'available'::public.car_status, '🚗', 'Бензин', 'Автомат', 5, 'Борисоглебск', 'Передний', 110, '1.6 л', 'Лифтбек', 'Белый', 530, 'https://source.unsplash.com/1200x800/?Volkswagen%20Polo%20sedan'),
  ('Toyota Corolla', 2022, 'comfort'::public.car_category, 3200, 'available'::public.car_status, '🚘', 'Бензин', 'Вариатор', 5, 'Россошь', 'Передний', 122, '1.6 л', 'Седан', 'Серебристый', 470, 'https://source.unsplash.com/1200x800/?Toyota%20Corolla%20sedan')
) as v(name, year, category, price_per_day, status, icon, fuel, transmission, seats, city, drive, horsepower, engine_volume, body_type, color, trunk_volume, photo_url)
where not exists (
  select 1 from public.cars c where c.name = v.name and c.city = v.city
);

insert into public.pickup_points (name, address, city, hours, phone)
select *
from (values
  ('Центр', 'пр-т Революции, 38', 'Воронеж', '08:00-22:00', '+7 473 000-10-01'),
  ('Аэропорт', 'аэропорт Чертовицкое', 'Воронеж', '08:00-23:00', '+7 473 000-10-02'),
  ('Центр', 'Гражданский пр-т, 47', 'Белгород', '08:00-21:00', '+7 472 000-20-01'),
  ('Автовокзал', 'ул. Привокзальная, 1', 'Старый Оскол', '09:00-20:00', '+7 472 000-20-02'),
  ('Центр', 'ул. Советская, 64', 'Липецк', '08:00-21:00', '+7 474 000-30-01'),
  ('Вокзал', 'пл. Привокзальная, 1', 'Елец', '09:00-20:00', '+7 474 000-30-02'),
  ('Центр', 'ул. Свободы, 190', 'Борисоглебск', '09:00-19:00', '+7 473 000-40-01'),
  ('Центр', 'пл. Ленина, 8', 'Россошь', '09:00-19:00', '+7 473 000-40-02')
) as p(name, address, city, hours, phone)
where not exists (
  select 1 from public.pickup_points pp where pp.name = p.name and pp.address = p.address and pp.city = p.city
);
