export type Localized = Record<string, string>;

export type VehicleClass = "car" | "motorcycle" | "cdl";

export type Lang = "en" | "es";

export interface Choice {
  id: string;
  text: Localized;
}

export interface HandbookReference {
  section: string;
  page: number | null;
  url: string | null;
}

export interface Question {
  id: string;
  category: string;
  difficulty: number;
  stem: Localized;
  choices: Choice[];
  correct: string;
  explanation: Localized;
  handbookRef: HandbookReference | null;
  tags: string[];
  signKind?: SignKind;
  signValue?: number;
}

export interface Agency {
  name: string;
  fullName: string;
  url: string;
}

export interface ExamFormat {
  officialName: { en: string; es: string };
  questionCount: number;
  passingScore: number;
  passingPercent: number;
  timeLimitMinutes: number | null;
  sectionFormat: string;
  retakeRule: string;
  feeRetake: number | null;
}

export interface LanguageSupport {
  ui: string[];
  test: string[];
  note?: string;
}

export interface Category {
  id: string;
  name: { en: string; es: string };
  weight: number;
}

export interface HandbookSource {
  url: string;
  version: string;
  lastReviewed: string;
}

export interface ContentPack {
  code: string;
  name: string;
  vehicleClass: VehicleClass;
  agency: Agency;
  exam: ExamFormat;
  languages: LanguageSupport;
  categories: Category[];
  handbook: HandbookSource;
  specialNotes: { en: string; es: string }[];
  questions: Question[];
}

export interface Attempt {
  questionId: string;
  correct: boolean;
  timeSpentSeconds: number;
  timestamp: number;
}

export interface SRSCard {
  questionId: string;
  repetition: number;
  easeFactor: number;
  intervalDays: number;
  dueDate: number;
}

export interface MockTestResult {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  durationSeconds: number;
  timestamp: number;
}

export interface Profile {
  vehicleClass: VehicleClass | null;
  language: Lang;
}

export interface UserData {
  attempts: Attempt[];
  srsCards: Record<string, SRSCard>;
  bookmarks: string[];
  mockResults: MockTestResult[];
  language: string;
  profile: Profile;
  xp: number;
  lessonsCompleted: string[];
  bestSignRush: number;
  paywallUnlocked: boolean;
}

export const DEFAULT_USER_DATA: UserData = {
  attempts: [],
  srsCards: {},
  bookmarks: [],
  mockResults: [],
  language: "en",
  profile: { vehicleClass: null, language: "en" },
  xp: 0,
  lessonsCompleted: [],
  bestSignRush: 0,
  paywallUnlocked: true,
};

export interface CategoryStats {
  categoryId: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export type SignKind =
  | "stop"
  | "yield"
  | "do-not-enter"
  | "wrong-way"
  | "one-way-left"
  | "one-way-right"
  | "no-uturn"
  | "no-left-turn"
  | "no-right-turn"
  | "speed-limit"
  | "school-zone"
  | "school-crossing"
  | "pedestrian-crossing"
  | "railroad-crossing"
  | "railroad-crossbuck"
  | "signal-ahead"
  | "stop-ahead"
  | "yield-ahead"
  | "merge"
  | "lane-ends"
  | "two-way"
  | "no-passing"
  | "slippery"
  | "deer"
  | "curve"
  | "winding-road"
  | "divided-highway"
  | "construction"
  | "flagger"
  | "detour"
  | "hospital"
  | "hov"
  | "interstate"
  | "us-highway"
  | "fl-state"
  | "no-truck"
  | "weight-limit"
  | "low-clearance";

export interface SignDef {
  kind: SignKind;
  label: Localized;
  meaning: Localized;
  /** "regulatory" (white/red, square/octagon), "warning" (yellow diamond), "guide" (green/blue), "construction" (orange), "school" (yellow-green pentagon). */
  category:
    | "regulatory"
    | "warning"
    | "guide"
    | "construction"
    | "school"
    | "route";
  speedValue?: number;
}

export interface LessonStep {
  /** "intro": title slide; "concept": text + optional sign; "checkpoint": question; "outro": completion */
  kind: "intro" | "concept" | "checkpoint" | "outro";
  title?: Localized;
  body?: Localized;
  bullets?: Localized[];
  sign?: SignKind;
  signValue?: number;
  question?: Question;
  imageEmoji?: string;
  /** Scene animation kind, optionally with a colon-separated parameter, e.g. "speedometer:70", "walkaround:3", "gear:helmet". */
  scene?: string;
}

export interface Lesson {
  id: string;
  vehicleClass: VehicleClass;
  emoji: string;
  title: Localized;
  blurb: Localized;
  xpReward: number;
  steps: LessonStep[];
}

export interface LessonPack {
  vehicleClass: VehicleClass;
  lessons: Lesson[];
}
