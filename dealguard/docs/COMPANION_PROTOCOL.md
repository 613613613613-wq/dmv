# Companion protocol v1

In Companion mode the phone is a Glance HUD for a desktop daemon that runs
capture, transcription and the gating engine on a laptop. The daemon serves a
WebSocket at `ws://<lan-ip>:8765/hud` and pushes cues; the phone renders them
and sends back a few interaction events. Nothing leaves the local network.

- Transport: WebSocket, JSON text frames, UTF-8, one message per frame.
- Path: `/hud`. Port: `8765`. Scheme: `ws://` (LAN only; see Security).
- Protocol version: `1`. Both sides announce it in `hello`.
- Unknown `type`, unknown fields or frames that fail validation are **dropped
  silently** by the phone (`src/engine/companion/protocol.ts`). Unknown
  fields are ignored, not rejected.
- The phone reconnects with exponential backoff starting at 500 ms, doubling,
  capped at 10 s, with jitter (`src/engine/companion/link.ts`).

## Messages: server → phone

### `hello`

Sent once after the socket opens.

```json
{ "type": "hello", "name": "Shlomo's MacBook", "version": 1 }
```

| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name shown on the HUD while connecting. |
| `version` | number | Must be `1`. A different major version is shown as "incompatible" and the link closes. |

### `cue`

Replaces whatever is on screen. There is at most one visible cue; the phone
does not queue cues.

```json
{
  "type": "cue",
  "id": "c_0142",
  "tier": 1,
  "kind": "RED_FLAG",
  "headline": "Their $2.6M contradicts agreed $2.4M price",
  "source": "PSA_Draft_v3_Clean.pdf · 2026-08-15",
  "topic": "purchase_price",
  "ttlMs": 8000
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique per cue; echoed back in `dismiss` / `freeze`. |
| `tier` | 1 \| 2 \| 3 | 1 = red flag, 2 = fact card, 3 = talking point. Lower number wins if two cues arrive within the same render frame. |
| `kind` | `"RED_FLAG"` \| `"FACT_CARD"` \| `"TALKING_POINT"` \| `"CONFIDENTIAL"` | `CONFIDENTIAL` is rendered like a tier-1 flag (the user is about to disclose an internal figure). |
| `headline` | string, ≤ 160 chars | The daemon should keep to ≤ 12 words; the phone truncates at 160 characters. |
| `source` | string | One source line, e.g. `PSA_Draft_v3_Clean.pdf · 2026-08-15`. May be empty. |
| `topic` | string | Term key (`purchase_price`, `earnest_deposit`, `inspection_window`, `financing_contingency`, `closing_date`, `cap_rate`, `dscr`, ...). Used for haptic pattern selection and the end-of-call summary. |
| `ttlMs` | number, optional | Auto-clear after this many ms. Default: tier 1 stays until cleared or dismissed; tier 2 and 3 default 8000. A frozen cue ignores TTL. |

### `clear`

```json
{ "type": "clear", "id": "c_0142" }
{ "type": "clear" }
```

With `id`: clears only if that cue is currently shown. Without `id`: clears
the screen. A frozen cue is not cleared by `clear` with a different `id`.

### `status`

```json
{ "type": "status", "self": "open", "counterparty": "open" }
```

`self` and `counterparty` are each `"open"` | `"closed"` | `"error"` and
describe the daemon's audio/STT channels. The HUD shows two small dots in the
corner; `error` turns a dot red.

### `ping`

```json
{ "type": "ping", "t": 1758201600123 }
```

The phone answers with `pong` carrying the same `t`. The daemon should ping
every 5–10 s and treat two missed pongs as a dead link.

## Messages: phone → server

### `hello`

Sent immediately after the socket opens, before the server's `hello` is
required.

```json
{ "type": "hello", "device": "iPhone 15 Pro", "version": 1, "token": "optional shared secret" }
```

### `pong`

```json
{ "type": "pong", "t": 1758201600123 }
```

### `dismiss`

The user swiped the cue away.

```json
{ "type": "dismiss", "id": "c_0142" }
```

### `freeze`

The user long-pressed to pin the cue (or released it). While frozen, the
phone ignores new cues of lower priority and TTL for this cue.

```json
{ "type": "freeze", "id": "c_0142", "frozen": true }
```

### `help`

The user pressed "Help Now". The daemon should reply with a tier-3
`TALKING_POINT` cue (or nothing if it has none).

```json
{ "type": "help" }
```

## Sequence

```
 phone                                       daemon (laptop)
   │                                             │
   │── TCP/WS connect ws://192.168.1.20:8765/hud ─▶│
   │── {"type":"hello","device":"iPhone","version":1} ─▶
   │◀─ {"type":"hello","name":"MacBook","version":1} ──│
   │◀─ {"type":"status","self":"open","counterparty":"open"}
   │                                             │
   │◀─ {"type":"ping","t":1001} ─────────────────│
   │── {"type":"pong","t":1001} ────────────────▶│
   │                                             │
   │                                (counterparty misstates price)
   │◀─ {"type":"cue","id":"c1","tier":1,"kind":"RED_FLAG",...} ──│
   │   [HUD shows red flag, haptic]              │
   │── {"type":"freeze","id":"c1","frozen":true} ▶│   (user long-presses)
   │── {"type":"freeze","id":"c1","frozen":false} ▶│
   │── {"type":"dismiss","id":"c1"} ────────────▶│
   │   [HUD blank]                               │
   │                                             │
   │── {"type":"help"} ─────────────────────────▶│   (user taps Help Now)
   │◀─ {"type":"cue","id":"c2","tier":3,"kind":"TALKING_POINT","ttlMs":10000,...}
   │   [auto-clears after 10 s]                  │
   │                                             │
   │◀─ {"type":"clear"} ─────────────────────────│   (daemon: end meeting)
   │                                             │
   ✕  link drops                                 │
   │  retry 0.5 s → 1 s → 2 s → 4 s → 8 s → 10 s → 10 s ...
   │── reconnect + hello ───────────────────────▶│
