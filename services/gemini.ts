import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserInput, DestinyAnalysis } from "../types";

const parseJSON = (text: string) => {
    try {
        // Remove code block markers if present
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        throw new Error("Invalid response format from oracle");
    }
};

export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';

  const prompt = `
    You are a grandmaster of Chinese Metaphysics, BaZi (Four Pillars of Destiny), and WuXing (Five Elements).
    
    The user is born on:
    Date: ${input.birthDate}
    Time: ${input.birthTime}
    Gender: ${genderStr}
    
    Perform a detailed analysis in SIMPLIFIED CHINESE (简体中文):
    1. Calculate the Four Pillars (Year, Month, Day, Hour).
    2. Calculate the approximate percentage strength of the Five Elements (Wood, Fire, Earth, Metal, Water) in their chart.
    3. Identify the Day Master (Self Element).
    4. Determine the Favorable Elements (Yong Shen) based on balance.
    5. Recommend 5 suitable cities to live in (mix of global and Chinese major cities) based on the favorable elements and directions.
    6. Recommend 5 suitable career fields based on the favorable elements.

    IMPORTANT: 
    - Keep 'element' fields in English (Wood, Fire, Earth, Metal, Water) for code logic compatibility.
    - All other text (descriptions, titles, summaries, pillar names) MUST be in Simplified Chinese.
    - Pillar names should be "年柱", "月柱", "日柱", "时柱".

    Provide the output strictly in the requested JSON format.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      pillars: {
        type: Type.ARRAY,
        description: "The Four Pillars of Destiny",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Use Chinese: 年柱, 月柱, 日柱, 时柱" },
            heavenlyStem: { type: Type.STRING, description: "Character like 甲, 乙..." },
            earthlyBranch: { type: Type.STRING, description: "Character like 子, 丑..." },
            elementStem: { type: Type.STRING, description: "English: Wood, Fire, Earth, Metal, Water" },
            elementBranch: { type: Type.STRING, description: "English: Wood, Fire, Earth, Metal, Water" }
          },
          required: ["name", "heavenlyStem", "earthlyBranch", "elementStem", "elementBranch"]
        }
      },
      fiveElements: {
        type: Type.ARRAY,
        description: "Percentage strength of 5 elements",
        items: {
          type: Type.OBJECT,
          properties: {
            element: { type: Type.STRING, description: "English: Wood, Fire, Earth, Metal, Water" },
            percentage: { type: Type.NUMBER },
            label: { type: Type.STRING, description: "Chinese character: 木, 火, 土, 金, 水" }
          },
          required: ["element", "percentage", "label"]
        }
      },
      dayMaster: { type: Type.STRING, description: "The Day Stem element and character in Chinese (e.g. 阳火 (丙))" },
      favorableElements: { type: Type.ARRAY, items: { type: Type.STRING, description: "Chinese names of elements" } },
      unfavorableElements: { type: Type.ARRAY, items: { type: Type.STRING, description: "Chinese names of elements" } },
      summary: { type: Type.STRING, description: "A brief, mystical summary of the person's innate nature in Chinese." },
      suitableCities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "City Name in Chinese" },
            description: { type: Type.STRING, description: "Why this city fits in Chinese" },
            matchScore: { type: Type.NUMBER, description: "Compatibility score 0-100" }
          },
          required: ["title", "description", "matchScore"]
        }
      },
      suitableCareers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Career Title in Chinese" },
            description: { type: Type.STRING, description: "Why this career fits in Chinese" },
            matchScore: { type: Type.NUMBER, description: "Compatibility score 0-100" }
          },
          required: ["title", "description", "matchScore"]
        }
      }
    },
    required: ["pillars", "fiveElements", "dayMaster", "favorableElements", "summary", "suitableCities", "suitableCareers"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0, // Set to 0 for deterministic results
      },
    });

    if (response.text) {
      return parseJSON(response.text) as DestinyAnalysis;
    }
    throw new Error("Empty response from the oracle.");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};