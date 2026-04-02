"use client";
import { useEffect, useMemo, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";

type Health = { ok: boolean; time: string };

export default function HomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [output, setOutput] = useState<string>("ready");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("changeme123");
  const [role, setRole] = useState("Admin");
  const [ticketTitle, setTicketTitle] = useState("Новый тикет из web");
  const [musicQuery, setMusicQuery] = useState("Imagine Dragons - Believer");
  const [warnUser, setWarnUser] = useState("user#0001");
  const [warnReason, setWarnReason] = useState("Нарушение правил");
  const [moduleName, setModuleName] = useState("music");
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const inviteUrl = useMemo(() => {
    if (!discordClientId) return "";
    const permissions = "8";
    const scopes = encodeURIComponent("bot applications.commands");
    return `https://discord.com/oauth2/authorize?client_id=${discordClientId}&permissions=${permissions}&scope=${scopes}`;
  }, []);

  const call = async (path: string, method = "GET", body?: object) => {
    const res = await fetch(`${api}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    setOutput(JSON.stringify(data, null, 2));
    return data;
  };

  useEffect(() => {
    void fetch(`${api}/health`)
      .then((r) => r.json())
      .then((d: Health) => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "20px auto", padding: 20, display: "grid", gap: 16 }}>
      <h1>Discord + Telegram + Web Control</h1>
      <p>API: {health?.ok ? `online (${health.time})` : "offline"}</p>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Подключение Discord-бота</h2>
        <p>Нажми кнопку, выбери сервер и подтверди добавление бота.</p>
        {inviteUrl ? (
          <a href={inviteUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "8px 12px", border: "1px solid #64748b", borderRadius: 8 }}>
            Добавить бота на сервер
          </a>
        ) : (
          <p>Не задан `NEXT_PUBLIC_DISCORD_CLIENT_ID` в .env</p>
        )}
      </section>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Auth + RBAC</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {["Owner", "Admin", "Moderator", "Support", "DJ", "Member", "Viewer"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={async () => {
              const data = await call("/auth/login", "POST", { email, password });
              if (data.accessToken) setToken(data.accessToken);
            }}
          >
            Login
          </button>
          <button onClick={() => void call("/auth/register", "POST", { email, password, role })}>Register</button>
          <button onClick={() => void call("/auth/me")}>My profile</button>
          <button onClick={() => void call("/rbac/check", "POST", { role, permission: "music.skip" })}>Check permission</button>
        </div>
      </section>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Tickets</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="ticket title" />
          <button onClick={() => void call("/tickets", "POST", { projectId: "default-project", title: ticketTitle, priority: "high", assigneeTag: "support" })}>Create</button>
          <button onClick={() => void call("/tickets/project/default-project")}>List</button>
        </div>
      </section>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Music</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={musicQuery} onChange={(e) => setMusicQuery(e.target.value)} placeholder="query/url" />
          <button onClick={() => void call("/music/queue", "POST", { projectId: "default-project", title: musicQuery, sourceUrl: "https://youtube.com/results", requestedBy: "web-admin" })}>Play</button>
          <button onClick={() => void call("/music/pause/default-project", "POST")}>Pause</button>
          <button onClick={() => void call("/music/resume/default-project", "POST")}>Resume</button>
          <button onClick={() => void call("/music/skip/default-project", "POST")}>Skip</button>
          <button onClick={() => void call("/music/stop/default-project", "POST")}>Stop</button>
          <button onClick={() => void call("/music/queue/default-project")}>Queue</button>
        </div>
      </section>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Moderation</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={warnUser} onChange={(e) => setWarnUser(e.target.value)} placeholder="user#0000" />
          <input value={warnReason} onChange={(e) => setWarnReason(e.target.value)} placeholder="reason" />
          <button onClick={() => void call("/moderation/action", "POST", { projectId: "default-project", action: "warn", targetTag: warnUser, reason: warnReason })}>Warn</button>
          <button onClick={() => void call(`/moderation/warnings/${encodeURIComponent(warnUser)}`)}>Warnings</button>
        </div>
      </section>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Config / Modules</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="module name" />
          <button onClick={() => void call("/config/view")}>View config</button>
          <button onClick={() => void call("/config/reload", "POST")}>Reload</button>
          <button onClick={() => void call("/module/enable", "POST", { name: moduleName })}>Enable module</button>
          <button onClick={() => void call("/module/disable", "POST", { name: moduleName })}>Disable module</button>
        </div>
      </section>

      <section style={{ padding: 12, border: "1px solid #334155", borderRadius: 12 }}>
        <h2>Console output</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{output}</pre>
      </section>
    </main>
  );
}
