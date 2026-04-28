import { Link } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useContentPack } from "../engine/contentPack";
import { currentStreak, longestStreak, studiedToday } from "../engine/streak";
import { categoryStats } from "../engine/practice";
import { dueCards } from "../engine/srs";

export default function HomeView() {
  const { pack, error } = useContentPack();
  const { data } = useUserData();

  if (error) return <ErrorPanel message={error} />;
  if (!pack) return <Skeleton />;

  const streak = currentStreak(data.attempts);
  const longest = longestStreak(data.attempts);
  const today = studiedToday(data.attempts);
  const stats = categoryStats(pack, data);
  const totalAttempts = data.attempts.length;
  const totalCorrect = data.attempts.filter((a) => a.correct).length;
  const overallAcc = totalAttempts === 0 ? 0 : totalCorrect / totalAttempts;
  const due = dueCards(data.srsCards).length;
  const lastResult = data.mockResults[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-gulf-600 p-6 text-white shadow-card md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-sun-200">
              {pack.agency.name} · {pack.exam.officialName}
            </div>
            <h1 className="text-2xl font-bold leading-tight md:text-4xl">
              Pass your Florida permit
              <br />
              the first time.
            </h1>
            <p className="max-w-md text-sm text-ink-200 md:text-base">
              {pack.exam.questionCount} questions · {pack.exam.passingPercent}% to pass · every wrong
              answer cites the FLHSMV handbook.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <Link to="/practice" className="btn-primary bg-sun-300 text-ink-900 hover:bg-sun-200">
              Start practicing →
            </Link>
            <Link to="/mock" className="text-sm font-medium text-sun-200 hover:text-white">
              Or take a full mock test
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Day streak"
          value={String(streak)}
          sub={today ? "studied today" : "study today to keep it"}
          tone={today ? "good" : "warn"}
        />
        <StatCard
          label="Questions answered"
          value={String(totalAttempts)}
          sub={`${Math.round(overallAcc * 100)}% accuracy`}
        />
        <StatCard
          label="Due for review"
          value={String(due)}
          sub={due > 0 ? "scheduled by SRS" : "all caught up"}
          tone={due > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Best streak"
          value={String(longest)}
          sub={longest === 0 ? "—" : "personal record"}
        />
      </section>

      {lastResult && (
        <section className="card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Last mock test
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink-900">
                  {lastResult.score} / {lastResult.total}
                </span>
                <span
                  className={`chip ${
                    lastResult.passed
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-coral-400/10 text-coral-600"
                  }`}
                >
                  {lastResult.passed ? "Passed" : "Did not pass"}
                </span>
              </div>
              <div className="mt-1 text-sm text-ink-500">
                Need {pack.exam.passingScore} of {pack.exam.questionCount} to pass on the real exam.
              </div>
            </div>
            <Link to="/mock" className="btn-secondary">
              Try again
            </Link>
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Topics</h2>
          <Link to="/practice" className="text-sm font-medium text-gulf-500 hover:text-gulf-600">
            Practice all →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {pack.categories.map((cat) => {
            const s = stats.find((x) => x.categoryId === cat.id)!;
            const totalQs = pack.questions.filter((q) => q.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                to={`/practice?category=${cat.id}`}
                className="flex items-center gap-4 rounded-xl p-2 -m-2 transition hover:bg-ink-50"
              >
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-ink-900">{cat.name}</span>
                    <span className="text-xs text-ink-500">
                      {s.attempts === 0 ? `${totalQs} questions` : `${Math.round(s.accuracy * 100)}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full ${
                        s.attempts === 0
                          ? "bg-ink-200"
                          : s.accuracy >= 0.8
                          ? "bg-emerald-400"
                          : s.accuracy >= 0.6
                          ? "bg-sun-300"
                          : "bg-coral-400"
                      }`}
                      style={{
                        width: `${s.attempts === 0 ? Math.round(cat.weight * 100) : Math.round(s.accuracy * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">About the {pack.exam.officialName}</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>
              <span className="font-medium text-ink-900">{pack.exam.questionCount} questions</span>,{" "}
              {pack.exam.passingPercent}% passing ({pack.exam.passingScore}/
              {pack.exam.questionCount}).
            </li>
            <li>
              <span className="font-medium text-ink-900">Retake:</span> {pack.exam.retakeRule}.
            </li>
            {pack.exam.feeRetake && (
              <li>
                <span className="font-medium text-ink-900">Retake fee:</span> ${pack.exam.feeRetake.toFixed(2)}.
              </li>
            )}
            <li>
              <span className="font-medium text-ink-900">Languages:</span>{" "}
              {pack.languages.test.join(", ").toUpperCase()} on the official test.
            </li>
          </ul>
          {pack.languages.note && (
            <p className="mt-3 rounded-lg bg-sun-50 p-3 text-xs text-ink-700">{pack.languages.note}</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">Florida-specific rules</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            {pack.specialNotes.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gulf-400" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <a
            href={pack.handbook.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-gulf-500 hover:text-gulf-600"
          >
            Open the official FLHSMV handbook ↗
          </a>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink-900">{value}</div>
      {sub && (
        <div
          className={`mt-1 text-xs ${
            tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-coral-500" : "text-ink-500"
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-3xl bg-ink-100" />
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100" />
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-coral-600">Couldn't load the question pack</h2>
      <p className="mt-2 text-sm text-ink-600">{message}</p>
    </div>
  );
}
