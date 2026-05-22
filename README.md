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
| Backend | Django 6, Django REST Framework, Simple JWT, drf-yasg, PostgreSQL / SQLite |
| Frontend | React 18, Vite, React Router, Sass |
| Прочее | Pillow (аватары), ReportLab (PDF) |

## Структура проекта

```
door_app_local/
├── app/
│   ├── users/      # пользователи, магазины, авторизация
│   ├── orders/     # заявки, услуги, уведомления
│   └── manager/    # API панели менеджера
├── config/         # настройки Django
├── frontend/       # React-приложение (Vite)
├── media/          # загруженные файлы (создаётся при работе)
├── manage.py
├── create_test_data.py
├── requirements.txt
└── .env.example
```

## Требования

- **Python** 3.11+ (в проекте используется venv с Python 3.13)
- **Node.js** 18+ и npm
- **PostgreSQL** 14+ — опционально; для быстрого старта достаточно SQLite

## Быстрый старт (SQLite, без PostgreSQL)

Подходит, если нужно просто запустить проект локально.

### 1. Backend

```bash
cd door_app_local

python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
```

В файле `.env` укажите SQLite вместо PostgreSQL:

```env
DB_ENGINE=django.db.backends.sqlite3
```

Затем:

```bash
python manage.py migrate
python create_test_data.py
python manage.py runserver
```

Сервер API: [http://localhost:8000](http://localhost:8000)  
Документация Swagger: [http://localhost:8000/swagger/](http://localhost:8000/swagger/)  
Админка Django: [http://localhost:8000/admin/](http://localhost:8000/admin/)

### 2. Frontend (второй терминал)

```bash
cd door_app_local/frontend

npm install
npm run dev
```

Сайт: [http://localhost:5173](http://localhost:5173)

Vite проксирует запросы `/api` и `/media` на `http://localhost:8000`, поэтому отдельно настраивать CORS для разработки не нужно.

---

## Запуск с PostgreSQL

1. Создайте базу, например:

```sql
CREATE DATABASE doors_db;
```

2. Скопируйте и отредактируйте `.env`:

```bash
cp .env.example .env
```

По умолчанию в `.env.example` уже указаны типичные параметры:

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=doors_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

3. Выполните те же шаги, что в быстром старте: `migrate`, `create_test_data.py`, `runserver`, и во втором терминале `npm run dev`.

---

## Тестовые аккаунты

Создаются скриптом `create_test_data.py` (и частично миграцией `users.0002`):

| Роль | Email | Пароль |
|------|-------|--------|
| Менеджер | manager@example.com | manager123 |
| Менеджер (админ) | admin@gmail.com | admin |
| Пользователь | user@example.com | user123 |

После входа менеджер перенаправляется в `/manager/orders`, пользователь остаётся на главной.

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SECRET_KEY` | Секрет Django | dev-ключ в settings |
| `DEBUG` | Режим отладки | `True` |
| `ALLOWED_HOSTS` | Разрешённые хосты | `localhost,127.0.0.1` |
| `DB_ENGINE` | Движок БД | PostgreSQL |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Параметры PostgreSQL | см. `.env.example` |

Файл `.env` не коммитится в git — используйте `.env.example` как шаблон.

---

## Полезные команды

```bash
# Активировать venv (если ещё не активирован)
source venv/bin/activate

# Создать суперпользователя для /admin/
python manage.py createsuperuser

# Пересобрать тестовые данные
python create_test_data.py

# Тесты (удобно на SQLite, PostgreSQL не обязателен)
DB_ENGINE=django.db.backends.sqlite3 python manage.py test

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

Полное описание эндпоинтов — в Swagger: `/swagger/`.

---

## Типичные проблемы

**`ModuleNotFoundError` / Django не найден**  
Убедитесь, что виртуальное окружение активировано: в начале строки терминала должно быть `(venv)`.

**Ошибка подключения к PostgreSQL**  
Проверьте, что сервер PostgreSQL запущен и данные в `.env` верны. Либо переключитесь на SQLite (`DB_ENGINE=django.db.backends.sqlite3`).

**Фронтенд не видит API**  
Backend должен работать на порту `8000`, frontend — на `5173`. Оба процесса должны быть запущены одновременно.

**Пустой каталог услуг**  
Выполните `python create_test_data.py` после миграций.

---

## Лицензия

Учебный / внутренний проект. Уточните условия использования у владельца репозитория.
