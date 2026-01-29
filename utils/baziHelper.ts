import { Solar } from 'lunar-javascript';
import { Pillar, ElementData } from '../types';

// Mappings for Five Elements
const ELEMENT_MAP: Record<string, string> = {
  '甲': 'Wood', '乙': 'Wood', '寅': 'Wood', '卯': 'Wood',
  '丙': 'Fire', '丁': 'Fire', '巳': 'Fire', '午': 'Fire',
  '戊': 'Earth', '己': 'Earth', '辰': 'Earth', '戌': 'Earth', '丑': 'Earth', '未': 'Earth',
  '庚': 'Metal', '辛': 'Metal', '申': 'Metal', '酉': 'Metal',
  '壬': 'Water', '癸': 'Water', '亥': 'Water', '子': 'Water'
};

const LABEL_MAP: Record<string, string> = {
  'Wood': '木',
  'Fire': '火',
  'Earth': '土',
  'Metal': '金',
  'Water': '水'
};

export interface LocalBaZiResult {
  pillars: Pillar[];
  fiveElements: ElementData[];
  dayMaster: string; // e.g. "甲"
  dayMasterElement: string; // e.g. "Wood"
}

// Calculate Equation of Time approx in minutes
// Input: Day of Year (1-365)
function getEquationOfTime(dayOfYear: number): number {
    const b = (2 * Math.PI / 364.0) * (dayOfYear - 81);
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    return eot;
}

// Get Day of Year from date
function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

export const calculateAccurateBaZi = (dateStr: string, timeStr: string, longitude?: number): LocalBaZiResult => {
  // Parse input: 2000-01-01, 12:00
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Default to 120E (Beijing Time) if no longitude provided
  // Time Difference = (Lng - 120) * 4 minutes
  const lng = longitude !== undefined ? longitude : 120;
  
  // 1. Calculate Mean Solar Time Offset
  // 1 degree longitude = 4 minutes time difference
  // East of 120 is positive, West is negative relative to Beijing Time
  const longitudeOffsetMinutes = (lng - 120) * 4;

  // 2. Calculate Equation of Time (EoT)
  const inputDate = new Date(year, month - 1, day, hour, minute);
  const dayOfYear = getDayOfYear(inputDate);
  const eotMinutes = getEquationOfTime(dayOfYear);

  // 3. True Solar Time
  // True Solar Time = Standard Time + Longitude Offset + EoT
  // We apply this by creating a new Date object shifted by these minutes
  const totalOffsetMinutes = longitudeOffsetMinutes + eotMinutes;
  
  // Create a new date object representing the "True Solar Time" instant
  // Note: lunar-javascript takes YMDHMS. We should adjust the input HMS.
  // We use JS Date to handle minute rollover (e.g. 12:00 + 65 mins -> 13:05)
  const adjustedTimeMs = inputDate.getTime() + (totalOffsetMinutes * 60 * 1000);
  const trueSolarDate = new Date(adjustedTimeMs);
  
  // Extract adjusted components
  const tYear = trueSolarDate.getFullYear();
  const tMonth = trueSolarDate.getMonth() + 1; // JS month is 0-indexed
  const tDay = trueSolarDate.getDate();
  const tHour = trueSolarDate.getHours();
  const tMinute = trueSolarDate.getMinutes();

  // Use Solar to initialize with TRUE SOLAR TIME
  const solar = Solar.fromYmdHms(tYear, tMonth, tDay, tHour, tMinute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  // Important: Set the sector/longitude if the library supported it for precision, 
  // but since we manually adjusted the time to True Solar Time, we can feed it as "local time".
  
  // 1. Get Pillars (Gan Zhi)
  const pillars: Pillar[] = [
    {
      name: '年柱',
      heavenlyStem: eightChar.getYearGan(),
      earthlyBranch: eightChar.getYearZhi(),
      elementStem: ELEMENT_MAP[eightChar.getYearGan()] || 'Unknown',
      elementBranch: ELEMENT_MAP[eightChar.getYearZhi()] || 'Unknown',
    },
    {
      name: '月柱',
      heavenlyStem: eightChar.getMonthGan(),
      earthlyBranch: eightChar.getMonthZhi(),
      elementStem: ELEMENT_MAP[eightChar.getMonthGan()] || 'Unknown',
      elementBranch: ELEMENT_MAP[eightChar.getMonthZhi()] || 'Unknown',
    },
    {
      name: '日柱',
      heavenlyStem: eightChar.getDayGan(),
      earthlyBranch: eightChar.getDayZhi(),
      elementStem: ELEMENT_MAP[eightChar.getDayGan()] || 'Unknown',
      elementBranch: ELEMENT_MAP[eightChar.getDayZhi()] || 'Unknown',
    },
    {
      name: '时柱',
      heavenlyStem: eightChar.getTimeGan(),
      earthlyBranch: eightChar.getTimeZhi(),
      elementStem: ELEMENT_MAP[eightChar.getTimeGan()] || 'Unknown',
      elementBranch: ELEMENT_MAP[eightChar.getTimeZhi()] || 'Unknown',
    }
  ];

  // 2. Calculate Five Elements Percentage
  const scores: Record<string, number> = { 'Wood': 0, 'Fire': 0, 'Earth': 0, 'Metal': 0, 'Water': 0 };
  
  pillars.forEach(p => {
    if (scores[p.elementStem] !== undefined) scores[p.elementStem] += 1;
    if (scores[p.elementBranch] !== undefined) scores[p.elementBranch] += 1;
  });

  const totalScore = 8;
  const fiveElements: ElementData[] = Object.keys(scores).map(key => ({
    element: key,
    label: LABEL_MAP[key],
    percentage: Math.round((scores[key] / totalScore) * 100)
  }));

  // 3. Identify Day Master
  const dayMaster = pillars[2].heavenlyStem; // Day Stem
  const dayMasterElement = pillars[2].elementStem;

  return {
    pillars,
    fiveElements,
    dayMaster,
    dayMasterElement
  };
};