FROM node:22-alpine
WORKDIR /app

COPY package.json /app/package.json
COPY apps/telegram-bot/package.json /app/apps/telegram-bot/package.json
RUN npm install --workspace=@platform/telegram-bot

COPY apps/telegram-bot /app/apps/telegram-bot
WORKDIR /app/apps/telegram-bot
RUN npm run build

CMD ["npm", "run", "start"]
