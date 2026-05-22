# PRO Монтаж

Веб-приложение для заказа и управления услугами по установке и обслуживанию дверей. Клиенты оформляют заявки, менеджеры обрабатывают заказы, ведут каталог услуг и работают с пользователями.

## Возможности

**Пользователь**
- Регистрация и вход (JWT)
- Просмотр каталога услуг и скачивание прайса в PDF
- Создание заявок с адресом и комментарием
- Личный кабинет: профиль, аватар, мои заявки
- Уведомления о смене статуса заказа

**Менеджер**
- Список всех заявок и детальная карточка заказа
- Смена статуса, назначение специалиста, даты работ
- Загрузка файлов к заявке
- CRUD услуг (цена, название)
- Управление пользователями

## Стек

| Часть | Технологии |
|-------|------------|
| Backend | Django 6, Django REST Framework, Simple JWT, drf-yasg, PostgreSQL |
| Frontend | React 18, Vite, React Router, Sass |
| Прочее | Pillow (аватары), ReportLab (PDF), Docker Compose |

## Структура проекта

```
door_app_local/
├── app/
│   ├── users/      # пользователи, магазины, авторизация
│   ├── orders/     # заявки, услуги, уведомления
│   └── manager/    # API панели менеджера
├── config/         # настройки Django
├── frontend/       # React-приложение (Vite)
├── media/          # загруженные файлы
├── docker-compose.yml
├── Dockerfile
├── docker/
│   ├── entrypoint.sh
│   ├── wait-for-db.sh
│   ├── up.sh
│   └── .env.docker
├── manage.py
├── create_test_data.py
├── requirements.txt
└── .env.example
```

---

## Как запустить проект

Ниже — то, что нужно сделать человеку, который впервые открывает репозиторий на своём компьютере.

### Что понадобится

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose (в Docker Desktop уже есть; в Linux — пакет `docker-compose-plugin`)
- Git (чтобы склонировать репозиторий)

Устанавливать Python, Node.js и PostgreSQL **на компьютер не нужно**. База PostgreSQL поднимается в отдельном Docker-контейнере: при первом запуске образ `postgres:16-alpine` скачивается автоматически, база `doors_db` создаётся сама.

### Шаг 1. Скачать проект

```bash
git clone <URL-репозитория> door_app_local
cd door_app_local
```

Если проект уже лежит в папке — просто перейдите в неё:

```bash
cd door_app_local
```

### Шаг 2. Запустить

```bash
docker compose up --build
```

Или через скрипт (сначала скачает образ PostgreSQL, если его ещё нет):

```bash
./docker/up.sh
```

При первом запуске Docker:

1. Скачает образ PostgreSQL (если ещё не был на машине)
2. Соберёт образы backend и frontend
3. Дождётся готовности базы и применит миграции
4. Создаст тестовые аккаунты и услуги

Дождитесь в логах сообщений о том, что backend слушает порт `8000`, а frontend — `5173`. Окно терминала не закрывайте — пока оно открыто, проект работает.

### Шаг 3. Открыть в браузере

| Что открыть | Адрес |
|-------------|--------|
| **Сайт (основное)** | http://localhost:5173 |
| Документация API (Swagger) | http://localhost:8000/swagger/ |
| Админка Django | http://localhost:8000/admin/ |

### Шаг 4. Войти под тестовым пользователем

После первого запуска уже есть готовые аккаунты:

| Роль | Email | Пароль |
|------|-------|--------|
| Пользователь | user@example.com | user123 |
| Менеджер | manager@example.com | manager123 |
| Менеджер (админ) | admin@gmail.com | admin |

Менеджер после входа попадает в `/manager/orders`, обычный пользователь — на главную.

### Остановить проект

В том же терминале, где запущен Docker: `Ctrl+C`.

Полностью выключить контейнеры:

```bash
docker compose down
```

Удалить контейнеры **и** данные базы (начать с чистой БД):

```bash
docker compose down -v
docker compose up --build
```

### Запуск с другого устройства в локальной сети

На компьютере, где крутится Docker, узнайте IP (например `192.168.1.10`). На телефоне или другом ПК в той же Wi‑Fi сети откройте:

