import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "../engine/store";
import { t } from "../i18n";
import type { Lang, VehicleClass } from "../types";

export default function OnboardingView() {
  const navigate = useNavigate();
  const { data, setProfile } = useUserData();
  const [step, setStep] = useState<"lang" | "class">(data.profile.vehicleClass ? "class" : "lang");
  const [lang, setLang] = useState<Lang>(data.profile.language ?? "en");

  function pickLang(l: Lang) {
    setLang(l);
    setProfile({ ...data.profile, language: l });
    setStep("class");
  }

  function pickClass(vc: VehicleClass) {
    setProfile({ ...data.profile, language: lang, vehicleClass: vc });
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-900 via-ink-800 to-gulf-700 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sun-300 text-2xl font-black text-ink-900">
            FL
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {step === "lang" ? "Welcome / Bienvenido" : t("pickClass", lang)}
          </h1>
          <p className="mt-2 text-sm text-ink-200 md:text-base">
            {step === "lang" ? (
              // Pre-language screen — show both versions side-by-side so neither
              // EN nor ES users land on a string they can't read.
              <>
                {t("welcomeBlurb", "en")}
                <br />
                <span className="opacity-80">{t("welcomeBlurb", "es")}</span>
              </>
            ) : lang === "es" ? (
              "Personalizamos tus preguntas, lecciones y señales según el examen que vas a tomar."
            ) : (
              "We tailor your questions, lessons, and signs to the test you'll actually take."
            )}
          </p>
        </header>

        {step === "lang" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <LanguageButton
              label="English"
              sub="Class E, Motorcycle, CDL"
              flag="🇺🇸"
              onClick={() => pickLang("en")}
            />
            <LanguageButton
              label="Español"
              sub="Clase E, Motocicleta, CDL"
              flag="🇪🇸"
              onClick={() => pickLang("es")}
            />
          </div>
        ) : (
          <div className="grid gap-4">
            <ClassButton
              emoji="🚗"
              title={t("car", lang)}
              blurb={t("carBlurb", lang)}
              onClick={() => pickClass("car")}
            />
            <ClassButton
              emoji="🏍️"
              title={t("motorcycle", lang)}
              blurb={t("motorcycleBlurb", lang)}
              onClick={() => pickClass("motorcycle")}
            />
            <ClassButton
              emoji="🚛"
              title={t("cdl", lang)}
              blurb={t("cdlBlurb", lang)}
              onClick={() => pickClass("cdl")}
            />
            <button
              type="button"
              onClick={() => setStep("lang")}
              className="mt-2 self-center text-xs font-medium text-sun-200 hover:text-white"
            >
              ← {t("back", lang)}
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-ink-300">
          {lang === "es"
            ? "Datos de los manuales FLHSMV, MSF y CDL. No se recopila ni envía información personal."
            : "Content sourced from the FLHSMV, MSF, and CDL handbooks. No personal data is collected or sent."}
        </p>
      </div>
    </div>
  );
}

function LanguageButton({
  label, sub, flag, onClick,
}: { label: string; sub: string; flag: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl bg-white/10 p-5 text-left ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
    >
      <span className="text-4xl">{flag}</span>
      <span className="flex-1">
        <span className="block text-lg font-bold">{label}</span>
        <span className="block text-xs text-ink-200">{sub}</span>
      </span>
      <span className="text-xl text-sun-200 transition group-hover:translate-x-1">→</span>
    </button>
  );
}

function ClassButton({
  emoji, title, blurb, onClick,
}: { emoji: string; title: string; blurb: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl bg-white/10 p-5 text-left ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
    >
      <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-sun-300/90 text-3xl">
        {emoji}
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold">{title}</span>
        <span className="block text-xs text-ink-200">{blurb}</span>
      </span>
      <span className="text-xl text-sun-200 transition group-hover:translate-x-1">→</span>
    </button>
  );
}
