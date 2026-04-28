export type Localized = Record<string, string>;

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
}

export interface Agency {
  name: string;
  fullName: string;
  url: string;
}

export interface ExamFormat {
  officialName: string;
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
  name: string;
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
  agency: Agency;
  exam: ExamFormat;
  languages: LanguageSupport;
  categories: Category[];
  handbook: HandbookSource;
  specialNotes: string[];
  questions: Question[];
}

export interface Attempt {
  questionId: string;
  correct: boolean;
  timeSpentSeconds: number;
  timestamp: number; // unix ms
}

export interface SRSCard {
  questionId: string;
  repetition: number;
  easeFactor: number;
  intervalDays: number;
  dueDate: number; // unix ms
}

export interface MockTestResult {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  durationSeconds: number;
  timestamp: number;
}

export interface UserData {
  attempts: Attempt[];
  srsCards: Record<string, SRSCard>;
  bookmarks: string[];
  mockResults: MockTestResult[];
  language: string;
  paywallUnlocked: boolean;
}

export const DEFAULT_USER_DATA: UserData = {
  attempts: [],
  srsCards: {},
  bookmarks: [],
  mockResults: [],
  language: "en",
  paywallUnlocked: true,
};

export interface CategoryStats {
  categoryId: string;
  attempts: number;
  correct: number;
  accuracy: number;
}
