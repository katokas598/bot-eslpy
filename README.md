# Discord + Telegram + Web Platform

Полный monorepo для управления Discord-сервером через web и Telegram.

## Состав

- `apps/api` — NestJS API + Prisma + BullMQ-ready модули
- `apps/web` — Next.js web-панель
- `apps/discord-bot` — Discord бот (discord.js)
- `apps/telegram-bot` — Telegram бот (Telegraf)
- `packages/shared` — общие типы и утилиты

## Запуск

### Быстрый вариант (почти одна команда)

- `npm run quickstart`
- Скрипт сам:
  - поставит зависимости,
  - запустит wizard `.env`,
  - поднимет все контейнеры.

### Пошаговый вариант

1. Запусти setup wizard:
   - `npm run setup`
2. Запусти:
   - `docker compose up --build -d`
3. Открой web:
   - [https://zyc-discord.duckdns.org](https://zyc-discord.duckdns.org)
4. В web-панели:
   - сначала `Register`, потом `Login` (вход по email+password)
5. API health:
   - [http://localhost:3001/api/health](http://localhost:3001/api/health)

## Где брать значения для setup

- `DISCORD_BOT_TOKEN`: Discord Developer Portal -> Bot -> Reset/Copy Token
- `DISCORD_CLIENT_ID`: Discord Developer Portal -> OAuth2 -> Client ID
- `NEXT_PUBLIC_DISCORD_CLIENT_ID`: обычно тот же, что `DISCORD_CLIENT_ID` (нужен сайту для кнопки Invite)
- `DISCORD_GUILD_ID`: ID сервера (включить Developer Mode в Discord)
- `DISCORD_PANEL_CHANNEL_ID`: ID канала, куда отправлять панели кнопок
- `TELEGRAM_BOT_TOKEN`: @BotFather -> `/newbot`
- `TELEGRAM_ADMIN_CHAT_ID`: через `@userinfobot` или `getUpdates` API

## Домен и HTTPS

- В проект добавлен `Caddy` reverse proxy.
- Домен `zyc-discord.duckdns.org` обслуживается по `HTTPS` автоматически.
- В setup wizard встроена проверка `DNS -> текущий IP` с предупреждением, если запись DuckDNS неверная.
- Маршруты:
  - `https://zyc-discord.duckdns.org` -> `web`
  - `https://zyc-discord.duckdns.org/api/*` -> `api`

## Что уже реализовано

- API: auth/login/refresh/me, RBAC check, projects, tickets lifecycle, music controls, moderation, config/modules/log/language
- Discord: полный набор slash-команд + кнопочные панели Ticket/Music/Moderation
- Telegram: полный набор команд управления + нижняя reply keyboard
- Web: интерактивная панель управления (auth, tickets, music, moderation, modules)
- База: Prisma schema (users/projects/tickets/music/moderation/audit/rules)
