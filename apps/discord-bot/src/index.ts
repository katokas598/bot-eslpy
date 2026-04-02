import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  GuildMember,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const apiUrl = process.env.DISCORD_BOT_API_URL ?? "http://localhost:3001/api";
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const panelChannelId = process.env.DISCORD_PANEL_CHANNEL_ID;

if (!token || !clientId || !guildId) throw new Error("DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID are required");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const roleAccess: Record<string, string[]> = {
  Member: ["help", "ping", "profile", "ticket.create", "queue", "nowplaying"],
  Support: ["ticket.claim", "ticket.close", "ticket.escalate", "ticket.unclaim", "ticket.add", "ticket.remove", "ticket.priority", "ticket.transcript"],
  DJ: ["play", "pause", "resume", "skip", "stop", "queue", "nowplaying", "volume", "shuffle", "loop", "autoplay"],
  Moderator: ["warn", "warnings", "mute", "unmute", "kick", "ban", "unban", "purge", "slowmode"],
  Admin: ["config.view", "config.reload", "module.enable", "module.disable", "log.channel", "language.set", "role.add", "role.remove", "autorole.set", "verify", "welcome.test"]
};

function hasPermission(member: GuildMember, key: string): boolean {
  const names = new Set(member.roles.cache.map((r) => r.name));
  for (const [roleName, perms] of Object.entries(roleAccess)) {
    if (names.has(roleName) && perms.includes(key)) return true;
  }
  return false;
}

async function api(path: string, method = "GET", body?: object): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
}

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Показать все команды по категориям"),
  new SlashCommandBuilder().setName("ping").setDescription("Статус бота и задержка"),
  new SlashCommandBuilder().setName("profile").setDescription("Профиль пользователя"),
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Управление тикетами")
    .addSubcommand((s) => s.setName("create").setDescription("Создать тикет").addStringOption((o) => o.setName("title").setDescription("Описание").setRequired(true)))
    .addSubcommand((s) => s.setName("close").setDescription("Закрыть тикет").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)))
    .addSubcommand((s) => s.setName("claim").setDescription("Взять тикет").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)))
    .addSubcommand((s) => s.setName("unclaim").setDescription("Снять с себя").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)))
    .addSubcommand((s) => s.setName("add").setDescription("Добавить участника").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)).addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("remove").setDescription("Убрать участника").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)).addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("priority").setDescription("Изменить приоритет").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)).addStringOption((o) => o.setName("level").setDescription("Priority").addChoices({ name: "low", value: "low" }, { name: "medium", value: "medium" }, { name: "high", value: "high" }, { name: "urgent", value: "urgent" }).setRequired(true)))
    .addSubcommand((s) => s.setName("transcript").setDescription("Выгрузить диалог").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true)))
    .addSubcommand((s) => s.setName("escalate").setDescription("Эскалация").addStringOption((o) => o.setName("id").setDescription("Ticket ID").setRequired(true))),
  new SlashCommandBuilder().setName("play").setDescription("Добавить трек YouTube").addStringOption((o) => o.setName("query").setDescription("URL или запрос").setRequired(true)),
  new SlashCommandBuilder().setName("pause").setDescription("Пауза"),
  new SlashCommandBuilder().setName("resume").setDescription("Продолжить"),
  new SlashCommandBuilder().setName("skip").setDescription("Пропустить"),
  new SlashCommandBuilder().setName("stop").setDescription("Стоп и очистка"),
  new SlashCommandBuilder().setName("queue").setDescription("Очередь"),
  new SlashCommandBuilder().setName("nowplaying").setDescription("Текущий трек"),
  new SlashCommandBuilder().setName("volume").setDescription("Громкость").addIntegerOption((o) => o.setName("value").setDescription("1-200").setRequired(true)),
  new SlashCommandBuilder().setName("shuffle").setDescription("Перемешать"),
  new SlashCommandBuilder().setName("loop").setDescription("Loop режим").addStringOption((o) => o.setName("mode").setDescription("off|track|queue").addChoices({ name: "off", value: "off" }, { name: "track", value: "track" }, { name: "queue", value: "queue" }).setRequired(true)),
  new SlashCommandBuilder().setName("autoplay").setDescription("Автоплей").addStringOption((o) => o.setName("enabled").setDescription("on/off").addChoices({ name: "on", value: "on" }, { name: "off", value: "off" }).setRequired(true)),
  new SlashCommandBuilder().setName("warn").setDescription("Предупреждение").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Причина").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("Список предупреждений").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("mute").setDescription("Тайм-аут").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("Например 10m").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Причина").setRequired(true)),
  new SlashCommandBuilder().setName("unmute").setDescription("Снять тайм-аут").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("kick").setDescription("Кик").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Причина").setRequired(true)),
  new SlashCommandBuilder().setName("ban").setDescription("Бан").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Причина").setRequired(true)),
  new SlashCommandBuilder().setName("unban").setDescription("Разбан").addStringOption((o) => o.setName("userid").setDescription("User ID").setRequired(true)),
  new SlashCommandBuilder().setName("purge").setDescription("Удалить сообщения").addIntegerOption((o) => o.setName("count").setDescription("Количество").setRequired(true)),
  new SlashCommandBuilder().setName("slowmode").setDescription("Slowmode").addIntegerOption((o) => o.setName("seconds").setDescription("Секунды").setRequired(true)),
  new SlashCommandBuilder()
    .setName("role")
    .setDescription("Управление ролями")
    .addSubcommand((s) => s.setName("add").setDescription("Выдать роль").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand((s) => s.setName("remove").setDescription("Снять роль").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))),
  new SlashCommandBuilder().setName("autorole").setDescription("Авто-роль").addSubcommand((s) => s.setName("set").setDescription("Установить").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))),
  new SlashCommandBuilder().setName("verify").setDescription("Верификация пользователя"),
  new SlashCommandBuilder().setName("welcome").setDescription("Welcome").addSubcommand((s) => s.setName("test").setDescription("Тест message")),
  new SlashCommandBuilder().setName("config").setDescription("Конфиг").addSubcommand((s) => s.setName("view").setDescription("Показать")).addSubcommand((s) => s.setName("reload").setDescription("Перезагрузить кеш")),
  new SlashCommandBuilder().setName("module").setDescription("Модули").addSubcommand((s) => s.setName("enable").setDescription("Включить").addStringOption((o) => o.setName("name").setDescription("Module").setRequired(true))).addSubcommand((s) => s.setName("disable").setDescription("Выключить").addStringOption((o) => o.setName("name").setDescription("Module").setRequired(true))),
  new SlashCommandBuilder().setName("log").setDescription("Логи").addSubcommand((s) => s.setName("channel").setDescription("Канал логов").addChannelOption((o) => o.setName("channel").setDescription("Channel").setRequired(true))),
  new SlashCommandBuilder().setName("language").setDescription("Язык").addSubcommand((s) => s.setName("set").setDescription("Установить").addStringOption((o) => o.setName("lang").setDescription("ru/en").addChoices({ name: "ru", value: "ru" }, { name: "en", value: "en" }).setRequired(true)))
].map((c) => c.toJSON());

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
}

