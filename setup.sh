#!/bin/bash

echo "=== Discord Bot Setup ==="
echo ""

if ! command -v node &> /dev/null; then
    echo "Node.js не установлен. Устанавливаю..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    echo "Node.js установлен"
fi

if ! command -v git &> /dev/null; then
    echo "Git не установлен. Устанавливаю..."
    sudo apt-get install -y git > /dev/null 2>&1
    echo "Git установлен"
fi

if ! command -v pm2 &> /dev/null; then
    echo "PM2 не установлен. Устанавливаю..."
    sudo npm install -g pm2 > /dev/null 2>&1
    echo "PM2 установлен"
fi

SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -eq 0 ]; then
    echo "Создаю swap файл..."
    sudo fallocate -l 1G /swapfile > /dev/null 2>&1
    sudo chmod 600 /swapfile > /dev/null 2>&1
    sudo mkswap /swapfile > /dev/null 2>&1
    sudo swapon /swapfile > /dev/null 2>&1
    echo "Swap создан"
fi

if [ ! -f "config.json" ]; then
    cp config.example.json config.json
    echo "Создан config.json из примера"
fi

echo ""
echo "=== Введите токены ==="
echo ""

read -p "Discord Bot Token: " discord_token
read -p "Telegram Bot Token: " tg_token
read -p "Telegram Admin ID: " admin_id
read -p "Session Secret (оставь пустым для авто-генерации): " session_secret

if [ -z "$session_secret" ]; then
    session_secret=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
fi

sed -i "s/YOUR_DISCORD_BOT_TOKEN/$discord_token/" config.json
sed -i "s/YOUR_TELEGRAM_BOT_TOKEN/$tg_token/" config.json
sed -i "s/YOUR_TELEGRAM_ADMIN_ID/$admin_id/" config.json
sed -i "s/YOUR_SESSION_SECRET/$session_secret/" config.json

echo ""
echo "Токены сохранены"
echo "Устанавливаю зависимости..."
npm install

echo ""
echo "=== Запуск бота через PM2 ==="

pm2 stop bot-eslpy 2>/dev/null
pm2 delete bot-eslpy 2>/dev/null

pm2 start bot/index.js --name bot-eslpy
pm2 save

echo ""
echo "=== Бот запущен! ==="
echo ""
echo "Команды PM2:"
echo "  pm2 status          - проверить статус"
echo "  pm2 logs bot-eslpy  - посмотреть логи"
echo "  pm2 restart bot-eslpy - перезапустить бота"
echo "  pm2 stop bot-eslpy  - остановить бота"
