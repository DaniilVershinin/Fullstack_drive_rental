# DriveGO — Система аренды автомобилей

Веб-приложение для онлайн-аренды автомобилей, разработанное по ТЗ курсовой работы.

## Стек технологий

| Уровень | Технология |
|---|---|
| Frontend | React 18 + TypeScript |
| Стилизация | Tailwind CSS |
| Маршрутизация | React Router v6 |
| Бэкенд / БД | Supabase (PostgreSQL + Auth + Storage) |
| Сборка | Vite |
| Хостинг | Vercel |

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Создать файл переменных окружения
cp .env.example .env

# 3. Вставить ключи Supabase в .env
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Запустить dev-сервер
npm run dev
```

Откройте http://localhost:5173

## Подключение Supabase

1. Зарегистрируйтесь на https://app.supabase.com
2. Создайте новый проект
3. Перейдите в **Project Settings → API**
4. Скопируйте `Project URL` и `anon public` ключ в `.env`

### Схема базы данных (SQL)

```sql
-- Автомобили
create table cars (
  id serial primary key,
  name text not null,
  year int,
  category text,       -- economy | comfort | business | suv
  price_per_day int,
  status text default 'available',  -- available | busy
  fuel text,
  transmission text,
  seats int,
  city text,
  photo_url text
);

-- Пункты выдачи
create table pickup_points (
  id serial primary key,
  name text,
  address text,
  city text,
  hours text,
  phone text
);

-- Дополнительные услуги
create table extras (
  id text primary key,   -- gps | child | insurance | wifi
  name text,
  price_per_day int
);

-- Заказы
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  car_id int references cars,
  pickup_point_id int references pickup_points,
  return_point_id int references pickup_points,
  date_from date,
  date_to date,
  total_price int,
  status text default 'pending',   -- pending | active | done | cancelled
  extras text[],                   -- массив id услуг
  created_at timestamptz default now()
);

-- Оплаты
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders,
  amount int,
  method text,          -- card | sbp | cash
  status text default 'pending',  -- pending | paid | failed
  paid_at timestamptz
);

-- Row Level Security
alter table orders enable row level security;
create policy "Users see own orders" on orders for select using (auth.uid() = user_id);
create policy "Users create own orders" on orders for insert with check (auth.uid() = user_id);
```

## Структура проекта

```
src/
├── components/
│   ├── Navbar.tsx          # Навигация с переключением ролей
│   ├── BookingModal.tsx     # 3-шаговое бронирование + оплата
│   └── Toasts.tsx          # Всплывающие уведомления
├── pages/
│   ├── AuthPage.tsx        # Вход / регистрация
│   ├── HomePage.tsx        # Главная со строкой поиска
│   ├── CatalogPage.tsx     # Каталог с фильтрами
│   ├── CarDetailPage.tsx   # Страница автомобиля
│   ├── CabinetPage.tsx     # Личный кабинет клиента
│   ├── ManagerPage.tsx     # Панель менеджера
│   └── AdminPage.tsx       # Панель администратора
├── data/index.ts           # Мок-данные (заменить на Supabase)
├── types/index.ts          # TypeScript-типы
├── lib/supabase.ts         # Клиент и хелперы Supabase
└── hooks/useApp.tsx        # Глобальный стейт (пользователь, роль, тосты)
```

## Реализованные требования

### Функциональные
- ✅ Регистрация / авторизация с валидацией (мин. возраст 23 года, пароль 8+ символов)
- ✅ Каталог с фильтрами по городу, категории, цене, доступности и сортировкой
- ✅ Детальная страница автомобиля — характеристики, штраф, форма дат, проверка конфликта дат
- ✅ 3-шаговое бронирование: параметры → доп. услуги → оплата с расчётом суммы
- ✅ Валидация карты (номер, срок, CVV, имя) + уведомление о платеже
- ✅ Личный кабинет: все заказы, активные, отмена (правило 24 ч), редактирование профиля
- ✅ Панель менеджера: поиск, фильтр по статусу, сортировка по колонкам, смена статуса, автопарк
- ✅ Панель администратора: аналитика (графики), пользователи с фильтрами, пункты выдачи, тарифы

### Нефункциональные
- ✅ Защита от двойного бронирования (проверка пересечения дат)
- ✅ Правило отмены за 24 часа
- ✅ Штрафы за просрочку по категории
- ✅ Row Level Security через Supabase
- ✅ Адаптивный интерфейс (Tailwind CSS)
- ✅ TypeScript-типизация

## Деплой на Vercel

```bash
# Установить Vercel CLI
npm i -g vercel

# Задеплоить
vercel

# Добавить env-переменные в Vercel Dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```