```
http://192.168.1.10:5173
```

Если сайт не открывается или API отвечает с ошибкой, добавьте IP в `docker/.env.docker` (подставьте свой):

```env
ALLOWED_HOSTS=localhost,127.0.0.1,backend,192.168.1.10
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.10:5173
```

Затем перезапустите: `docker compose up --build`.

### Настройка для Docker (необязательно)

Параметры backend и базы для контейнеров — в `docker/.env.docker` (уже настроено под Compose). Корневой `.env` используется только для `SECRET_KEY` при запуске через Docker; для локальной разработки без Docker — см. `.env.example`.

---

## Запуск без Docker (для разработки)

Если вы меняете код и хотите запускать backend и frontend отдельно на машине.

**Нужно:** Python 3.11+, Node.js 18+, npm, PostgreSQL 14+ (или только контейнер базы: `docker compose up db -d`).

### Backend

```bash
cd door_app_local

python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
```

В `.env` укажите `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — см. `.env.example`.

```bash
python manage.py migrate
python create_test_data.py
python manage.py runserver
```

API: http://localhost:8000

### Frontend (второй терминал)

```bash
cd door_app_local/frontend
npm install
npm run dev
```

Сайт: http://localhost:5173

Оба процесса (порты `8000` и `5173`) должны работать одновременно. Vite проксирует `/api` и `/media` на backend.

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SECRET_KEY` | Секрет Django | dev-ключ в settings |
| `DEBUG` | Режим отладки | `True` |
| `ALLOWED_HOSTS` | Разрешённые хосты (через запятую) | `localhost,127.0.0.1` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL | см. `.env.example` |
| `CORS_ALLOWED_ORIGINS` | Origins для CORS (через запятую) | localhost:5173, … |
| `LOAD_TEST_DATA` | Тестовые данные при старте Docker (`true`/`false`) | `true` |

Для Docker эти переменные заданы в `docker/.env.docker`, а не в корневом `.env`.

---

## Полезные команды

```bash
# Логи всех сервисов (Docker)
docker compose logs -f

# Только backend
docker compose logs -f backend

# Тесты backend (нужен запущенный PostgreSQL)
source venv/bin/activate
python manage.py test

# Сборка фронтенда для продакшена
cd frontend && npm run build
```

---

## API (кратко)

| Префикс | Назначение |
|---------|------------|
| `/api/auth/` | регистрация, вход, refresh, профиль |
| `/api/orders/` | услуги, заявки пользователя, уведомления |
| `/api/manager/` | заявки, услуги, пользователи (роль manager) |

Полное описание — в Swagger: http://localhost:8000/swagger/

---

## Типичные проблемы

**Docker: `Cannot connect to the Docker daemon`**  
Запустите Docker Desktop (или службу `docker` в Linux) и повторите `docker compose up --build`.

**Docker: `Invalid HTTP_HOST header: 'backend:8000'`**  
В `docker/.env.docker` в `ALLOWED_HOSTS` должен быть `backend`. Не подставляйте корневой `.env` с `DB_HOST=localhost` — для Docker используется только `docker/.env.docker`.

**Docker: backend стартует раньше PostgreSQL**  
Перезапустите: `docker compose down && docker compose up --build`. Backend ждёт готовности БД через `pg_isready`.

**Сайт не открывается**  
Проверьте, что команда `docker compose up` ещё выполняется и в логах нет ошибок backend/frontend.

**Пустой каталог услуг**  
Пересоздайте данные: `docker compose down -v && docker compose up --build` или локально `python create_test_data.py`.

**Локально: Django не найден**  
Активируйте venv: в начале строки терминала должно быть `(venv)`.

**Локально: ошибка PostgreSQL**  
Проверьте, что PostgreSQL запущен и параметры в `.env` верны. Либо поднимите только базу: `docker compose up db -d`.

**Локально: фронтенд не видит API**  
Должны работать и `runserver` (8000), и `npm run dev` (5173).

---

## Лицензия

Учебный / внутренний проект. Уточните условия использования у владельца репозитория.
