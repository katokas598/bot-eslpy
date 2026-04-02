FROM node:22-alpine
WORKDIR /app

COPY package.json /app/package.json
COPY apps/api/package.json /app/apps/api/package.json
RUN npm install --workspace=@platform/api

COPY apps/api /app/apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start"]
