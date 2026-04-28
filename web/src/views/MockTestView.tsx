import { Link } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useContentPack } from "../engine/contentPack";
import { formatRelativeDate, formatDuration } from "../engine/util";

export default function MockTestView() {
  const { pack } = useContentPack();
  const { data } = useUserData();
  if (!pack) return <div className="card h-72 animate-pulse" />;

  const sampleSize = Math.min(pack.exam.questionCount, pack.questions.length);
  const tooSmall = pack.questions.length < pack.exam.questionCount;

  return (
    <div className="space-y-6">
      <section className="card p-6 md:p-8">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Mock test mode
        </div>
        <h1 className="mt-1 text-2xl font-bold text-ink-900 md:text-3xl">
          {pack.exam.officialName}
        </h1>
        <p className="mt-2 text-sm text-ink-600 md:text-base">
          A real-format simulation. {pack.exam.questionCount} questions, sampled by category weight
          to mirror what FLHSMV actually puts on the test. Pass at {pack.exam.passingScore}/
          {pack.exam.questionCount} ({pack.exam.passingPercent}%).
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Spec label="Questions" value={String(sampleSize)} />
          <Spec
            label="Pass mark"
            value={`${Math.ceil((sampleSize * pack.exam.passingPercent) / 100)} / ${sampleSize}`}
          />
          <Spec
            label="Time limit"
            value={pack.exam.timeLimitMinutes ? `${pack.exam.timeLimitMinutes} min` : "Untimed"}
          />
        </div>

        {tooSmall && (
          <p className="mt-4 rounded-xl bg-sun-50 p-3 text-xs text-ink-700">
            <strong>Demo note:</strong> the bundled Florida pack has {pack.questions.length} sample
            questions. Real mock tests will use the full {pack.exam.questionCount}-question bank
            once content is finalized.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/mock/exam" className="btn-primary">
            Begin mock test
          </Link>
          <Link to="/practice" className="btn-secondary">
            Practice mode instead
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Past attempts</h2>
        {data.mockResults.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            No mock tests yet. The first one usually doesn't pass — that's expected. Use it to find
            your weak topics, then come back.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {data.mockResults.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {r.score} / {r.total}
                    </span>
                    <span
                      className={`chip ${
                        r.passed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-coral-400/10 text-coral-600"
                      }`}
                    >
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {formatRelativeDate(r.timestamp)} · {formatDuration(r.durationSeconds)}
                  </div>
                </div>
                <span className="text-xs text-ink-400">
                  {Math.round((r.score / r.total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-ink-900">{value}</div>
    </div>
  );
}
