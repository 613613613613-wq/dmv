import { useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";
import { Card, Empty, Pill, Screen } from "../components";

export function SessionsView() {
  const nav = useNavigate();
  const { sessions } = useApp();
  return (
    <Screen title="Memoranda" back="/home">
      {!sessions.length && <div className="mt-4"><Empty title="No calls yet" /></div>}
      <div className="space-y-2 mt-4">
        {sessions.map((s) => (
          <Card key={s.id} onClick={() => nav(`/memo/${s.id}`)}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate">{s.dealName}</div>
                <div className="text-[12px] text-ink-400">
                  {new Date(s.endedAt).toLocaleString()} · {Math.round(s.durationMs / 60000)} min · {s.ledger.length} ledger entries
                </div>
              </div>
              {s.stats.redFlags > 0 ? <Pill tone="flag">{s.stats.redFlags} flags</Pill> : <Pill tone="calm">clean</Pill>}
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
