
export interface UserInput {
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  province?: string;
  city?: string;
  longitude?: number; // E.g. 116.40 for Beijing. Used for True Solar Time.
}

export interface ElementData {
  element: string; // Wood, Fire, Earth, Metal, Water (English for logic)
  percentage: number;
  label: string; // Chinese character
}

export interface Pillar {
  name: string; // 年柱, 月柱, etc.
  heavenlyStem: string;
  earthlyBranch: string;
  elementStem: string;
  elementBranch: string;
}

export interface Recommendation {
  title: string;
  description: string;
  matchScore: number;
}

// Data calculated locally (Free)
export interface LocalAnalysisData {
  pillars: Pillar[];
  fiveElements: ElementData[];
  dayMaster: string;
  dayMasterElement: string;
}

// Full Data including AI (Paid/Locked)
export interface DestinyAnalysis extends LocalAnalysisData {
  isUnlocked: boolean; // New flag
  favorableElements?: string[];
  unfavorableElements?: string[];
  summary?: string;
  suitableCities?: Recommendation[];
  suitableCareers?: Recommendation[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  CALCULATING_LOCAL = 'CALCULATING_LOCAL',
  PREVIEW = 'PREVIEW', // Showing blurred results
  UNLOCKING = 'UNLOCKING', // Calling AI
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}
