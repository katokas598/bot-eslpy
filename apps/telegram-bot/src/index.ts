import { Telegraf } from "telegraf";

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiUrl = process.env.TELEGRAM_BOT_API_URL ?? "http://localhost:3001/api";

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new Telegraf(token);
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "Статус API" }, { text: "Серверы" }],
      [{ text: "Тикеты" }, { text: "Музыка" }],
      [{ text: "Модерация" }, { text: "Помощь" }]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
} as const;

async function api(path: string, method = "GET", body?: object): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
}

async function sendStatus(chatId: number): Promise<void> {
  try {
    const res = await fetch(`${apiUrl}/health`);
    if (!res.ok) throw new Error("API offline");
    const data = (await res.json()) as { ok: boolean; time: string };
    await bot.telegram.sendMessage(chatId, `API: ${data.ok ? "ok" : "down"}\nTime: ${data.time}`, mainKeyboard);
  } catch {
    await bot.telegram.sendMessage(chatId, "API недоступен", mainKeyboard);
  }
}

async function sendHelp(chatId: number): Promise<void> {
  await bot.telegram.sendMessage(
    chatId,
    [
      "Команды Telegram:",
      "/start",
      "/help",
      "/status",
      "/servers",
      "/ticket_open <описание>",
      "/ticket_list",
      "/ticket_close <id>",
      "/music_play <query|url>",
      "/music_skip",
      "/music_stop",
      "/mod_warn <userId> <reason>",
      "/mod_ban <userId> <reason>",
      "/alerts_on",
      "/alerts_off",
      "/approve <actionId>",
      "/ticket <описание>",
      "",
      "Кнопки внизу:",
      "- Статус API",
      "- Серверы",
      "- Тикеты",
      "- Музыка",
      "- Модерация",
      "- Помощь"
    ].join("\n"),
    mainKeyboard
  );
}

bot.start((ctx) => {
  void ctx.reply("Telegram control center online.", mainKeyboard);
});

bot.command("status", async (ctx) => {
  await sendStatus(ctx.chat.id);
});

bot.command("help", async (ctx) => {
  await sendHelp(ctx.chat.id);
});

