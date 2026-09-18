import { describe, expect, it, vi } from "vitest";
import { buildDeepgramUrl, DeepgramClient, parseDeepgramMessage, SpeakerMap } from "../src/engine/stt/deepgram";
import { DEMO_SCRIPT, MockSttClient } from "../src/engine/stt/mock";
import type { TranscriptEvent } from "../src/engine/types";

describe("buildDeepgramUrl", () => {
  it("encodes linear16 / 16k / mono with endpointing and keyterms", () => {
    const u = new URL(buildDeepgramUrl({ keywords: ["cap rate", "earnest money"], endpointingMs: 300, diarize: true }));
    expect(u.host).toBe("api.deepgram.com");
    expect(u.searchParams.get("encoding")).toBe("linear16");
    expect(u.searchParams.get("sample_rate")).toBe("16000");
    expect(u.searchParams.get("channels")).toBe("1");
    expect(u.searchParams.get("endpointing")).toBe("300");
    expect(u.searchParams.get("interim_results")).toBe("true");
    expect(u.searchParams.get("diarize")).toBe("true");
    expect(u.searchParams.getAll("keyterm")).toEqual(["cap rate", "earnest money"]);
  });
});

describe("parseDeepgramMessage", () => {
  it("parses results and picks the dominant diarized speaker", () => {
    const msg = JSON.stringify({
      type: "Results",
      is_final: true,
      speech_final: true,
      channel: { alternatives: [{ transcript: "we agreed to twelve million", confidence: 0.97, words: [{ word: "we", speaker: 1 }, { word: "agreed", speaker: 1 }, { word: "to", speaker: 0 }] }] },
    });
    const p = parseDeepgramMessage(msg)!;
    expect(p.transcript).toBe("we agreed to twelve million");
    expect(p.isFinal).toBe(true);
    expect(p.speechFinal).toBe(true);
    expect(p.speakerIndex).toBe(1);
  });
  it("ignores metadata, empty transcripts and garbage", () => {
    expect(parseDeepgramMessage(JSON.stringify({ type: "Metadata" }))).toBeNull();
    expect(parseDeepgramMessage(JSON.stringify({ type: "Results", channel: { alternatives: [{ transcript: "" }] } }))).toBeNull();
    expect(parseDeepgramMessage("not json")).toBeNull();
  });
});

describe("SpeakerMap", () => {
  it("maps the calibrated index to USER and everyone else to COUNTERPARTY", () => {
    const m = new SpeakerMap();
    expect(m.resolve(0, "COUNTERPARTY")).toBe("COUNTERPARTY");
    m.calibrate(0);
    expect(m.resolve(0, "COUNTERPARTY")).toBe("USER");
    expect(m.resolve(1, "COUNTERPARTY")).toBe("COUNTERPARTY");
    expect(m.resolve(undefined, "USER")).toBe("USER");
  });
  it("auto-calibrates on the first diarized voice when asked", () => {
    const m = new SpeakerMap(null, true);
    expect(m.resolve(2, "COUNTERPARTY")).toBe("USER");
    expect(m.resolve(0, "COUNTERPARTY")).toBe("COUNTERPARTY");
    expect(m.resolve(2, "COUNTERPARTY")).toBe("USER");
  });
});

class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly OPEN = 1;
  readyState = 0;
  sent: unknown[] = [];
  binaryType = "";
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  constructor(public url: string, public protocols: string[]) {
    FakeSocket.instances.push(this);
  }
  send(d: unknown) {
    this.sent.push(d);
  }
  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1000 });
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

describe("DeepgramClient", () => {
  it("authenticates with the token subprotocol, streams frames, and emits transcripts", async () => {
    FakeSocket.instances = [];
    const events: TranscriptEvent[] = [];
    const client = new DeepgramClient({
      apiKey: "dg_test",
      stream: "COUNTERPARTY",
      socketFactory: (u, p) => new FakeSocket(u, p) as unknown as WebSocket,
      now: () => 1000,
    });
    client.onTranscript = (e) => events.push(e);
    const starting = client.start();
    const sock = FakeSocket.instances[0];
    expect(sock.protocols).toEqual(["token", "dg_test"]);
    sock.open();
    await starting;
    expect(client.status).toBe("open");

    client.sendFrames([{ pcm: new Int16Array(800), speech: false, seq: 0 }]);
    expect(sock.sent.length).toBe(1);
    expect(sock.sent[0]).toBeInstanceOf(ArrayBuffer);

    sock.onmessage?.({ data: JSON.stringify({ type: "Results", is_final: false, channel: { alternatives: [{ transcript: "we agreed" }] } }) });
    sock.onmessage?.({ data: JSON.stringify({ type: "Results", is_final: false, channel: { alternatives: [{ transcript: "we agreed" }] } }) }); // duplicate interim
    sock.onmessage?.({ data: JSON.stringify({ type: "Results", is_final: true, speech_final: true, channel: { alternatives: [{ transcript: "we agreed to twelve million" }] } }) });
    expect(events.map((e) => [e.text, e.isFinal, e.endOfTurn])).toEqual([
      ["we agreed", false, false],
      ["we agreed to twelve million", true, true],
    ]);
    expect(events[0].speaker).toBe("COUNTERPARTY");

    await client.stop();
    expect(sock.sent.some((s) => typeof s === "string" && s.includes("CloseStream"))).toBe(true);
    expect(client.status).toBe("closed");
  });
});

describe("MockSttClient", () => {
  it("plays the demo script as interim then final events", async () => {
    vi.useFakeTimers();
    const events: TranscriptEvent[] = [];
    const mock = new MockSttClient(DEMO_SCRIPT.slice(0, 2), { speed: 1 });
    mock.onTranscript = (e) => events.push(e);
    await mock.start();
    await vi.advanceTimersByTimeAsync(20_000);
    const finals = events.filter((e) => e.isFinal);
    expect(finals.map((e) => e.text)).toEqual(DEMO_SCRIPT.slice(0, 2).map((l) => l.text));
    expect(events.some((e) => !e.isFinal)).toBe(true);
    expect(mock.status).toBe("closed");
    vi.useRealTimers();
  });
});
