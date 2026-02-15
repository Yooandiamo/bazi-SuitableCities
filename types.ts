
export interface UserInput {
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD (Solar) OR YYYY-M-D (Lunar)
  birthTime: string; // HH:mm
  calendarType: 'solar' | 'lunar';
  isLeapMonth?: boolean;
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

export interface CityRecommendation {
  name: string;
  tags: string[]; // E.g. ["海滨", "慢节奏"]
  description: string;
  score: number;
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
  suitableCities?: CityRecommendation[];
  // Removed suitableCareers
}

export enum LoadingState {
  IDLE = 'IDLE',
  CALCULATING_LOCAL = 'CALCULATING_LOCAL',
  PREVIEW = 'PREVIEW', // Showing blurred results
  UNLOCKING = 'UNLOCKING', // Full screen loader (Direct Unlock)
  UPGRADING = 'UPGRADING', // Inline loader (Unlock from Preview)
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}
