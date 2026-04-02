FROM node:22-alpine
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DISCORD_CLIENT_ID=
ENV NEXT_PUBLIC_DISCORD_CLIENT_ID=$NEXT_PUBLIC_DISCORD_CLIENT_ID

COPY package.json /app/package.json
COPY apps/web/package.json /app/apps/web/package.json
RUN npm install --workspace=@platform/web

COPY apps/web /app/apps/web
WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