bot.command("ticket", async (ctx) => {
  const messageText = "text" in ctx.message ? ctx.message.text : "";
  const text = messageText.replace("/ticket", "").trim();
  if (!text) {
    await ctx.reply("Использование: /ticket описание");
    return;
  }
  const response = await fetch(`${apiUrl}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: "telegram-project",
      title: text,
      priority: "high",
      assigneeTag: "support"
    })
  });
  if (!response.ok) {
    await ctx.reply("Не удалось создать тикет");
    return;
  }
  const ticket = (await response.json()) as { id: string };
  await ctx.reply(`Тикет создан: ${ticket.id}`);
});

bot.command("servers", async (ctx) => {
  await ctx.reply("Серверы: 1) default-project", mainKeyboard);
});

bot.command("ticket_open", async (ctx) => {
  const messageText = "text" in ctx.message ? ctx.message.text : "";
  const text = messageText.replace("/ticket_open", "").trim();
  if (!text) return void ctx.reply("Использование: /ticket_open описание", mainKeyboard);
  const res = await api("/tickets", "POST", { projectId: "telegram-project", title: text, priority: "high", assigneeTag: "support" });
  const data = (await res.json()) as { id: string };
  await ctx.reply(`Тикет открыт: ${data.id}`, mainKeyboard);
});

bot.command("ticket_list", async (ctx) => {
  const list = (await (await api("/tickets/project/telegram-project")).json()) as Array<{ id: string; title: string; status: string }>;
  if (!list.length) return void ctx.reply("Тикеты не найдены", mainKeyboard);
  await ctx.reply(list.slice(0, 20).map((t) => `${t.id} | ${t.status} | ${t.title}`).join("\n"), mainKeyboard);
});

bot.command("ticket_close", async (ctx) => {
  const messageText = "text" in ctx.message ? ctx.message.text : "";
  const id = messageText.replace("/ticket_close", "").trim();
  if (!id) return void ctx.reply("Использование: /ticket_close <id>", mainKeyboard);
  await api(`/tickets/${id}/close`, "PATCH");
  await ctx.reply(`Тикет закрыт: ${id}`, mainKeyboard);
});

bot.command("music_play", async (ctx) => {
  const messageText = "text" in ctx.message ? ctx.message.text : "";
  const query = messageText.replace("/music_play", "").trim();
  if (!query) return void ctx.reply("Использование: /music_play <query|url>", mainKeyboard);
  await api("/music/queue", "POST", { projectId: "telegram-project", title: query, sourceUrl: query.startsWith("http") ? query : "https://youtube.com/results", requestedBy: String(ctx.from?.id ?? "tg") });
  await ctx.reply(`Добавил в очередь: ${query}`, mainKeyboard);
});

bot.command("music_skip", async (ctx) => {
  const data = (await (await api("/music/skip/telegram-project", "POST")).json()) as { ok: boolean; skipped?: string };
  await ctx.reply(data.ok ? `Пропущен: ${data.skipped}` : "Очередь пустая", mainKeyboard);
});

bot.command("music_stop", async (ctx) => {
  await api("/music/stop/telegram-project", "POST");
  await ctx.reply("Музыка остановлена, очередь очищена", mainKeyboard);
});

bot.command("mod_warn", async (ctx) => {
  const text = ("text" in ctx.message ? ctx.message.text : "").replace("/mod_warn", "").trim();
  const [targetTag, ...reasonParts] = text.split(" ");
  const reason = reasonParts.join(" ").trim();
  if (!targetTag || !reason) return void ctx.reply("Использование: /mod_warn <userId> <reason>", mainKeyboard);
  await api("/moderation/action", "POST", { projectId: "telegram-project", action: "warn", targetTag, reason });
  await ctx.reply(`Warn: ${targetTag}`, mainKeyboard);
});

bot.command("mod_ban", async (ctx) => {
  const text = ("text" in ctx.message ? ctx.message.text : "").replace("/mod_ban", "").trim();
  const [targetTag, ...reasonParts] = text.split(" ");
  const reason = reasonParts.join(" ").trim();
  if (!targetTag || !reason) return void ctx.reply("Использование: /mod_ban <userId> <reason>", mainKeyboard);
  await api("/moderation/action", "POST", { projectId: "telegram-project", action: "ban", targetTag, reason });
  await ctx.reply(`Ban: ${targetTag}`, mainKeyboard);
});

bot.command("alerts_on", async (ctx) => {
  await api("/notifications", "POST", { actor: `tg:${ctx.from?.id ?? "unknown"}`, event: "alerts.on", payload: {} });
  await ctx.reply("TG alerts включены", mainKeyboard);
});

bot.command("alerts_off", async (ctx) => {
  await api("/notifications", "POST", { actor: `tg:${ctx.from?.id ?? "unknown"}`, event: "alerts.off", payload: {} });
  await ctx.reply("TG alerts выключены", mainKeyboard);
});

bot.command("approve", async (ctx) => {
  const actionId = ("text" in ctx.message ? ctx.message.text : "").replace("/approve", "").trim();
  if (!actionId) return void ctx.reply("Использование: /approve <actionId>", mainKeyboard);
  await api("/notifications", "POST", { actor: `tg:${ctx.from?.id ?? "unknown"}`, event: "approve.action", payload: { actionId } });
  await ctx.reply(`Критичное действие подтверждено: ${actionId}`, mainKeyboard);
});

bot.hears("Статус API", async (ctx) => {
  await sendStatus(ctx.chat.id);
});

bot.hears("Серверы", async (ctx) => {
  await ctx.reply("Доступные серверы: default-project", mainKeyboard);
});

bot.hears("Тикеты", async (ctx) => {
  await ctx.reply("Используй /ticket_open, /ticket_list, /ticket_close", mainKeyboard);
});

bot.hears("Музыка", async (ctx) => {
  await ctx.reply("Используй /music_play, /music_skip, /music_stop", mainKeyboard);
});

bot.hears("Модерация", async (ctx) => {
  await ctx.reply("Используй /mod_warn и /mod_ban", mainKeyboard);
});

bot.hears("Помощь", async (ctx) => {
  await sendHelp(ctx.chat.id);
});

bot.hears("Создать тикет", async (ctx) => {
  await ctx.reply("Отправь: /ticket описание_проблемы", mainKeyboard);
});

bot.launch().then(() => {
  console.log("Telegram bot online");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
