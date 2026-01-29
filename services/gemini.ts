import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, DestinyAnalysis } from "../types";

const parseJSON = (text: string) => {
    try {
        // Find the first '{' and the last '}' to handle potential preamble/postamble from the model
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
             throw new Error("No JSON object found in response");
        }
        
        const jsonString = text.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        console.error("Raw text:", text);
        throw new Error("Failed to parse the oracle's response. Please try again.");
    }
};

export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // 1. Validate API Key Existence
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please add 'API_KEY' to your Vercel Environment Variables.");
  }

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

  // Explicitly typed as any or inferred to avoid import errors if Schema is not exported
  const schema = {
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
        temperature: 0.5, // Slightly higher creativity for descriptions
      },
    });

    if (response.text) {
      return parseJSON(response.text) as DestinyAnalysis;
    }
    throw new Error("Empty response from the oracle.");
  } catch (error: any) {
    console.error("Gemini Analysis Error Details:", error);
    
    // Provide more specific error messages for the UI
    let errorMessage = "An error occurred during analysis.";
    
    if (error.message) {
        if (error.message.includes("API Key is missing")) {
            errorMessage = "API Key Not Found. Please set the API_KEY environment variable in Vercel.";
        } else if (error.toString().includes("401") || error.toString().includes("403")) {
            errorMessage = "Invalid API Key. Access denied.";
        } else if (error.toString().includes("404")) {
            errorMessage = "Model Not Found. The 'gemini-3-flash-preview' model may not be available for your API key.";
        } else if (error.toString().includes("503")) {
            errorMessage = "The Service is currently unavailable. Please try again later.";
        } else {
            errorMessage = error.message;
        }
    }
    
    throw new Error(errorMessage);
  }
};