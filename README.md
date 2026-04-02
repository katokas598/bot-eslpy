# Discord Bot - Полное управление

Многофункциональный Discord бот с веб-панелью и управлением через Telegram.

## 📦 Установка

```bash
cd F:\discord-bot
npm install
```

## ⚙️ Настройка

Отредактируйте `config.json`:

```json
{
  "discord": {
    "token": "ВАШ_DISCORD_TOKEN"
  },
  "telegram": {
    "token": "ВАШ_TELEGRAM_TOKEN",
    "admin_id": "ВАШ_TELEGRAM_ID"
  },
  "dashboard": {
    "port": 3000
  }
}
```

### Как получить токены:

1. **Discord Bot Token**:
   - Перейдите на https://discord.com/developers/applications
   - Создайте приложение → Bot → Reset Token

2. **Telegram Bot Token**:
   - Напишите @BotFather в Telegram
   - Создайте бота командой /newbot
   - Скопируйте токен

3. **Telegram ID**:
   - Напишите @userinfobot в Telegram
   - Скопируйте ваш ID

## 🚀 Запуск

**Запуск всех компонентов (в 3 терминалах):**

```bash
# Терминал 1 - Discord бот
npm run start

# Терминал 2 - Веб-панель
npm run dashboard

# Терминал 3 - Telegram бот
npm run telegram
```

## 📱 Функции

### Discord команды:
| Команда | Описание |
|---------|-----------|
| `!play <url>` | Воспроизвести музыку |
| `!stop` | Остановить музыку |
| `!ban <user> [reason]` | Забанить |
| `!kick <user> [reason]` | Кикнуть |
| `!mute <user> <time>` | Замутить |
| `!warn <user> [reason]` | Предупреждение |
| `!clear <число>` | Очистить чат |
| `!level` | Ваш уровень |
| `!leaderboard` | Топ игроков |
| `!ticket [причина]` | Создать тикет |
| `!ping` | Пинг |
| `!random <число>` | Случайное число |
| `!calc <выражение>` | Калькулятор |
| `!translate <язык> <текст>` | Перевод |
| `!weather <город>` | Погода |
| `!embed <заголовок> \| <текст>` | Создать Embed |
| `!user [пользователь]` | Информация о юзере |
| `!server` | Информация о сервере |
| `!stats` | Статистика |
| `!help` | Список команд |

### Telegram управление:
- 📊 Статус - показать статистику
- 🛡 Модерация - история банов/варнов
- 📢 Рассылка - отправить сообщение на все сервера
- ⚙️ Настройки - изменить префикс, канал логов
- 🔄 Перезагрузить - перезапустить бота
- 📜 Логи - последние действия

### Веб-панель:
- http://localhost:3000
- Статистика, пользователи, модерация, тикеты, настройки

## 🎵 Музыка

Поддерживаемые источники:
- YouTube
- Spotify (нужен API ключ)
- SoundCloud (нужен API ключ)
- VK Music (нужен токен)
- Прямые ссылки на аудио

## 📁 Структура

```
discord-bot/
├── bot/              # Discord бот
│   ├── commands/     # Команды
│   └── events/       # События
├── dashboard/        # Веб-панель
│   ├── routes/       # Роуты
│   └── views/        # Шаблоны
├── telegram/         # Telegram бот
├── database/         # База данных (SQLite)
└── config.json       # Конфигурация
```

## ⚠️ Важно

- Для работы музыки нужен ffmpeg
- YouTube работает без ключа (ограничения)
- Для Spotify/SoundCloud добавьте ключи в config.json