```

## Validation rules (phone side)

- Frame must parse as a JSON object with a string `type`.
- `cue` requires `id`, `tier` ∈ {1,2,3}, `kind` ∈ the four values, string
  `headline` (1–160 chars), string `source`, string `topic`; `ttlMs` if
  present must be a finite positive number.
- `status` requires both fields with allowed values.
- `ping` requires a finite number `t`.
- `hello` requires `version === 1`. If the daemon is configured with a token,
  it must close the socket when the phone's `hello` carries a different one.
  The token travels only inside this frame — never in the URL — so it does
  not end up in access logs.
- Anything else is dropped and counted in a debug counter shown under
  Settings → Companion.

## Security

The link is plaintext by design: it is meant for a laptop and phone on the
same trusted LAN, and adding TLS would require certificate provisioning on a
private IP. Do not expose port 8765 beyond the LAN. Cues contain deal
terms; on an untrusted network use Live mode instead. The phone only connects
to the address the user typed, and refuses anything that is not a private
address: `10/8`, `172.16/12`, `192.168/16`, `169.254/16` link-local,
`127/8`, `localhost` or an mDNS `*.local` name (`isPrivateHost` in
`src/engine/companion/protocol.ts`). There is no discovery broadcast in v1.
Incoming frames are bounded (`id`/`topic` ≤ 64 chars, `headline` ≤ 160,
`source` ≤ 120, `ttlMs` clamped to 1–120 s) and rendered as plain text.

Platform notes: iOS needs `NSLocalNetworkUsageDescription` and ATS
`NSAllowsLocalNetworking`; Android needs the network security config that
permits cleartext for the LAN (see `DATA_SAFETY.md`).

## Running the mock daemon

`scripts/mock-hud-server.mjs` is a small Node broadcaster that plays the
sample negotiation as cues.

```bash
cd dealguard
npm run mock-hud            # listens on 0.0.0.0:8765, path /hud
```

Find the laptop's LAN IP:

- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I | awk '{print $1}'`
- Windows: `ipconfig` → IPv4 Address of the Wi-Fi adapter

On the phone: Home → Companion → enter `192.168.x.y` (port 8765 is the
default; the field also accepts `host:port` or a full `ws://` URL) → Connect.
Both devices must be on the same Wi-Fi; guest networks with client isolation
will block the connection. The mock daemon logs each phone message it receives
(`hello`, `pong`, `dismiss`, `freeze`, `help`) so the round trip can be
verified.

For a browser-side smoke test without a phone, run `npm run dev` and open the
Companion view at `http://localhost:5173`; enter `localhost` as the host.

## Versioning

Additive changes (new optional fields, new `type`s) do not bump `version`;
the phone ignores what it does not know. A breaking change bumps `version` to
`2` and the phone shows "Update Deal Guard" or "Update the desktop daemon"
depending on which side is older.
