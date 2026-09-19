# 👕 Гардероб - Список покупок одежды

Полноценное веб-приложение для управления списком покупок одежды.

## Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy
- **Чат**: WebSocket
- **Авторизация**: JWT токены
- **Деплой**: Docker, Docker Compose

## Структура проекта

```
├── src/                    # React фронтенд
│   ├── api/               # API клиент
│   ├── context/           # React контексты (авторизация)
│   ├── pages/             # Страницы
│   └── App.tsx            # Главный компонент
├── backend/               # FastAPI бэкенд
│   ├── main.py           # FastAPI приложение (CRUD + WebSocket)
│   ├── models.py         # SQLAlchemy модели
│   ├── schemas.py        # Pydantic схемы
│   ├── auth.py           # Авторизация (JWT)
│   ├── chat.py           # WebSocket менеджер
│   ├── cli.py            # Консольная команда
│   └── requirements.txt  # Python зависимости
├── docker-compose.yml     # Docker Compose
├── Dockerfile             # Frontend Docker
└── nginx.conf             # Nginx конфигурация
```

## Запуск

### С Docker (рекомендуется)

```bash
docker-compose up --build
```

Приложение будет доступно на http://localhost

### Без Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
npm install
npm run dev
```

### Консольная команда

```bash
cd backend
python cli.py --help
python cli.py list
python cli.py add --name "Футболка" --category "Футболки" --price 1500 --size M --color Белый
python cli.py delete --id 1
python cli.py bought --id 1
python cli.py stats
python cli.py users
python cli.py create-user --username admin --password admin123
```

## Функционал

1. ✅ **CRUD** на серверной стороне (FastAPI + SQLite)
2. ✅ **SPA** на React
3. ✅ **Интеграция API** в SPA (с демо-режимом)
4. ✅ **Консольная команда** (cli.py)
5. ✅ **WebSocket чат** на серверной стороне
6. ✅ **WebSocket чат** на клиентской стороне
7. ✅ **Авторизация** (JWT)
8. ✅ **Docker** (Dockerfile + docker-compose.yml)

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/items | Получить все предметы |
| GET | /api/items/{id} | Получить предмет |
| POST | /api/items | Создать предмет |
| PUT | /api/items/{id} | Обновить предмет |
| DELETE | /api/items/{id} | Удалить предмет |
| GET | /api/chat/messages | Получить сообщения |
| WS | /ws/chat | WebSocket чат |
