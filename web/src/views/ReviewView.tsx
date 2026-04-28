import { Link } from "react-router-dom";
import { useContentPack, categoryName } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { dueCards } from "../engine/srs";
import { formatRelativeDate, loc } from "../engine/util";
import type { Question } from "../types";

export default function ReviewView() {
  const { pack } = useContentPack();
  const { data, toggleBookmark } = useUserData();
  if (!pack) return <div className="card h-72 animate-pulse" />;

  const qById = new Map(pack.questions.map((q) => [q.id, q]));

  // Last 30 attempts, newest first.
  const recent = [...data.attempts].slice(-30).reverse();

  // Wrong answers — most recent unique questions where the latest attempt was wrong.
  const latestByQ = new Map<string, { correct: boolean; ts: number }>();
  for (const a of data.attempts) {
    latestByQ.set(a.questionId, { correct: a.correct, ts: a.timestamp });
  }
  const wrongIds = Array.from(latestByQ.entries())
    .filter(([, v]) => !v.correct)
    .sort((a, b) => b[1].ts - a[1].ts)
    .map(([id]) => id);

  const due = dueCards(data.srsCards)
    .sort((a, b) => a.dueDate - b.dueDate)
    .map((c) => qById.get(c.questionId))
    .filter((q): q is Question => Boolean(q));

  if (data.attempts.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold text-ink-900">Nothing to review yet</h2>
        <p className="mt-2 text-sm text-ink-500">
          Once you start answering questions, your wrong answers and SRS schedule show up here.
        </p>
        <Link to="/practice" className="btn-primary mt-4">
          Start practicing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Review</h1>
        <p className="text-sm text-ink-500">
          What you got wrong and what's coming up for spaced repetition.
        </p>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">
            Due for review · {due.length}
          </h2>
          {due.length > 0 && (
            <Link to="/practice" className="text-sm font-medium text-gulf-500 hover:text-gulf-600">
              Start →
            </Link>
          )}
        </div>
        {due.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            All caught up — the SRS algorithm thinks you're holding everything in memory.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {due.slice(0, 8).map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                pack={pack}
                lang={data.language}
                bookmarked={data.bookmarks.includes(q.id)}
                onBookmark={() => toggleBookmark(q.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">
          Mistakes · {wrongIds.length}
        </h2>
        {wrongIds.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No outstanding wrong answers. Nice work.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {wrongIds.slice(0, 12).map((id) => {
              const q = qById.get(id);
              if (!q) return null;
              return (
                <QuestionRow
                  key={id}
                  q={q}
                  pack={pack}
                  lang={data.language}
                  bookmarked={data.bookmarks.includes(id)}
                  onBookmark={() => toggleBookmark(id)}
                  showCorrect
                />
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Recent activity</h2>
        <ul className="mt-3 divide-y divide-ink-100">
          {recent.map((a, i) => {
            const q = qById.get(a.questionId);
            if (!q) return null;
            return (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        a.correct ? "bg-emerald-100 text-emerald-700" : "bg-coral-400/15 text-coral-600"
                      }`}
                    >
                      {a.correct ? "✓" : "✗"}
                    </span>
                    <span className="truncate text-sm text-ink-700">{loc(q.stem, data.language)}</span>
                  </div>
                  <div className="ml-7 mt-0.5 text-xs text-ink-500">
                    {categoryName(pack, q.category)} · {formatRelativeDate(a.timestamp)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function QuestionRow({
  q,
  pack,
  lang,
  bookmarked,
  onBookmark,
  showCorrect = false,
}: {
  q: Question;
  pack: import("../types").ContentPack;
  lang: string;
  bookmarked: boolean;
  onBookmark: () => void;
  showCorrect?: boolean;
}) {
  const correctChoice = q.choices.find((c) => c.id === q.correct);
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
            {categoryName(pack, q.category)}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink-900">{loc(q.stem, lang)}</p>
          {showCorrect && correctChoice && (
            <p className="mt-1 text-xs text-emerald-700">
              ✓ {loc(correctChoice.text, lang)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onBookmark}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition ${
            bookmarked ? "bg-sun-50 text-sun-500" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          }`}
          aria-label="Bookmark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12v18l-6-4-6 4Z" />
          </svg>
        </button>
      </div>
    </li>
  );
}
