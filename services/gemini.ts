import { UserInput, DestinyAnalysis, Pillar, ElementData, Recommendation } from "../types";

// Helper to safely parse JSON from potentially messy AI output
const parseJSON = (text: string) => {
    try {
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
        throw new Error("Failed to parse the oracle's response. The model may be overloaded.");
    }
};

// Robust data sanitization to prevent UI crashes (White Screen of Death)
const sanitizeData = (data: any): DestinyAnalysis => {
  // 1. Handle Null/Undefined/Non-object
  if (!data || typeof data !== 'object') {
    console.warn("Received invalid data structure:", data);
    return {
        pillars: [], fiveElements: [], dayMaster: "Unknown", favorableElements: [], unfavorableElements: [],
        summary: "Error: Could not read AI response format.", suitableCities: [], suitableCareers: []
    };
  }

  // 2. Safe mapping helpers
  const safeString = (val: any) => (val && typeof val === 'string') ? val : String(val || '');
  const safeNumber = (val: any) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

  // 3. Deep sanitization
  const pillars: Pillar[] = Array.isArray(data.pillars) 
    ? data.pillars.map((p: any) => ({
        name: safeString(p?.name),
        heavenlyStem: safeString(p?.heavenlyStem),
        earthlyBranch: safeString(p?.earthlyBranch),
        elementStem: safeString(p?.elementStem),
        elementBranch: safeString(p?.elementBranch)
      })) 
    : [];

  const fiveElements: ElementData[] = Array.isArray(data.fiveElements)
    ? data.fiveElements.map((e: any) => ({
        element: safeString(e?.element),
        percentage: safeNumber(e?.percentage),
        label: safeString(e?.label)
      }))
    : [];

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
    pillars,
    fiveElements,
    dayMaster: safeString(data.dayMaster) || "Unknown",
    favorableElements,
    unfavorableElements,
    summary: safeString(data.summary) || "暂无命理摘要。",
    suitableCities,
    suitableCareers,
  };
};

export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // 1. Configuration Validation
  // Trim whitespace which is a common source of "Invalid token" errors
  const apiKey = (process.env.API_KEY || '').trim();
  
  let baseUrl = process.env.API_BASE_URL;
  let model = process.env.AI_MODEL;

  if (!baseUrl || baseUrl === "undefined") {
     baseUrl = "https://api.siliconflow.cn/v1"; 
  }
  
  if (!model || model === "undefined") {
     model = "deepseek-ai/DeepSeek-V3";
  }

  // --- DEBUG INFO FOR USER ---
  console.log(`[Destiny Compass] Using API Provider: ${baseUrl}`);
  console.log(`[Destiny Compass] Using Model: ${model}`);
  // ---------------------------

  if (!apiKey) {
    throw new Error("API Key is missing. Please set 'API_KEY' in your environment variables.");
  }

  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';

  // 2. Prompt Construction
  const systemPrompt = `You are a grandmaster of Chinese Metaphysics, BaZi (Four Pillars of Destiny), and WuXing (Five Elements).
Your task is to analyze birth data and return a STRICT JSON object. Do not output markdown code blocks (like \`\`\`json). Just output the raw JSON.`;

  const userPrompt = `
    The user is born on:
    Date: ${input.birthDate}
    Time: ${input.birthTime}
    Gender: ${genderStr}
    
    Perform a detailed analysis in SIMPLIFIED CHINESE (简体中文):
    1. Calculate the Four Pillars (Year, Month, Day, Hour).
    2. Calculate the approximate percentage strength of the Five Elements (Wood, Fire, Earth, Metal, Water).
    3. Identify the Day Master (Self Element).
    4. Determine the Favorable Elements (Yong Shen).
    5. Recommend 5 suitable cities.
    6. Recommend 5 suitable career fields.

    REQUIRED JSON STRUCTURE:
    {
      "pillars": [
        { "name": "年柱", "heavenlyStem": "甲", "earthlyBranch": "子", "elementStem": "Wood", "elementBranch": "Water" },
        { "name": "月柱", "heavenlyStem": "...", "earthlyBranch": "...", "elementStem": "...", "elementBranch": "..." },
        { "name": "日柱", "heavenlyStem": "...", "earthlyBranch": "...", "elementStem": "...", "elementBranch": "..." },
        { "name": "时柱", "heavenlyStem": "...", "earthlyBranch": "...", "elementStem": "...", "elementBranch": "..." }
      ],
      "fiveElements": [
        { "element": "Wood", "percentage": 20, "label": "木" },
        { "element": "Fire", "percentage": 30, "label": "火" },
        { "element": "Earth", "percentage": 10, "label": "土" },
        { "element": "Metal", "percentage": 10, "label": "金" },
        { "element": "Water", "percentage": 30, "label": "水" }
      ],
      "dayMaster": "阳木 (甲)",
      "favorableElements": ["木", "火"],
      "unfavorableElements": ["金"],
      "summary": "Your mystical summary here in Chinese...",
      "suitableCities": [
        { "title": "City Name", "description": "Reason...", "matchScore": 95 }
      ],
      "suitableCareers": [
        { "title": "Career Name", "description": "Reason...", "matchScore": 90 }
      ]
    }

    IMPORTANT: 
    - 'element' fields in 'pillars' and 'fiveElements' MUST be English (Wood, Fire, Earth, Metal, Water) for the chart logic.
    - All other text MUST be Simplified Chinese.
  `;

  try {
    // 3. API Call
    // Normalize endpoint. 
    const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 1.3,
        response_format: { type: "json_object" },
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Response:", errorData);
      
      if (response.status === 401) {
        // Explicit hint for SiliconFlow users
        if (baseUrl.includes('siliconflow')) {
            throw new Error(`Invalid API Key. SiliconFlow rejected the token. Ensure your key starts with 'sk-' and has no spaces. (Provider: ${baseUrl})`);
        }
        throw new Error(`Invalid API Key. Access denied by ${baseUrl}.`);
      }

      if (response.status === 404) {
        throw new Error(`Model '${model}' not found. Check if this model name is correct for provider ${baseUrl}.`);
      }

      if (response.status === 429) throw new Error("Rate limit exceeded. The AI is busy, please try again later.");
      if (response.status >= 500) throw new Error("The AI service is currently unavailable.");
      
      throw new Error(errorData.error?.message || `API Error: ${response.statusText} (${baseUrl})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from the AI model.");
    }

    const parsed = parseJSON(content);
    // Sanitize to prevent UI crashes if AI returns incomplete JSON
    return sanitizeData(parsed);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};