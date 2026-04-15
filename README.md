# DriveGO

DriveGO - приложение для аренды автомобилей: каталог, бронирование, личный кабинет, панель менеджера и панель администратора. Фронтенд написан на React/Vite, данные и авторизация идут через Supabase. Если Supabase не настроен, приложение запускается на демо-данных.

## Стек

- React 18, TypeScript, Vite
- React Router
- Tailwind CSS и локальные CSS-компоненты
- Supabase Auth, PostgreSQL, RLS
- Vitest и Testing Library
- Vercel для деплоя SPA

## Запуск

```bash
npm install
npm run dev
```

Локально приложение откроется на `http://localhost:5173`.

Проверка перед деплоем:

```bash
npm run build
npm run test:run
```

## Переменные окружения

Создайте `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Где взять значения:

1. Откройте проект Supabase.
2. Перейдите в `Project Settings` -> `API Keys`.
3. Скопируйте `Project URL` в `VITE_SUPABASE_URL`.
4. Скопируйте publishable/anon key в `VITE_SUPABASE_ANON_KEY`.

Никогда не добавляйте `service_role` key во фронтенд, `.env`, Vercel Environment Variables для клиента или README.

## Supabase

1. Создайте проект Supabase.
2. Откройте `SQL Editor`.
3. Запустите [supabase/schema.sql](./supabase/schema.sql).
4. При необходимости запустите [supabase/seed_more.sql](./supabase/seed_more.sql).
5. Создавайте пользователей через `Authentication` -> `Users`.
6. Для тестовых заказов используйте [supabase/seed_users_orders_template.sql](./supabase/seed_users_orders_template.sql), предварительно подставив реальные UUID пользователей.

Роли хранятся в `public.profiles.role`:

- `client` - личный кабинет и бронирование.
- `manager` - `/manager`, обработка заказов и статусы машин.
- `admin` - `/admin`, управление машинами, пунктами выдачи и пользователями.

Выдать роль можно вручную в SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Новые пользователи всегда создаются с ролью `client`. Роль из client-side metadata намеренно игнорируется.

## Деплой на Vercel

Настройки проекта:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

В `Project Settings` -> `Environment Variables` добавьте:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

После изменения переменных окружения сделайте новый deploy.

## Безопасность

В проект добавлены основные меры защиты для SPA + Supabase:

- CSP в [vercel.json](./vercel.json): `default-src 'self'`, запрет `object-src`, запрет iframe-встраивания через `frame-ancestors`, ограниченные `connect-src`, `img-src`, `script-src`, `worker-src`, `media-src` и `manifest-src`.
- Включен `require-trusted-types-for 'script'` и `trusted-types default`, чтобы дополнительно закрыть DOM XSS sinks в браузерах с поддержкой Trusted Types.
- Дополнительные HTTP headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Origin-Agent-Cluster`, `X-DNS-Prefetch-Control`, `X-Permitted-Cross-Domain-Policies`.
- React не использует `dangerouslySetInnerHTML`.
- Пользовательские подписи для SVG fallback экранируются через `escapeXml`.
- URL фотографий машин принимаются только как `https://` и только с доверенных хостов: `source.unsplash.com`, `images.unsplash.com`, `*.supabase.co`.
- Данные форм тримятся перед записью.
- Доступ к `/cabinet`, `/manager`, `/admin` закрыт через protected routes.
- Для чувствительных действий используется per-tab CSRF action token из `sessionStorage`: сохранение машин/пунктов, изменение статусов, бронирование, отмена заказа, обновление профиля.
- CSRF token ротируется после логина/регистрации и пересоздается после выхода.
- Перед мутациями приложение проверяет наличие действующей Supabase JWT-сессии. Для записи в БД используется пользователь из JWT, а не `userId`, пришедший из UI.
- Supabase Auth session хранится в `sessionStorage`, а не в `localStorage`, чтобы JWT не переживал закрытие вкладки.
- SQL-запросы выполняются через Supabase query builder, без ручной конкатенации SQL на клиенте.
- RLS включен для `profiles`, `cars`, `pickup_points`, `extras`, `orders`, `payments`.
- Клиент может видеть и менять только свои данные в рамках политик.
- Клиент может только отменить свой pending-заказ, если до начала аренды осталось не меньше 24 часов.
- На уровне базы запрещены пересекающиеся активные/ожидающие бронирования одной машины.
- На уровне базы запрещено бронирование машины со статусом не `available`.
- На уровне базы добавлены check constraints для цен, дат, количества мест, HTTPS-фото и непустых профилей.
- Клиент не может повысить себе роль через регистрацию или обновление профиля.
- Платежи из клиентского приложения не получают доверенный статус `paid` на уровне БД.
- Trigger-функции безопасности в Supabase закрыты от прямого вызова ролями `public`, `anon`, `authenticated`.