async function postPanels(): Promise<void> {
  if (!panelChannelId) return;
  const channel = await client.channels.fetch(panelChannelId);
  if (!channel || !("send" in channel)) return;
  const ticketRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("ticket_create_btn").setLabel("Create Ticket").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_close_btn").setLabel("Close").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_claim_btn").setLabel("Claim").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_escalate_btn").setLabel("Escalate").setStyle(ButtonStyle.Danger)
  );
  const musicRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("music_playpause_btn").setLabel("Play/Pause").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("music_skip_btn").setLabel("Skip").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_stop_btn").setLabel("Stop").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("music_shuffle_btn").setLabel("Shuffle").setStyle(ButtonStyle.Secondary)
  );
  const modRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("mod_warn_btn").setLabel("Warn").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("mod_timeout_btn").setLabel("Timeout 10m").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("mod_kick_btn").setLabel("Kick").setStyle(ButtonStyle.Danger)
  );
  await channel.send({ content: "Ticket Panel", components: [ticketRow] });
  await channel.send({ content: "Music Panel", components: [musicRow] });
  await channel.send({ content: "Moderation Quick Actions", components: [modRow] });
}

async function handleTicket(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();
  const projectId = interaction.guildId ?? "default-project";
  if (sub === "create") {
    const title = interaction.options.getString("title", true);
    const res = await api("/tickets", "POST", { projectId, title, priority: "medium", assigneeTag: "support" });
    const data = (await res.json()) as { id: string };
    await interaction.reply(`Ticket created: ${data.id}`);
    return;
  }
  const id = interaction.options.getString("id", true);
  if (sub === "close") await api(`/tickets/${id}/close`, "PATCH");
  if (sub === "claim") await api(`/tickets/${id}/claim`, "PATCH", { userTag: interaction.user.tag });
  if (sub === "unclaim") await api(`/tickets/${id}/unclaim`, "PATCH");
  if (sub === "priority") await api(`/tickets/${id}/priority`, "PATCH", { priority: interaction.options.getString("level", true) });
  if (sub === "transcript") {
    const res = await api(`/tickets/${id}/transcript`, "POST");
    const data = (await res.json()) as { transcriptUrl: string };
    await interaction.reply(`Transcript: ${data.transcriptUrl}`);
    return;
  }
  if (sub === "escalate") await api(`/tickets/${id}/escalate`, "POST");
  if (sub === "add" || sub === "remove") await api("/notifications", "POST", { actor: interaction.user.tag, event: `ticket.${sub}`, payload: { ticketId: id, user: interaction.options.getUser("user", true).tag } });
  await interaction.reply(`Ticket action '${sub}' done for ${id}`);
}

