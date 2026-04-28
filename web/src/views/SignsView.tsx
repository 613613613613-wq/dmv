import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserData } from "../engine/store";
import { t } from "../i18n";
import Sign from "../components/Sign";
import type { Lang, SignKind } from "../types";

interface Item {
  kind: SignKind;
  group: "regulatory" | "warning" | "construction" | "school" | "guide";
  speedValue?: number;
  label: { en: string; es: string };
  meaning: { en: string; es: string };
}

const SIGNS: Item[] = [
  { kind: "stop", group: "regulatory", label: { en: "Stop", es: "Pare" }, meaning: { en: "Come to a complete stop. Look both ways and yield before proceeding.", es: "Detente por completo. Mira a ambos lados y cede antes de avanzar." } },
  { kind: "yield", group: "regulatory", label: { en: "Yield", es: "Ceda" }, meaning: { en: "Slow down and give right of way. Stop only if necessary.", es: "Reduce y cede el paso. Detente sólo si es necesario." } },
  { kind: "do-not-enter", group: "regulatory", label: { en: "Do Not Enter", es: "No Entre" }, meaning: { en: "Wrong direction — turn around. Common at one-way streets and freeway off-ramps.", es: "Dirección incorrecta — gira. Común en vías de un sentido y rampas de salida." } },
  { kind: "wrong-way", group: "regulatory", label: { en: "Wrong Way", es: "Sentido Equivocado" }, meaning: { en: "You're driving against traffic. Turn around immediately and safely.", es: "Vas en sentido contrario. Da la vuelta de inmediato y con cuidado." } },
  { kind: "one-way-left", group: "regulatory", label: { en: "One Way (Left)", es: "Un Sentido (Izquierda)" }, meaning: { en: "Traffic on this street goes only in the direction of the arrow.", es: "El tráfico en esta calle va solo en la dirección de la flecha." } },
  { kind: "one-way-right", group: "regulatory", label: { en: "One Way (Right)", es: "Un Sentido (Derecha)" }, meaning: { en: "Traffic on this street goes only in the direction of the arrow.", es: "El tráfico en esta calle va solo en la dirección de la flecha." } },
  { kind: "no-uturn", group: "regulatory", label: { en: "No U-Turn", es: "Prohibido Vuelta en U" }, meaning: { en: "U-turns are prohibited at this intersection.", es: "No se permite la vuelta en U en esta intersección." } },
  { kind: "no-left-turn", group: "regulatory", label: { en: "No Left Turn", es: "No Girar a la Izquierda" }, meaning: { en: "Left turns are prohibited.", es: "Prohibido girar a la izquierda." } },
  { kind: "no-right-turn", group: "regulatory", label: { en: "No Right Turn", es: "No Girar a la Derecha" }, meaning: { en: "Right turns are prohibited.", es: "Prohibido girar a la derecha." } },
  { kind: "speed-limit", group: "regulatory", speedValue: 55, label: { en: "Speed Limit 55", es: "Límite 55" }, meaning: { en: "Maximum legal speed in good conditions, in mph.", es: "Velocidad máxima legal en buenas condiciones, en mph." } },
  { kind: "speed-limit", group: "regulatory", speedValue: 70, label: { en: "Speed Limit 70", es: "Límite 70" }, meaning: { en: "Default for Florida rural interstates.", es: "Predeterminado para autopistas interestatales rurales de Florida." } },
  { kind: "school-zone", group: "school", label: { en: "School Zone", es: "Zona Escolar" }, meaning: { en: "Reduce to 20 mph when children are present or during posted hours.", es: "Reduce a 20 mph cuando haya niños o en los horarios indicados." } },
  { kind: "pedestrian-crossing", group: "warning", label: { en: "Pedestrian Crossing", es: "Cruce de Peatones" }, meaning: { en: "Watch for pedestrians; yield in any crosswalk.", es: "Atento a peatones; cede en cualquier cruce." } },
  { kind: "railroad-crossing", group: "warning", label: { en: "Railroad Crossing (Advance)", es: "Cruce Ferroviario (Aviso)" }, meaning: { en: "Tracks ahead. Slow, look, listen.", es: "Vías adelante. Reduce, mira, escucha." } },
  { kind: "railroad-crossbuck", group: "regulatory", label: { en: "Railroad Crossbuck", es: "Cruce de FFCC" }, meaning: { en: "Yield the right of way to trains.", es: "Cede el paso al tren." } },
  { kind: "signal-ahead", group: "warning", label: { en: "Signal Ahead", es: "Semáforo Adelante" }, meaning: { en: "Traffic light ahead — be ready to stop.", es: "Semáforo adelante — listo para detenerte." } },
  { kind: "stop-ahead", group: "warning", label: { en: "Stop Ahead", es: "Pare Adelante" }, meaning: { en: "A stop sign is around the next bend or rise.", es: "Hay un PARE en la próxima curva o cima." } },
  { kind: "yield-ahead", group: "warning", label: { en: "Yield Ahead", es: "Ceda Adelante" }, meaning: { en: "A yield sign is just ahead.", es: "Hay un CEDA justo adelante." } },
  { kind: "merge", group: "warning", label: { en: "Merge", es: "Convergencia" }, meaning: { en: "Another lane joins yours. Adjust speed and watch for merging traffic.", es: "Otro carril se une al tuyo. Ajusta velocidad y mira el tráfico." } },
  { kind: "lane-ends", group: "warning", label: { en: "Lane Ends", es: "Fin de Carril" }, meaning: { en: "Your lane is ending — merge into the through lane.", es: "Tu carril termina — incorpórate al carril principal." } },
  { kind: "two-way", group: "warning", label: { en: "Two-Way Traffic", es: "Tráfico de Dos Sentidos" }, meaning: { en: "End of a divided road. Watch for oncoming traffic.", es: "Fin de vía dividida. Atento al tráfico contrario." } },
  { kind: "no-passing", group: "warning", label: { en: "No Passing Zone", es: "Zona Prohibido Rebasar" }, meaning: { en: "Do not pass any vehicles ahead.", es: "No rebases ningún vehículo." } },
  { kind: "curve", group: "warning", label: { en: "Curve", es: "Curva" }, meaning: { en: "Curve in the road; reduce speed.", es: "Curva en la vía; reduce velocidad." } },
  { kind: "winding-road", group: "warning", label: { en: "Winding Road", es: "Vía Sinuosa" }, meaning: { en: "Series of curves ahead.", es: "Serie de curvas adelante." } },
  { kind: "divided-highway", group: "warning", label: { en: "Divided Highway", es: "Autopista Dividida" }, meaning: { en: "Road divides into two one-way roadways.", es: "La vía se divide en dos calzadas de un sentido." } },
  { kind: "deer", group: "warning", label: { en: "Deer Crossing", es: "Cruce de Venados" }, meaning: { en: "Watch for animals, especially at dawn and dusk.", es: "Atento a animales, sobre todo al amanecer y atardecer." } },
  { kind: "slippery", group: "warning", label: { en: "Slippery When Wet", es: "Resbaloso Mojado" }, meaning: { en: "Pavement may be slick in rain. Slow down.", es: "El pavimento puede ser resbaloso bajo lluvia. Reduce." } },
  { kind: "construction", group: "construction", label: { en: "Workers Ahead", es: "Trabajadores Adelante" }, meaning: { en: "Active work zone. Slow, watch for workers, fines doubled.", es: "Zona de obras activa. Reduce, cuida a trabajadores, multas dobles." } },
  { kind: "flagger", group: "construction", label: { en: "Flagger Ahead", es: "Señalero Adelante" }, meaning: { en: "Obey instructions from the flagger.", es: "Obedece al señalero." } },
  { kind: "detour", group: "construction", label: { en: "Detour", es: "Desvío" }, meaning: { en: "Follow the detour route.", es: "Sigue la ruta del desvío." } },
  { kind: "hospital", group: "guide", label: { en: "Hospital", es: "Hospital" }, meaning: { en: "Hospital nearby — follow the sign for directions.", es: "Hospital cerca — sigue la señal." } },
  { kind: "hov", group: "regulatory", label: { en: "HOV 2+ Only", es: "HOV 2+ Solamente" }, meaning: { en: "High-Occupancy Vehicle lane: 2 or more occupants required.", es: "Carril de Alta Ocupación: 2 o más ocupantes requeridos." } },
  { kind: "interstate", group: "guide", label: { en: "Interstate Shield", es: "Escudo Interestatal" }, meaning: { en: "Marks an interstate highway (e.g., I-95).", es: "Indica autopista interestatal (ej. I-95)." } },
  { kind: "us-highway", group: "guide", label: { en: "US Highway", es: "Carretera US" }, meaning: { en: "U.S. numbered highway (e.g., US-1).", es: "Carretera numerada de EE.UU. (ej. US-1)." } },
  { kind: "fl-state", group: "guide", label: { en: "Florida State Road", es: "Carretera Estatal de Florida" }, meaning: { en: "Florida state-numbered road (e.g., A1A).", es: "Carretera estatal de Florida (ej. A1A)." } },
  { kind: "no-truck", group: "regulatory", label: { en: "No Trucks", es: "Prohibido Camiones" }, meaning: { en: "Trucks are prohibited on this road.", es: "Prohibido el paso de camiones." } },
];