Важно: CORS настраивается на стороне API/провайдера. Для этой SPA не выставляется `Access-Control-Allow-Origin: *`, потому что это расширило бы доступ без необходимости. Границы сетевых подключений ограничены через CSP `connect-src`.

### CORS

В репозитории нет собственного API-сервера, поэтому CORS не должен настраиваться во фронтенде wildcard-заголовками. Безопасная модель такая:

- Статический фронтенд отдается Vercel без `Access-Control-Allow-Origin: *`.
- Запросы из приложения ограничены CSP `connect-src 'self' https://*.supabase.co wss://*.supabase.co`.
- Supabase принимает запросы по своему API и дополнительно защищает данные через Auth + RLS.
- Если появится свой backend, CORS нужно задавать там allowlist-ом конкретных production/staging origin, без `*` для приватных данных.

### CSRF

В текущей архитектуре нет cookie-based backend endpoint, поэтому классическая CSRF-атака ограничена: сторонний сайт не может прочитать Supabase JWT из storage и отправить авторизованный Supabase-запрос от имени пользователя. Тем не менее в приложении добавлен дополнительный action token:

- CSRF token создается криптографически случайным значением через Web Crypto.
- Token хранится в `sessionStorage`, то есть живет в рамках вкладки.
- Token обязателен для всех клиентских mutation helpers в [src/lib/api.ts](./src/lib/api.ts).
- Token проверяется перед записью и перед проверкой JWT.
- Token ротируется после логина/регистрации и очищается/пересоздается при выходе.

Если появится собственный backend с cookie-сессиями, нужно добавить полноценную серверную CSRF-защиту: `SameSite=Lax/Strict` cookies, `HttpOnly`, `Secure`, double-submit или synchronizer token, проверку `Origin`/`Referer` и запрет state-changing `GET`.

### CSP

CSP сейчас разрешает только:

- Скрипты приложения с текущего origin.
- Стили приложения и Google Fonts stylesheet.
- Шрифты с `fonts.gstatic.com`.
- Картинки с текущего origin, `data:`, `blob:`, Unsplash и Supabase Storage.
- Сетевые запросы только к текущему origin и Supabase.

Если добавляется новый CDN, аналитика, платежный SDK или домен картинок, его нужно явно добавить в [vercel.json](./vercel.json) и, для фото машин, в allowlist [src/lib/security.ts](./src/lib/security.ts).

### XSS

Защита от XSS держится на нескольких слоях:

- React по умолчанию экранирует текстовые значения.
- В коде нет `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`.
- SVG fallback не вставляет пользовательский текст без XML escaping.
- URL картинок проверяются и не принимают `javascript:`, `http:`, HTML/data URL или неизвестные домены.
- CSP и Trusted Types снижают шанс выполнения инъекции даже если будущий код ошибочно добавит опасный DOM sink.

### SQL-инъекции

На клиенте нет ручной сборки SQL-строк. Все операции идут через Supabase query builder: `select`, `eq`, `insert`, `update`. Дополнительно:

