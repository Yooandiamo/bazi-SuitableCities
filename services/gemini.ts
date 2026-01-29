import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserInput, DestinyAnalysis, Recommendation } from "../types";
import { calculateAccurateBaZi } from "../utils/baziHelper";

// Robust data sanitization to prevent UI crashes (White Screen of Death)
const sanitizeData = (aiData: any, localData: any): DestinyAnalysis => {
  // 1. Handle Null/Undefined/Non-object
  const data = aiData && typeof aiData === 'object' ? aiData : {};

  // 2. Safe mapping helpers
  const safeString = (val: any) => (val && typeof val === 'string') ? val : String(val || '');
  const safeNumber = (val: any) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

  const suitableCities: Recommendation[] = Array.isArray(data.suitableCities)
    ? data.suitableCities.map((c: any) => ({
        title: safeString(c?.title),
        description: safeString(c?.description),
        matchScore: safeNumber(c?.matchScore)
      }))
    : [];
    
  const suitableCareers: Recommendation[] = Array.isArray(data.suitableCareers)
    ? data.suitableCareers.map((c: any) => ({
        title: safeString(c?.title),
        description: safeString(c?.description),
        matchScore: safeNumber(c?.matchScore)
      }))
    : [];

  // Ensure arrays of strings are actually strings
  const favorableElements = Array.isArray(data.favorableElements) 
    ? data.favorableElements.map((s: any) => safeString(s)) 
    : [];
    
  const unfavorableElements = Array.isArray(data.unfavorableElements) 
    ? data.unfavorableElements.map((s: any) => safeString(s)) 
    : [];

  return {
    pillars: localData.pillars, // Use Local Calculation
    fiveElements: localData.fiveElements, // Use Local Calculation
    dayMaster: localData.dayMaster, // Use Local Calculation
    favorableElements, // AI Interpretation
    unfavorableElements, // AI Interpretation
    summary: safeString(data.summary) || "暂无命理摘要。",
    suitableCities,
    suitableCareers,
  };
};

export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // Always use process.env.API_KEY directly when initializing.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // --- STEP 1: Perform Accurate Local Calculation with True Solar Time ---
  // We pass the longitude to adjust for True Solar Time.
  const localBaZi = calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
  
  // Format the pillars for the prompt
  const pillarsStr = localBaZi.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localBaZi.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  // 2. Prompt Construction
  const prompt = `
    User Profile:
    Gender: ${genderStr}
    Birth Place: ${locationStr} (True Solar Time applied)
    Birth Time: ${input.birthDate} ${input.birthTime}

    *** ACCURATE BAZI CHART (DO NOT RECALCULATE) ***
    Pillars: ${pillarsStr}
    Day Master: ${localBaZi.dayMaster} (${localBaZi.dayMasterElement})
    Five Elements Strength: ${elementsStr}
    
    Perform a detailed interpretation in SIMPLIFIED CHINESE (简体中文) based on the chart above:
    1. Determine the Favorable Elements (Yong Shen) and Unfavorable Elements based on the provided chart strength.
    2. Write a short summary of the destiny.
    3. Recommend 5 suitable cities based on the favorable elements.
    4. Recommend 5 suitable career fields based on the favorable elements.
  `;

  // 3. Schema Definition
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      favorableElements: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of favorable elements (Yong Shen)."
      },
      unfavorableElements: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of unfavorable elements."
      },
      summary: {
        type: Type.STRING,
        description: "A summary of the destiny analysis."
      },
      suitableCities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            matchScore: { type: Type.NUMBER }
          }
        },
        description: "List of 5 suitable cities."
      },
      suitableCareers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            matchScore: { type: Type.NUMBER }
          }
        },
        description: "List of 5 suitable career fields."
      }
    },
    required: ["favorableElements", "unfavorableElements", "summary", "suitableCities", "suitableCareers"]
  };

  try {
    // 4. API Call using gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        systemInstruction: "You are a grandmaster of Chinese Metaphysics and BaZi (Four Pillars of Destiny). Interpret the provided BaZi chart accurately."
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from the AI model.");
    }

    const parsedAIResponse = JSON.parse(text);
    
    // Merge the Accurate Local Data with the AI Interpretation
    return sanitizeData(parsedAIResponse, localBaZi);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};
