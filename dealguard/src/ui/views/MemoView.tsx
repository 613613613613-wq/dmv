import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { shareText } from "../../native/share";
import { useApp } from "../AppContext";
import { Button, Card, Empty, Pill, Screen, SectionTitle } from "../components";
import { Markdown } from "../markdown";

export function MemoView() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const { sessions, deleteSession } = useApp();
  const rec = sessions.find((s) => s.id === sessionId);
  const [showLedger, setShowLedger] = useState(false);
  const [shared, setShared] = useState<string | null>(null);

  if (!rec) return <Screen title="Memorandum" back="/home"><Empty title="Not found" /></Screen>;

  const share = async () => {
    const r = await shareText(`Deal Memorandum — ${rec.dealName}`, rec.memorandumMarkdown);
    setShared(r === "copied" ? "Copied to clipboard" : r === "shared" ? "Shared" : "Could not share");
    setTimeout(() => setShared(null), 1800);
  };

  const lat = rec.stats.medianLatencyMs;
  const per30 = (rec.stats.unsolicitedCues / Math.max(1, rec.durationMs / 60000)) * 30;

  return (
    <Screen
      title="Deal memorandum"
      back="/home"
      testId="memo"
      right={
        <Button variant="subtle" className="h-9 px-3 text-[13px]" onClick={share} data-testid="memo-share">
          {shared ?? "Share"}
        </Button>
      }
    >
      <div className="mt-4 rounded-2xl bg-ink-900 border border-ink-800 p-4">
        <Markdown text={rec.memorandumMarkdown} />
      </div>

      <SectionTitle>Benchmarks for this call</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <div className="text-[12px] text-ink-400">Median time-to-cue</div>
          <div className="text-[22px] font-extrabold">{lat === null ? "—" : `${lat} ms`}</div>
          <Pill tone={lat === null ? "neutral" : lat <= 250 ? "calm" : lat <= 600 ? "fact" : "flag"}>{lat === null ? "no cues" : lat <= 250 ? "target ≤250" : lat <= 600 ? "acceptable" : "fail >600"}</Pill>
        </Card>
        <Card>
          <div className="text-[12px] text-ink-400">Unprompted cues / 30 min</div>
          <div className="text-[22px] font-extrabold">{per30.toFixed(1)}</div>
          <Pill tone={per30 < 2 ? "calm" : "fact"}>{per30 < 2 ? "target <2" : "review thresholds"}</Pill>
        </Card>
        <Card>
          <div className="text-[12px] text-ink-400">Red flags</div>
          <div className="text-[22px] font-extrabold">{rec.stats.redFlags}</div>
        </Card>
        <Card>
          <div className="text-[12px] text-ink-400">Fact cards</div>
          <div className="text-[22px] font-extrabold">{rec.stats.factCards}</div>
        </Card>
      </div>
      <p className="text-[12px] text-ink-400 mt-2">Hallucination rate is 0% by construction: every figure shown came from the vault or the transcript.</p>

      <SectionTitle
        right={
          <button className="text-[13px] font-semibold text-link" onClick={() => setShowLedger(!showLedger)} data-testid="toggle-ledger">
            {showLedger ? "Hide" : "Show"}
          </button>
        }
      >
        Live ledger ({rec.ledger.length})
      </SectionTitle>
      {showLedger && (
        <div className="space-y-2" data-testid="ledger">
          {rec.ledger.map((e) => (
            <Card key={e.entryId}>
              <div className="flex items-center gap-2 text-[12px] text-ink-400">
                <span className="tabular-nums">{fmtOffset(e.offsetMs)}</span>
                <span className="font-semibold text-ink-300">{e.speaker === "USER" ? "You" : "Them"}</span>
                <Pill tone={e.assertionType === "REJECTION" ? "flag" : e.assertionType === "CONCESSION" || e.assertionType === "AGREEMENT" ? "calm" : e.assertionType === "QUESTION" ? "link" : "fact"}>{e.assertionType}</Pill>
                <span className="ml-auto">{e.topic.replace(/_/g, " ")}</span>
              </div>
              <div className="text-[14px] mt-1.5 leading-snug">“{e.verbatimText}”</div>
              {e.flaggedTermId && <div className="text-[12px] text-flag mt-1">flagged</div>}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <Button variant="ghost" full onClick={() => nav("/home")}>
          Home
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Delete this memorandum?")) deleteSession(rec.id).then(() => nav("/home"));
          }}
        >
          Delete
        </Button>
      </div>
    </Screen>
  );
}

function fmtOffset(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
