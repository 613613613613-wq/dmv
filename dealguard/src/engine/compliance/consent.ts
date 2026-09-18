/**
 * Jurisdictional guardrails for recording / live transcription of calls.
 * This is product guidance, not legal advice; the in-app copy says so and the
 * pre-flight cannot be skipped in an all-party-consent jurisdiction.
 */

export interface Jurisdiction {
  code: string;
  name: string;
  /** true = every participant must consent to interception/recording. */
  allParty: boolean;
  statute?: string;
}

export const US_JURISDICTIONS: Jurisdiction[] = [
  { code: "AL", name: "Alabama", allParty: false },
  { code: "AK", name: "Alaska", allParty: false },
  { code: "AZ", name: "Arizona", allParty: false },
  { code: "AR", name: "Arkansas", allParty: false },
  { code: "CA", name: "California", allParty: true, statute: "Cal. Penal Code § 632" },
  { code: "CO", name: "Colorado", allParty: false },
  { code: "CT", name: "Connecticut", allParty: true, statute: "Conn. Gen. Stat. § 52-570d" },
  { code: "DE", name: "Delaware", allParty: true, statute: "Del. Code tit. 11 § 2402" },
  { code: "DC", name: "District of Columbia", allParty: false },
  { code: "FL", name: "Florida", allParty: true, statute: "Fla. Stat. § 934.03" },
  { code: "GA", name: "Georgia", allParty: false },
  { code: "HI", name: "Hawaii", allParty: false },
  { code: "ID", name: "Idaho", allParty: false },
  { code: "IL", name: "Illinois", allParty: true, statute: "720 ILCS 5/14-2" },
  { code: "IN", name: "Indiana", allParty: false },
  { code: "IA", name: "Iowa", allParty: false },
  { code: "KS", name: "Kansas", allParty: false },
  { code: "KY", name: "Kentucky", allParty: false },
  { code: "LA", name: "Louisiana", allParty: false },
  { code: "ME", name: "Maine", allParty: false },
  { code: "MD", name: "Maryland", allParty: true, statute: "Md. Code, Cts. & Jud. Proc. § 10-402" },
  { code: "MA", name: "Massachusetts", allParty: true, statute: "Mass. Gen. Laws ch. 272 § 99" },
  { code: "MI", name: "Michigan", allParty: true, statute: "Mich. Comp. Laws § 750.539c" },
  { code: "MN", name: "Minnesota", allParty: false },
  { code: "MS", name: "Mississippi", allParty: false },
  { code: "MO", name: "Missouri", allParty: false },
  { code: "MT", name: "Montana", allParty: true, statute: "Mont. Code Ann. § 45-8-213" },
  { code: "NE", name: "Nebraska", allParty: false },
  { code: "NV", name: "Nevada", allParty: true, statute: "Nev. Rev. Stat. § 200.620" },
  { code: "NH", name: "New Hampshire", allParty: true, statute: "N.H. Rev. Stat. § 570-A:2" },
  { code: "NJ", name: "New Jersey", allParty: false },
  { code: "NM", name: "New Mexico", allParty: false },
  { code: "NY", name: "New York", allParty: false },
  { code: "NC", name: "North Carolina", allParty: false },
  { code: "ND", name: "North Dakota", allParty: false },
  { code: "OH", name: "Ohio", allParty: false },
  { code: "OK", name: "Oklahoma", allParty: false },
  { code: "OR", name: "Oregon", allParty: true, statute: "Or. Rev. Stat. § 165.540" },
  { code: "PA", name: "Pennsylvania", allParty: true, statute: "18 Pa. Cons. Stat. § 5704" },
  { code: "RI", name: "Rhode Island", allParty: false },
  { code: "SC", name: "South Carolina", allParty: false },
  { code: "SD", name: "South Dakota", allParty: false },
  { code: "TN", name: "Tennessee", allParty: false },
  { code: "TX", name: "Texas", allParty: false },
  { code: "UT", name: "Utah", allParty: false },
  { code: "VT", name: "Vermont", allParty: false },
  { code: "VA", name: "Virginia", allParty: false },
  { code: "WA", name: "Washington", allParty: true, statute: "Wash. Rev. Code § 9.73.030" },
  { code: "WV", name: "West Virginia", allParty: false },
  { code: "WI", name: "Wisconsin", allParty: false },
  { code: "WY", name: "Wyoming", allParty: false },
  { code: "INTL", name: "Outside the United States", allParty: true },
];

export interface ConsentRequirement {
  allParty: boolean;
  jurisdictions: Jurisdiction[];
}

/** Given every jurisdiction a participant may be in, the strictest rule applies. */
export function consentRequirement(codes: string[]): ConsentRequirement {
  const js = codes.map((c) => US_JURISDICTIONS.find((j) => j.code === c)).filter((j): j is Jurisdiction => !!j);
  if (!js.length) return { allParty: true, jurisdictions: [] }; // unknown → assume strict
  return { allParty: js.some((j) => j.allParty), jurisdictions: js.filter((j) => j.allParty) };
}

export function disclosureScript(brand: string): string {
  return `Before we start: I'm running ${brand}, an AI deal assistant, for live transcription and record-keeping on my side. Is everyone comfortable proceeding?`;
}

export function calendarDisclaimer(brand: string): string {
  return `Note: the host uses ${brand}, an AI deal assistant, for real-time transcription and record-keeping during this meeting. Audio is processed live and never stored. Please let the host know before the call if you have any concerns.`;
}

export const PREFLIGHT_REMINDER = "Ensure counterparties are informed that an AI deal assistant is running for transcription and record-keeping.";
