FROM node:22-alpine
WORKDIR /app

COPY package.json /app/package.json
COPY apps/discord-bot/package.json /app/apps/discord-bot/package.json
RUN npm install --workspace=@platform/discord-bot

COPY apps/discord-bot /app/apps/discord-bot
WORKDIR /app/apps/discord-bot
RUN npm run build

CMD ["npm", "run", "start"]
