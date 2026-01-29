import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, DestinyAnalysis, Recommendation } from "../types";
import { calculateAccurateBaZi } from "../utils/baziHelper";

// 1. Data Sanitization Helper
const sanitizeData = (aiData: any, localData: any): DestinyAnalysis => {
  const data = aiData && typeof aiData === 'object' ? aiData : {};
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

  const favorableElements = Array.isArray(data.favorableElements) 
    ? data.favorableElements.map((s: any) => safeString(s)) 
    : [];
    
  const unfavorableElements = Array.isArray(data.unfavorableElements) 
    ? data.unfavorableElements.map((s: any) => safeString(s)) 
    : [];

  return {
    pillars: localData.pillars,
    fiveElements: localData.fiveElements,
    dayMaster: localData.dayMaster,
    favorableElements,
    unfavorableElements,
    summary: safeString(data.summary) || "暂无命理摘要。",
    suitableCities,
    suitableCareers,
  };
};

// 2. Main Analysis Function
export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // Validate API Key presence
  if (!process.env.API_KEY) {
    throw new Error("API Configuration Error: API_KEY is missing. Please check the environment settings.");
  }

  // Initialize SDK with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Step 1: Local Calculation (True Solar Time)
  const localBaZi = calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
  
  // Prepare Prompt Data
  const pillarsStr = localBaZi.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localBaZi.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  const prompt = `
    User Profile:
    Gender: ${genderStr}
    Birth Place: ${locationStr}
    Birth Time: ${input.birthDate} ${input.birthTime} (True Solar Time calculated)

    *** BAZI CHART DATA ***
    Pillars: ${pillarsStr}
    Day Master: ${localBaZi.dayMaster} (${localBaZi.dayMasterElement})
    Five Elements Strength: ${elementsStr}
    
    Task:
    Perform a detailed destiny analysis in Simplified Chinese (简体中文).
    Based on the strength of the Five Elements provided, identify the Favorable Elements (Yong Shen) and Unfavorable Elements.
    Provide a destiny summary, suitable cities, and suitable careers.
  `;

  // Step 2: Define Output Schema
  const schema = {
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
        description: "A summary of the destiny analysis (approx 50-80 words)."
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
    // Step 3: Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        systemInstruction: "You are a master of Traditional Chinese Metaphysics (BaZi). You provide accurate, encouraging, and culturally deep interpretations."
      }
    });

    const text = response.text;
    if (!text) throw new Error("API returned empty response");

    // Clean Markdown wrapper if present (e.g. ```json ... ```)
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsedAIResponse = JSON.parse(cleanedText);
    
    return sanitizeData(parsedAIResponse, localBaZi);

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    // Handle the specific 400 API key invalid error gracefully if it bubbles up
    if (error.toString().includes("API KEY NOT VALID")) {
        throw new Error("System API Key is invalid or expired. Please contact support.");
    }
    throw new Error(error.message || "无法连接到命运分析服务，请稍后再试。");
  }
};