client.once(Events.ClientReady, async (readyClient) => {
  await registerCommands();
  await postPanels();
  console.log(`Discord bot online: ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const projectId = interaction.guildId ?? "default-project";
    if (interaction.customId === "ticket_create_btn") {
      await api("/tickets", "POST", { projectId, title: "Created via panel", priority: "medium", assigneeTag: "support" });
      await interaction.reply({ content: "Ticket created from panel.", ephemeral: true });
      return;
    }
    if (interaction.customId === "ticket_claim_btn") {
      await interaction.reply({ content: "Use /ticket claim <id> to claim specific ticket.", ephemeral: true });
      return;
    }
    if (interaction.customId === "ticket_close_btn") {
      await interaction.reply({ content: "Use /ticket close <id> to close specific ticket.", ephemeral: true });
      return;
    }
    if (interaction.customId === "ticket_escalate_btn") {
      await interaction.reply({ content: "Use /ticket escalate <id> to escalate.", ephemeral: true });
      return;
    }
    if (interaction.customId === "music_playpause_btn") await api(`/music/pause/${projectId}`, "POST");
    if (interaction.customId === "music_skip_btn") await api(`/music/skip/${projectId}`, "POST");
    if (interaction.customId === "music_stop_btn") await api(`/music/stop/${projectId}`, "POST");
    if (interaction.customId === "music_shuffle_btn") await api(`/music/shuffle/${projectId}`, "POST");
    if (interaction.customId === "mod_warn_btn") await api("/moderation/action", "POST", { projectId, action: "warn", targetTag: interaction.user.tag, reason: "Quick action warn" });
    if (interaction.customId === "mod_timeout_btn") await api("/moderation/action", "POST", { projectId, action: "mute", targetTag: interaction.user.tag, reason: "Quick action timeout 10m", duration: "10m" });
    if (interaction.customId === "mod_kick_btn") await api("/moderation/action", "POST", { projectId, action: "kick", targetTag: interaction.user.tag, reason: "Quick action kick" });
    await interaction.reply({ content: "Action executed.", ephemeral: true });
    return;
  }

  if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
  const member = interaction.member;
  const projectId = interaction.guildId ?? "default-project";

  const need = (perm: string): boolean => {
    if (hasPermission(member, perm)) return true;
    void interaction.reply({ content: `Недостаточно прав (${perm})`, ephemeral: true });
    return false;
  };

  if (interaction.commandName === "help") {
    if (!need("help")) return;
    await interaction.reply("Команды: /help /ping /profile /ticket ... /music ... /moderation ... /config ...");
    return;
  }
  if (interaction.commandName === "ping") {
    if (!need("ping")) return;
    await interaction.reply(`Pong! ${client.ws.ping}ms`);
    return;
  }
  if (interaction.commandName === "profile") {
    if (!need("profile")) return;
    await interaction.reply(`Профиль ${interaction.user.tag}\nRoles: ${member.roles.cache.map((r) => r.name).join(", ")}`);
    return;
  }
  if (interaction.commandName === "ticket") {
    if (!need(`ticket.${interaction.options.getSubcommand()}`)) return;
    await handleTicket(interaction);
    return;
  }

  if (interaction.commandName === "play" && need("play")) {
    const query = interaction.options.getString("query", true);
    await api("/music/queue", "POST", { projectId, title: query, sourceUrl: query.startsWith("http") ? query : "https://youtube.com/results", requestedBy: interaction.user.tag });
    await interaction.reply(`Added to queue: ${query}`);
    return;
  }
  if (interaction.commandName === "pause" && need("pause")) return void interaction.reply(JSON.stringify(await (await api(`/music/pause/${projectId}`, "POST")).json()));
  if (interaction.commandName === "resume" && need("resume")) return void interaction.reply(JSON.stringify(await (await api(`/music/resume/${projectId}`, "POST")).json()));
  if (interaction.commandName === "skip" && need("skip")) return void interaction.reply(JSON.stringify(await (await api(`/music/skip/${projectId}`, "POST")).json()));
  if (interaction.commandName === "stop" && need("stop")) return void interaction.reply(JSON.stringify(await (await api(`/music/stop/${projectId}`, "POST")).json()));
  if (interaction.commandName === "queue" && need("queue")) {
    const q = (await (await api(`/music/queue/${projectId}`)).json()) as Array<{ position: number; title: string }>;
    await interaction.reply(q.length ? q.map((x) => `${x.position}. ${x.title}`).join("\n") : "Queue empty");
    return;
  }
  if (interaction.commandName === "nowplaying" && need("nowplaying")) return void interaction.reply(JSON.stringify(await (await api(`/music/nowplaying/${projectId}`)).json()));
  if (interaction.commandName === "volume" && need("volume")) return void interaction.reply(JSON.stringify(await (await api(`/music/volume/${projectId}`, "POST", { volume: interaction.options.getInteger("value", true) })).json()));
  if (interaction.commandName === "shuffle" && need("shuffle")) return void interaction.reply(JSON.stringify(await (await api(`/music/shuffle/${projectId}`, "POST")).json()));
  if (interaction.commandName === "loop" && need("loop")) return void interaction.reply(JSON.stringify(await (await api(`/music/loop/${projectId}`, "POST", { mode: interaction.options.getString("mode", true) })).json()));
  if (interaction.commandName === "autoplay" && need("autoplay")) return void interaction.reply(JSON.stringify(await (await api(`/music/autoplay/${projectId}`, "POST", { enabled: interaction.options.getString("enabled", true) === "on" })).json()));

  if (["warn", "mute", "kick", "ban", "unmute", "unban"].includes(interaction.commandName)) {
    const map: Record<string, string> = { warn: "warn", mute: "mute", kick: "kick", ban: "ban", unmute: "mute", unban: "ban" };
    if (!need(interaction.commandName)) return;
    const user = interaction.options.getUser("user");
    const targetTag = user?.tag ?? interaction.options.getString("userid", true);
    const reason = interaction.options.getString("reason") ?? `${interaction.commandName} by ${interaction.user.tag}`;
    const duration = interaction.options.getString("duration") ?? undefined;
    await api("/moderation/action", "POST", { projectId, action: map[interaction.commandName], targetTag, reason, duration });
    await interaction.reply(`Moderation action ${interaction.commandName} applied to ${targetTag}`);
    return;
  }
  if (interaction.commandName === "warnings" && need("warnings")) {
    const user = interaction.options.getUser("user", true);
    const list = (await (await api(`/moderation/warnings/${encodeURIComponent(user.tag)}`)).json()) as Array<{ reason: string; createdAt: string }>;
    await interaction.reply(list.length ? list.slice(0, 10).map((x) => `- ${x.reason} (${x.createdAt})`).join("\n") : "No warnings");
    return;
  }
  if (interaction.commandName === "purge" && need("purge")) return void interaction.reply(`Purge simulated: ${interaction.options.getInteger("count", true)}`);
  if (interaction.commandName === "slowmode" && need("slowmode")) return void interaction.reply(`Slowmode set: ${interaction.options.getInteger("seconds", true)}s`);
  if (interaction.commandName === "role" && need(`role.${interaction.options.getSubcommand()}`)) return void interaction.reply(`Role ${interaction.options.getSubcommand()} done`);
  if (interaction.commandName === "autorole" && need("autorole.set")) return void interaction.reply(`Autorole set: ${interaction.options.getRole("role", true).name}`);
  if (interaction.commandName === "verify" && need("verify")) return void interaction.reply("Verification passed.");
  if (interaction.commandName === "welcome" && need("welcome.test")) return void interaction.reply("Welcome test sent.");
  if (interaction.commandName === "config" && need(`config.${interaction.options.getSubcommand()}`)) {
    const sub = interaction.options.getSubcommand();
    const res = await api(`/config/${sub === "view" ? "view" : "reload"}`, sub === "view" ? "GET" : "POST");
    await interaction.reply(JSON.stringify(await res.json()));
    return;
  }
  if (interaction.commandName === "module" && need(`module.${interaction.options.getSubcommand()}`)) {
    const sub = interaction.options.getSubcommand();
    const name = interaction.options.getString("name", true);
    const res = await api(`/module/${sub}`, "POST", { name });
    await interaction.reply(JSON.stringify(await res.json()));
    return;
  }
  if (interaction.commandName === "log" && need("log.channel")) {
    const channel = interaction.options.getChannel("channel", true);
    const res = await api("/log/channel", "POST", { channelId: channel.id });
    await interaction.reply(JSON.stringify(await res.json()));
    return;
  }
  if (interaction.commandName === "language" && need("language.set")) {
    const lang = interaction.options.getString("lang", true);
    const res = await api("/language/set", "POST", { language: lang });
    await interaction.reply(JSON.stringify(await res.json()));
  }
});

client.login(token);
