import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useContentPack } from "../engine/contentPack";
import { t } from "../i18n";
import type { Lang, VehicleClass } from "../types";

export default function SettingsView() {
  const navigate = useNavigate();
  const { data, setLanguage, setVehicleClass, resetAll } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!pack) return <div className="card h-72 animate-pulse" />;

  const classes: { id: VehicleClass; emoji: string; key: "car" | "motorcycle" | "cdl" }[] = [
    { id: "car", emoji: "🚗", key: "car" },
    { id: "motorcycle", emoji: "🏍️", key: "motorcycle" },
    { id: "cdl", emoji: "🚛", key: "cdl" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{t("settings", lang)}</h1>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">{t("language", lang)}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["en", "es"] as Lang[]).map((code) => {
            const labels: Record<Lang, string> = { en: "English 🇺🇸", es: "Español 🇪🇸" };
            const active = lang === code;
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
                {labels[code]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">{t("vehicleClass", lang)}</h2>
        <p className="mt-1 text-sm text-ink-500">
          {lang === "es"
            ? "Cambia esto para estudiar otro examen. Tus respuestas y XP se conservan."
            : "Change this to study for a different test. Your answers and XP are preserved."}
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {classes.map((c) => {
            const active = data.profile.vehicleClass === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setVehicleClass(c.id)}
                className={`flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition ${
                  active
                    ? "bg-ink-900 text-white ring-ink-900"
                    : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50"
                }`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-sm font-semibold">{t(c.key, lang)}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => navigate("/start")}
          className="btn-ghost mt-3 text-xs"
        >
          {t("changeClass", lang)} →
        </button>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">
          {lang === "es" ? "Privacidad" : "Privacy"}
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          {lang === "es"
            ? "Esta app no recolecta, transmite ni comparte datos. Tu progreso vive sólo en este navegador."
            : "This app does not collect, transmit, or share any data. Your progress lives only in this browser."}
          {" "}
          <span className="font-medium text-ink-900">
            {lang === "es" ? "Sin cuentas. Sin analítica." : "No accounts. No analytics."}
          </span>
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">
          {lang === "es" ? "Contenido" : "Content"}
        </h2>
        <dl className="mt-3 grid gap-y-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">
              {lang === "es" ? "Paquete" : "Question pack"}
            </dt>
            <dd className="text-ink-900">{pack.code} · {pack.questions.length} {t("questions", lang)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">
              {lang === "es" ? "Versión del manual" : "Handbook version"}
            </dt>
            <dd className="text-ink-900">{pack.handbook.version}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">
              {lang === "es" ? "Última revisión" : "Last reviewed"}
            </dt>
            <dd className="text-ink-900">{pack.handbook.lastReviewed}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">
              {lang === "es" ? "Fuente" : "Source"}
            </dt>
            <dd>
              <a
                href={pack.handbook.url}
                target="_blank"
                rel="noreferrer"
                className="text-gulf-500 hover:text-gulf-600"
              >
                {pack.agency.name} ↗
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">{t("resetProgress", lang)}</h2>
        <p className="mt-1 text-sm text-ink-500">{t("resetWarn", lang)}</p>
        <div className="mt-3 flex gap-2">
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="btn-secondary text-coral-600 ring-coral-200 hover:bg-coral-50"
            >
              {t("resetProgress", lang)}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { resetAll(); setConfirmingReset(false); navigate("/start"); }}
                className="btn-primary bg-coral-500 hover:bg-coral-600"
              >
                {lang === "es" ? "Sí, borrar todo" : "Yes, wipe everything"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="btn-ghost"
              >
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
            </>
          )}
        </div>
      </section>

      <p className="pb-8 text-center text-xs text-ink-400">
        Florida Permit Prep · web v0.2 · {lang === "es" ? "Bilingüe" : "Bilingual"}
      </p>
    </div>
  );
}
