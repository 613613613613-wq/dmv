import { useState } from "react";
import { useUserData } from "../engine/store";
import { useContentPack } from "../engine/contentPack";

export default function SettingsView() {
  const { pack } = useContentPack();
  const { data, setLanguage, resetAll } = useUserData();
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!pack) return <div className="card h-72 animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Preferences are stored locally on your device.</p>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Study language</h2>
        <p className="mt-1 text-sm text-ink-500">
          {pack.languages.note ?? "The official test is English-only. Study mode shows you the same content in your chosen language."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {pack.languages.ui.map((code) => {
            const labels: Record<string, string> = {
              en: "English",
              es: "Español",
              ht: "Kreyòl Ayisyen",
            };
            const active = data.language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 transition ${
                  active
                    ? "bg-ink-900 text-white ring-ink-900"
                    : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50"
                }`}
              >
                {labels[code] ?? code.toUpperCase()}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Test day checklist</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-700">
          {[
            "Two forms of ID — primary (passport / birth certificate) + secondary (Social Security card or W-2)",
            "Proof of Florida residency — two documents (utility bill, lease, bank statement)",
            "TLSAE 4-hour course completion certificate",
            "Parental consent form if under 18 (notarized or signed in front of clerk)",
            `Exam fee — confirm with your local tax collector office. Retake fee is $${pack.exam.feeRetake?.toFixed(2) ?? "—"} if needed.`,
            "Eyeglasses or contacts if you need them for the vision test",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 h-4 w-4 flex-shrink-0 rounded border border-ink-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Privacy</h2>
        <p className="mt-2 text-sm text-ink-600">
          This app does not collect, transmit, or share any data. Your progress, bookmarks, and mock
          test results live only in this browser's local storage.{" "}
          <span className="font-medium text-ink-900">No accounts. No analytics. No tracking.</span>
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Content</h2>
        <dl className="mt-3 grid gap-y-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Question pack</dt>
            <dd className="text-ink-900">{pack.code} · {pack.questions.length} questions</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Handbook version</dt>
            <dd className="text-ink-900">{pack.handbook.version}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Last reviewed</dt>
            <dd className="text-ink-900">{pack.handbook.lastReviewed}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Source</dt>
            <dd>
              <a
                href={pack.handbook.url}
                target="_blank"
                rel="noreferrer"
                className="text-gulf-500 hover:text-gulf-600"
              >
                Official FLHSMV handbook ↗
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">Reset progress</h2>
        <p className="mt-1 text-sm text-ink-500">
          Wipes attempts, bookmarks, SRS schedule, and mock test history. Cannot be undone.
        </p>
        <div className="mt-3 flex gap-2">
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="btn-secondary text-coral-600 ring-coral-200 hover:bg-coral-50"
            >
              Reset all data
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setConfirmingReset(false);
                }}
                className="btn-primary bg-coral-500 hover:bg-coral-600"
              >
                Yes, wipe everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </section>

      <p className="pb-8 text-center text-xs text-ink-400">
        DMV Permit Prep · Florida v0.1 (web) · Same engine as the iOS app.
      </p>
    </div>
  );
}