export function getSigns(): Item[] { return SIGNS; }

export default function SignsView() {
  const { data } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const [picked, setPicked] = useState<Item | null>(null);

  const groups: Item["group"][] = ["regulatory", "warning", "school", "construction", "guide"];

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{t("signsTitle", lang)}</h1>
          <p className="text-sm text-ink-500">{t("signsBlurb", lang)}</p>
        </div>
        <Link to="/signs/rush" className="btn-primary">
          {t("playSignRush", lang)}
        </Link>
      </header>

      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500">{t("bestScore", lang)} · {t("signRush", lang)}</div>
          <div className="text-2xl font-bold text-ink-900">
            {data.bestSignRush > 0
              ? data.bestSignRush
              : <span className="text-ink-400">—</span>}
          </div>
        </div>
        <div className="text-3xl">⚡</div>
      </div>

      {groups.map((g) => (
        <section key={g} className="card p-5">
          <h2 className="text-base font-semibold text-ink-900">
            {g === "regulatory" ? t("regulatory", lang)
              : g === "warning" ? t("warning", lang)
              : g === "school" ? t("schoolZone", lang)
              : g === "construction" ? t("construction", lang)
              : t("guide", lang)}
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {SIGNS.filter((s) => s.group === g).map((s, idx) => (
              <button
                key={`${s.kind}-${idx}`}
                type="button"
                onClick={() => setPicked(s)}
                className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition hover:-translate-y-0.5 hover:bg-ink-50"
              >
                <Sign kind={s.kind} size={84} speedValue={s.speedValue} />
                <span className="text-[11px] font-medium text-ink-700">{s.label[lang]}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {picked && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink-900/60 p-4 backdrop-blur md:items-center"
          onClick={() => setPicked(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <Sign kind={picked.kind} size={140} speedValue={picked.speedValue} />
              <h3 className="mt-4 text-lg font-bold text-ink-900">{picked.label[lang]}</h3>
              <p className="mt-2 text-sm text-ink-700">{picked.meaning[lang]}</p>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="btn-secondary mt-5"
              >
                {t("done", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
