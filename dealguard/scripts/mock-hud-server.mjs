#!/usr/bin/env node
/**
 * Mock desktop broadcaster for Companion mode. Speaks the protocol in
 * docs/COMPANION_PROTOCOL.md and pushes a scripted set of cues so you can
 * test the phone HUD without the real audio daemon.
 *
 *   npm run mock-hud            # listens on ws://0.0.0.0:8765/hud
 *   PORT=9000 npm run mock-hud
 *
 * Then in the app: Settings → Companion desktop host → your laptop's LAN IP.
 */
import { WebSocketServer } from "ws";
import os from "node:os";

const PORT = Number(process.env.PORT || 8765);
const wss = new WebSocketServer({ port: PORT, path: "/hud" });

const SCRIPT = [
  { tier: 1, kind: "RED_FLAG", headline: "Record: Purchase price is $14,250,000, not $12M. They misstated it.", source: "PSA_Draft_v3_Clean.pdf · 2026-08-15", topic: "purchase_price", ttlMs: 12000 },
  { tier: 2, kind: "FACT_CARD", headline: "Earnest deposit: $500,000", source: "PSA_Draft_v3_Clean.pdf · 2026-08-15", topic: "earnest_deposit", ttlMs: 8000 },
  { tier: 1, kind: "RED_FLAG", headline: "$15M is above walk away price $14,500,000. Hold.", source: "IC_Memo_HarborPoint.pdf · 2026-08-10", topic: "walk_away_price", ttlMs: 12000 },
  { tier: 3, kind: "TALKING_POINT", headline: "Hold inspection window at 21 calendar days. Trade elsewhere, not here.", source: "IC_Memo_HarborPoint.pdf · 2026-08-10", topic: "inspection_window", ttlMs: 10000 },
];

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}

wss.on("connection", (ws) => {
  console.log("phone connected");
  ws.send(JSON.stringify({ type: "hello", name: "mock-daemon", version: 1 }));
  ws.send(JSON.stringify({ type: "status", self: "open", counterparty: "open" }));
  let i = 0;
  const timer = setInterval(() => {
    const c = SCRIPT[i % SCRIPT.length];
    ws.send(JSON.stringify({ type: "cue", id: `mock-${Date.now()}`, ...c }));
    i++;
  }, 9000);
  const ping = setInterval(() => ws.send(JSON.stringify({ type: "ping", t: Date.now() })), 5000);
  ws.on("message", (raw) => {
    try {
      const m = JSON.parse(String(raw));
      if (m.type === "help") ws.send(JSON.stringify({ type: "cue", id: `help-${Date.now()}`, tier: 3, kind: "TALKING_POINT", headline: "Ask what their number is based on before responding.", source: "mock-daemon", topic: "general", ttlMs: 10000 }));
      else console.log("phone →", m);
    } catch {
      /* ignore */
    }
  });
  ws.on("close", () => {
    clearInterval(timer);
    clearInterval(ping);
    console.log("phone disconnected");
  });
});

console.log(`Mock HUD broadcaster on ws://0.0.0.0:${PORT}/hud`);
for (const a of lanAddresses()) console.log(`  → point the phone at ${a}`);
