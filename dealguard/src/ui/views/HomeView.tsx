import { useNavigate } from "react-router-dom";
import { BRAND } from "../../brand";
import { canCreateDossier, formatHours, remainingSeconds } from "../../engine/billing/entitlements";
import { PLANS } from "../../engine/billing/plans";
import { makeDemoDeal } from "../../engine/demoDeal";
import { DEMO_CONVERSATION } from "../../engine/coach/demoConversation";
import { newId } from "../../engine/store/vault";
import type { Deal } from "../../engine/types";
import { useApp } from "../AppContext";
import { Button, Card, Empty, Pill, Screen, SectionTitle } from "../components";

export function HomeView() {
  const nav = useNavigate();
  const { deals, conversations, usage, sessions, saveDeal, settings } = useApp();
  const active = deals.filter((d) => !d.archived);
  const now = new Date();
  const remaining = remainingSeconds(usage, now);
  const plan = PLANS[usage.planId];
  const canAdd = canCreateDossier(usage, active.length);

  const newDeal = async () => {
    if (!canAdd) return nav("/paywall");
    const id = newId("deal");
    const deal: Deal = {
      projectId: id,
      name: "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      side: "buyer",
      counterparties: [],
      terms: [],
      keywords: [],
      archived: false,
    };
    await saveDeal(deal);
    nav(`/deal/${id}`);
  };

  return (
    <Screen
      padded
      testId="home"
      title={BRAND.name}
      right={
        <button aria-label="Settings" onClick={() => nav("/settings")} className="w-10 h-10 rounded-full flex items-center justify-center text-ink-300 active:bg-ink-800" data-testid="nav-settings">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      }
    >
      <Card className="mt-4 flex items-center gap-4" onClick={() => nav("/paywall")} testId="usage-card">
        <div className="flex-1">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">{plan.name} plan</div>
          <div className="text-[22px] font-extrabold mt-0.5">{formatHours(remaining)}</div>
          <div className="text-[12px] text-ink-400">live time left this month · mode: {settings.sttMode}</div>
        </div>
        <Pill tone={remaining <= 0 ? "flag" : "calm"}>{remaining <= 0 ? "Upgrade" : "Ready"}</Pill>
      </Card>

      <Button full variant="flag" className="mt-4 h-14 text-[16px]" onClick={() => nav("/talk/new")} data-testid="new-talk">
        New conversation
      </Button>
      <p className="text-[13px] text-ink-400 mt-2 leading-snug">Type what it's about and what you want. Works for your partner, a friend, a landlord or a client.</p>

      <SectionTitle
        right={
          <button onClick={() => nav(`/live/talk/${DEMO_CONVERSATION.id}?mode=demo`)} className="text-[13px] font-semibold text-link" data-testid="talk-demo">
            Try the demo
          </button>
        }
      >
        Conversations
      </SectionTitle>
      {!conversations.length && <p className="text-[13px] text-ink-400">Nothing saved yet. The demo plays a scripted talk about planning a trip with a spouse.</p>}
      <div className="space-y-2">
        {conversations.map((c) => (
          <Card key={c.id} testId={`talk-${c.id}`}>
            <div className="text-[16px] font-bold truncate">{c.title || "Untitled"}</div>
            <div className="text-[13px] text-ink-300 mt-1 line-clamp-2 leading-snug">{c.goal}</div>
            <div className="flex gap-2 mt-3">
              <Button full onClick={() => nav(`/talk/${c.id}`)} data-testid={`open-talk-${c.id}`}>
                Start
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle
        right={
          <button onClick={newDeal} className="text-[13px] font-semibold text-link" data-testid="new-deal">
            + New deal
          </button>
        }
      >
        Deal dossiers (advanced)
      </SectionTitle>
      <p className="text-[13px] text-ink-400 mb-2 leading-snug">For negotiations with hard numbers: enter your terms once and get red flags the moment someone misstates or crosses them.</p>

      {!active.length && (
        <Empty
          title="No deals yet"
          body="Load the fictional sample deal to see the engine work, or create your own dossier from your PSA, LOI or term sheet."
          action={
            <Button variant="subtle" onClick={() => saveDeal(makeDemoDeal(now))} data-testid="load-sample">
              Load sample deal
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {active.map((d) => {
          const caps = d.terms.filter((t) => t.status === "hard_cap").length;
          const conf = d.terms.filter((t) => t.status === "internal_confidential").length;
          return (
            <Card key={d.projectId} testId={`deal-${d.projectId}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-bold truncate">{d.name || "Untitled deal"}</div>
                  <div className="text-[13px] text-ink-400 mt-0.5">
                    {d.terms.length} terms · {caps} hard caps · {conf} confidential · you are the {d.side}
                  </div>
                  {d.counterparties.length > 0 && <div className="text-[13px] text-ink-300 mt-1 truncate">vs. {d.counterparties.map((c) => c.name).join(", ")}</div>}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button full onClick={() => nav(`/preflight/${d.projectId}`)} data-testid={`start-${d.projectId}`}>
                  Pre-flight & start
                </Button>
                <Button variant="ghost" onClick={() => nav(`/deal/${d.projectId}`)} aria-label="Edit deal" data-testid={`edit-${d.projectId}`}>
                  Edit
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {!canAdd && active.length > 0 && (
        <p className="text-[12px] text-ink-400 mt-3">
          Your {plan.name} plan allows {plan.dossierCap} active dossier{plan.dossierCap === 1 ? "" : "s"}.{" "}
          <button className="text-link font-semibold" onClick={() => nav("/paywall")}>
            Upgrade
          </button>{" "}
          or archive one.
        </p>
      )}

      <SectionTitle
        right={
          sessions.length > 0 ? (
            <button onClick={() => nav("/sessions")} className="text-[13px] font-semibold text-link">
              All
            </button>
          ) : undefined
        }
      >
        Recent memoranda
      </SectionTitle>
      {!sessions.length && <p className="text-[13px] text-ink-400">Your first deal memorandum will appear here after you end a call.</p>}
      <div className="space-y-2">
        {sessions.slice(0, 3).map((s) => (
          <Card key={s.id} onClick={() => nav(`/memo/${s.id}`)} testId={`memo-${s.id}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate">{s.dealName}</div>
                <div className="text-[12px] text-ink-400">
                  {new Date(s.endedAt).toLocaleString()} · {Math.round(s.durationMs / 60000)} min
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
