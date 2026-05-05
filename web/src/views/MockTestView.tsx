import { Link } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useContentPack } from "../engine/contentPack";
import { formatRelativeDate, formatDuration } from "../engine/util";
import { t } from "../i18n";
import type { Lang } from "../types";

export default function MockTestView() {
  const { data } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);
  if (!pack) return <div className="card h-72 animate-pulse" />;

  const sampleSize = Math.min(pack.exam.questionCount, pack.questions.length);
  const passMark = Math.ceil((sampleSize * pack.exam.passingPercent) / 100);
  const undersized = sampleSize < pack.exam.questionCount;

  return (
    <div className="space-y-6">
      <section className="card p-6 md:p-8">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
          {t("mockTestMode", lang)}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-ink-900 md:text-3xl">
          {pack.exam.officialName}
        </h1>
        <p className="mt-2 text-sm text-ink-600 md:text-base">
          {lang === "es"
            ? `Una simulación con formato real. ${sampleSize} preguntas, muestreadas por categoría como hace FLHSMV. Aprueba con ${passMark}/${sampleSize} (${pack.exam.passingPercent}%).`
            : `A real-format simulation. ${sampleSize} questions, sampled by category weight to mirror FLHSMV. Pass at ${passMark}/${sampleSize} (${pack.exam.passingPercent}%).`}
        </p>
        {undersized && (
          <div
            role="note"
            className="mt-4 flex items-start gap-3 rounded-xl border border-sun-300 bg-sun-50 p-4 text-sm text-ink-800"
          >
            <span aria-hidden className="text-xl leading-none">⚠️</span>
            <div>
              <div className="font-semibold text-ink-900">
                {t("growingQuestionBank", lang)}
              </div>
              <p className="mt-1 leading-relaxed">
                {lang === "es"
                  ? `El examen oficial de FLHSMV tiene ${pack.exam.questionCount} preguntas. Esta simulación usa ${sampleSize} (todo el banco actual), muestreadas por categoría. Mantenemos el umbral del ${pack.exam.passingPercent}% para que practiques al mismo nivel.`
                  : `The official FLHSMV exam has ${pack.exam.questionCount} questions. This simulation uses ${sampleSize} (the full bank we have today), sampled by category weight. We keep the ${pack.exam.passingPercent}% pass threshold so you practice at the same difficulty.`}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Spec label={t("questions", lang)} value={String(sampleSize)} />
          <Spec
            label={t("passMark", lang)}
            value={`${passMark} / ${sampleSize}`}
          />
          <Spec
            label={t("timeLimit", lang)}
            value={pack.exam.timeLimitMinutes ? `${pack.exam.timeLimitMinutes} min` : t("untimed", lang)}
          />
        </div>

        <div className="mt-3 rounded-xl bg-coral-50 p-3 text-xs text-coral-800">
          ❤️ {lang === "es"
            ? "Modo vidas: 3 corazones. Si fallas 3 preguntas, el examen termina."
            : "Hearts mode: you have 3 hearts. Lose them all and the exam ends."}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/mock/exam" className="btn-primary">
            {t("beginMockTest", lang)}
          </Link>
          <Link to="/practice" className="btn-secondary">
            {t("practiceModeInstead", lang)}
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">{t("pastAttempts", lang)}</h2>
        {data.mockResults.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t("noMockYet", lang)}</p>
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
                      {r.passed ? t("passed", lang) : t("didNotPass", lang)}
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
