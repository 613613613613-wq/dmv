import { useNavigate } from "react-router-dom";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { Tier } from "../engine/types";

export function Screen({ title, back, right, children, padded = true, testId }: { title?: string; back?: string | true; right?: ReactNode; children: ReactNode; padded?: boolean; testId?: string }) {
  const nav = useNavigate();
  return (
    <div className="min-h-full flex flex-col bg-ink-950 text-ink-100" data-testid={testId}>
      {(title || back) && (
        <header className="safe-top sticky top-0 z-20 bg-ink-950/95 backdrop-blur border-b border-ink-800">
          <div className="h-14 px-3 flex items-center gap-2">
            {back && (
              <button aria-label="Back" onClick={() => (back === true ? nav(-1) : nav(back))} className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-ink-300 active:bg-ink-800">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
            )}
            <h1 className="flex-1 text-[17px] font-semibold truncate">{title}</h1>
            {right}
          </div>
        </header>
      )}
      <main className={`flex-1 ${padded ? "px-4 pb-8" : ""} safe-bottom`}>{children}</main>
    </div>
  );
}

type Variant = "primary" | "ghost" | "danger" | "flag" | "subtle";

export function Button({ variant = "primary", full, className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; full?: boolean }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold text-[15px] px-4 h-12 transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const v: Record<Variant, string> = {
    primary: "bg-ink-100 text-ink-950",
    ghost: "bg-transparent border border-ink-700 text-ink-100",
    subtle: "bg-ink-800 text-ink-100",
    danger: "bg-flag/15 text-flag border border-flag/40",
    flag: "bg-flag text-white",
  };
  return (
    <button className={`${base} ${v[variant]} ${full ? "w-full" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[12px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-ink-400 mt-1.5 leading-snug">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full h-12 rounded-xl bg-ink-800 border border-ink-700 px-3.5 text-[16px] text-ink-100 placeholder:text-ink-400 focus:outline-none focus:border-ink-300";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} appearance-none ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} h-auto min-h-[88px] py-3 leading-snug ${props.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center gap-3 py-3 text-left">
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="block text-[12px] text-ink-400 mt-0.5 leading-snug">{hint}</span>}
      </span>
      <span className={`w-12 h-7 rounded-full p-0.5 transition ${checked ? "bg-calm" : "bg-ink-700"}`}>
        <span className={`block w-6 h-6 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

export function Card({ children, className = "", onClick, testId }: { children: ReactNode; className?: string; onClick?: () => void; testId?: string }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} data-testid={testId} className={`block w-full text-left rounded-2xl bg-ink-900 border border-ink-800 p-4 ${onClick ? "active:bg-ink-800" : ""} ${className}`}>
      {children}
    </Tag>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "flag" | "fact" | "calm" | "link" }) {
  const t = {
    neutral: "bg-ink-800 text-ink-300",
    flag: "bg-flag/15 text-flag",
    fact: "bg-fact/15 text-fact",
    calm: "bg-calm/15 text-calm",
    link: "bg-link/15 text-link",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 h-6 text-[11px] font-semibold tracking-wide uppercase ${t}`}>{children}</span>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mt-7 mb-2.5">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400">{children}</h2>
      {right}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-700 p-6 text-center">
      <div className="text-[15px] font-semibold">{title}</div>
      {body && <p className="text-[13px] text-ink-400 mt-1.5 leading-snug">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function tierTone(tier: Tier): "flag" | "fact" | "calm" {
  return tier === 1 ? "flag" : tier === 2 ? "fact" : "calm";
}

export function tierLabel(tier: Tier): string {
  return tier === 1 ? "Red flag" : tier === 2 ? "Fact card" : "Talking point";
}

export function StatusTermStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "flag" | "fact" | "calm" | "neutral" | "link" }> = {
    hard_cap: { label: "Hard cap", tone: "flag" },
    agreed: { label: "Agreed", tone: "calm" },
    negotiable: { label: "Negotiable", tone: "fact" },
    internal_confidential: { label: "Confidential", tone: "link" },
  };
  const m = map[status] ?? { label: status, tone: "neutral" as const };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}