- Каждая мутация требует действующий Supabase JWT.
- Для бронирования `user_id` берется из JWT-сессии, а не из client state.
- Права доступа проверяются RLS-политиками в базе.
- Критичная бизнес-логика проверяется trigger-функциями в базе, а не только UI.
- Роли нельзя назначить через client metadata.
- Клиентские значения ограничены check constraints и enum-типами.
- Для seed/template SQL нельзя подставлять пользовательский ввод без ручной проверки.

### JWT

Supabase Auth выдает JWT access token после входа. Приложение использует его через Supabase client:

- Сессия хранится в `sessionStorage`, а не в долгоживущем `localStorage`.
- `detectSessionInUrl` отключен, чтобы приложение не принимало токены из URL fragment/query без необходимости.
- Перед мутациями вызывается `supabase.auth.getSession()`.
- Если `access_token` или `session.user.id` отсутствуют, запись блокируется.
- Supabase SDK отправляет JWT в запросах к Supabase API.
- RLS-политики и функции БД используют `auth.uid()`, который вычисляется из JWT.
- UI `user.id` не считается доверенным источником для создания заказа.

## Что еще нужно сделать для продакшена

- Включить email confirmation в Supabase Auth.
- Настроить список разрешенных redirect URL в Supabase Auth.
- Хранить фото машин в Supabase Storage или доверенном CDN и добавить домен в CSP `img-src` и allowlist `TRUSTED_IMAGE_HOSTS`.
- Подключить реальный платежный провайдер на серверной стороне. Не обрабатывать настоящие карты в браузере.
- Включить MFA для администраторов и менеджеров.
- Ограничить доступ к Supabase dashboard и Vercel по принципу минимальных прав.
- Проверить production-домен через Mozilla Observatory или аналогичный scanner после деплоя.

## Фото машин

Через интерфейс:

1. Войдите пользователем с ролью `admin`.
2. Откройте `/admin`.
3. Перейдите во вкладку автомобилей.
4. В поле `Фото URL` укажите прямую HTTPS-ссылку на изображение с разрешенного домена.
5. Сохраните машину.

Через SQL:

```sql
update public.cars
set photo_url = 'https://your-project.supabase.co/storage/v1/object/public/car-photos/camry.jpg'
where name = 'Toyota Camry';
```

Если `photo_url` пустой или изображение не загрузилось, приложение покажет локальный SVG fallback.

## Структура

```text
src/
  components/
    BookingModal.tsx
    CarImage.tsx
    Navbar.tsx
    Toasts.tsx
  data/
    index.ts
  hooks/
    useApp.tsx
  lib/
    api.ts
    carImages.ts
    security.ts
    supabase.ts
  pages/
    AdminPage.tsx
    AuthPage.tsx
    CabinetPage.tsx
    CarDetailPage.tsx
    CatalogPage.tsx
    HomePage.tsx
    ManagerPage.tsx
  test/
    *.test.tsx
  types/
    index.ts
supabase/
  schema.sql
  seed_more.sql
  seed_users_orders_template.sql
```

## Частые проблемы

Если приложение показывает демо-данные:

- Проверьте наличие `.env`.
- Проверьте `VITE_SUPABASE_URL`.
- Проверьте `VITE_SUPABASE_ANON_KEY`.
- Перезапустите dev-сервер после изменения `.env`.

Если запросы к Supabase возвращают ошибку доступа:

- Убедитесь, что применен актуальный `supabase/schema.sql`.
- Проверьте, что пользователь авторизован.
- Проверьте роль пользователя в `public.profiles`.
- Для менеджерских и админских действий нужна роль `manager` или `admin`.

Если фото не отображается:

- URL должен начинаться с `https://`.
- URL должен вести прямо на изображение.
- Домен изображения должен быть разрешен в CSP `img-src` в `vercel.json`.
- Домен изображения должен быть разрешен в `TRUSTED_IMAGE_HOSTS` или подходить под `*.supabase.co` в `src/lib/security.ts`.
