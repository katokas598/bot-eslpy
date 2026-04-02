import fs from "fs";
import path from "path";
import crypto from "crypto";
import readline from "readline";
import dns from "dns/promises";

const root = process.cwd();
const envPath = path.join(root, ".env");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, fallback = "") {
  return new Promise((resolve) => {
    rl.question(`${question}${fallback ? ` [${fallback}]` : ""}: `, (answer) => {
      resolve((answer || fallback).trim());
    });
  });
}

function randomSecret() {
  return crypto.randomBytes(24).toString("hex");
}

async function main() {
  console.log("=== Platform setup wizard ===");
  console.log("Заполним .env. Подсказки будут рядом с каждым полем.");
  console.log("");
  const publicDomain = await ask("Публичный домен проекта (например zyc-discord.duckdns.org)", "zyc-discord.duckdns.org");
  if (fs.existsSync(envPath)) {
    const overwrite = (await ask(".env уже существует. Перезаписать? (yes/no)", "no")).toLowerCase();
    if (overwrite !== "yes") {
      console.log("Остановлено. .env не изменен.");
      rl.close();
      return;
    }
  }

  try {
    const resolved = await dns.resolve4(publicDomain);
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = (await ipRes.json()) as { ip: string };
    const currentIp = ipData.ip;
    const hasMatch = resolved.includes(currentIp);
    console.log("");
    console.log(`[DNS check] ${publicDomain} -> ${resolved.join(", ")}`);
    console.log(`[DNS check] Current server IP -> ${currentIp}`);
    if (!hasMatch) {
      console.log("[DNS check] WARNING: домен не указывает на текущий IP сервера.");
      console.log("Проверь запись в DuckDNS перед запуском HTTPS.");
    } else {
      console.log("[DNS check] OK: домен привязан корректно.");
    }
    console.log("");
  } catch (error) {
    console.log("");
    console.log("[DNS check] Не удалось проверить DNS/IP автоматически.");
    console.log(`Причина: ${String(error)}`);
    console.log("");
  }

  const values = {
    NODE_ENV: "production",
    POSTGRES_USER: await ask("POSTGRES_USER (логин postgres)", "platform"),
    POSTGRES_PASSWORD: await ask("POSTGRES_PASSWORD (пароль postgres)", "platform"),
    POSTGRES_DB: await ask("POSTGRES_DB (имя базы)", "platform"),
    POSTGRES_PORT: await ask("POSTGRES_PORT", "5432"),
    REDIS_PORT: await ask("REDIS_PORT", "6379"),
    API_PORT: await ask("API_PORT", "3001"),
    WEB_PORT: await ask("WEB_PORT", "3000"),
    DISCORD_BOT_TOKEN: await ask("DISCORD_BOT_TOKEN (Discord Developer Portal -> Bot -> Token)"),
    DISCORD_CLIENT_ID: await ask("DISCORD_CLIENT_ID (Discord App -> OAuth2 -> Client ID)"),
    DISCORD_GUILD_ID: await ask("DISCORD_GUILD_ID (ID сервера Discord, Developer Mode)"),
    DISCORD_PANEL_CHANNEL_ID: await ask("DISCORD_PANEL_CHANNEL_ID (канал для панелей, ID канала)"),
    TELEGRAM_BOT_TOKEN: await ask("TELEGRAM_BOT_TOKEN (BotFather -> HTTP API token)"),
    TELEGRAM_ADMIN_CHAT_ID: await ask("TELEGRAM_ADMIN_CHAT_ID (получить через @userinfobot / getUpdates)"),
    JWT_ACCESS_SECRET: randomSecret(),
    JWT_REFRESH_SECRET: randomSecret(),
    NEXT_PUBLIC_API_URL: await ask("NEXT_PUBLIC_API_URL (URL API для сайта)", `https://${publicDomain}/api`)
  };

  values.DATABASE_URL = `postgresql://${values.POSTGRES_USER}:${values.POSTGRES_PASSWORD}@postgres:5432/${values.POSTGRES_DB}?schema=public`;
  values.REDIS_URL = "redis://redis:6379";
  values.DISCORD_BOT_API_URL = "http://api:3001/api";
  values.TELEGRAM_BOT_API_URL = "http://api:3001/api";

  const content = [
    `NODE_ENV=${values.NODE_ENV}`,
    "",
    `POSTGRES_USER=${values.POSTGRES_USER}`,
    `POSTGRES_PASSWORD=${values.POSTGRES_PASSWORD}`,
    `POSTGRES_DB=${values.POSTGRES_DB}`,
    `POSTGRES_PORT=${values.POSTGRES_PORT}`,
    `REDIS_PORT=${values.REDIS_PORT}`,
    "",
    `DATABASE_URL=${values.DATABASE_URL}`,
    `REDIS_URL=${values.REDIS_URL}`,
    "",
    `API_PORT=${values.API_PORT}`,
    `WEB_PORT=${values.WEB_PORT}`,
    "",
    `DISCORD_BOT_TOKEN=${values.DISCORD_BOT_TOKEN}`,
    `DISCORD_CLIENT_ID=${values.DISCORD_CLIENT_ID}`,
    `NEXT_PUBLIC_DISCORD_CLIENT_ID=${values.DISCORD_CLIENT_ID}`,
    `DISCORD_GUILD_ID=${values.DISCORD_GUILD_ID}`,
    `DISCORD_PANEL_CHANNEL_ID=${values.DISCORD_PANEL_CHANNEL_ID}`,
    `DISCORD_BOT_API_URL=${values.DISCORD_BOT_API_URL}`,
    "",
    `TELEGRAM_BOT_TOKEN=${values.TELEGRAM_BOT_TOKEN}`,
    `TELEGRAM_ADMIN_CHAT_ID=${values.TELEGRAM_ADMIN_CHAT_ID}`,
    `TELEGRAM_BOT_API_URL=${values.TELEGRAM_BOT_API_URL}`,
    "",
    `JWT_ACCESS_SECRET=${values.JWT_ACCESS_SECRET}`,
    `JWT_REFRESH_SECRET=${values.JWT_REFRESH_SECRET}`,
    `NEXT_PUBLIC_API_URL=${values.NEXT_PUBLIC_API_URL}`
  ].join("\n");

  fs.writeFileSync(envPath, content, "utf8");
  rl.close();

  console.log("");
  console.log(`Готово: создан файл ${envPath}`);
  console.log("Дальше запускай:");
  console.log("1) docker compose up --build -d");
  console.log("2) Открой сайт и создай первого пользователя через Register");
}

main().catch((error) => {
  console.error("Setup failed:", error);
  rl.close();
  process.exit(1);
});
