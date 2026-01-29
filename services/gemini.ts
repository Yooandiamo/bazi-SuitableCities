import { UserInput, DestinyAnalysis, Pillar, ElementData, Recommendation } from "../types";
import { calculateAccurateBaZi } from "../utils/baziHelper";

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
const sanitizeData = (aiData: any, localData: any): DestinyAnalysis => {
  // 1. Handle Null/Undefined/Non-object
  const data = aiData && typeof aiData === 'object' ? aiData : {};

  // 2. Safe mapping helpers
  const safeString = (val: any) => (val && typeof val === 'string') ? val : String(val || '');
  const safeNumber = (val: any) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

  // 3. Deep sanitization
  // IMPORTANT: We use the LOCAL pillars and elements because they are mathematically accurate.
  // We ignore the pillars returned by the AI to prevent hallucinations.
  
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
  // 1. Configuration Validation
  const apiKey = (process.env.API_KEY || '').trim();
  
  let baseUrl = process.env.API_BASE_URL;
  let model = process.env.AI_MODEL;

  if (!baseUrl || baseUrl === "undefined") {
     baseUrl = "https://api.deepseek.com"; 
  }
  
  if (!model || model === "undefined") {
     model = "deepseek-chat";
  }

  if (!apiKey) {
    throw new Error("API Key is missing. Please set 'API_KEY' in your environment variables.");
  }

  // --- STEP 1: Perform Accurate Local Calculation with True Solar Time ---
  // We pass the longitude to adjust for True Solar Time.
  const localBaZi = calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
  
  // Format the pillars for the prompt
  const pillarsStr = localBaZi.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localBaZi.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  // 2. Prompt Construction
  const systemPrompt = `You are a grandmaster of Chinese Metaphysics and BaZi (Four Pillars of Destiny).
Your task is to INTERPRET the provided BaZi chart and return a STRICT JSON object. 
Do NOT recalculate the pillars. Use the pillars provided in the prompt as the absolute truth (they have been calculated using True Solar Time).
Do NOT output markdown code blocks. Just output the raw JSON.`;

  const userPrompt = `
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

    REQUIRED JSON STRUCTURE:
    {
      "favorableElements": ["木", "火"],
      "unfavorableElements": ["金"],
      "summary": "Your mystical summary here in Chinese...",
      "suitableCities": [
        { "title": "City Name", "description": "Why this city fits the favorable element...", "matchScore": 95 }
      ],
      "suitableCareers": [
        { "title": "Career Name", "description": "Why this career fits...", "matchScore": 90 }
      ]
    }
  `;

  try {
    // 3. API Call
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
      
      if (response.status === 401) throw new Error(`Invalid API Key.`);
      if (response.status === 429) throw new Error("Rate limit exceeded. The AI is busy.");
      if (response.status >= 500) throw new Error("The AI service is currently unavailable.");
      
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from the AI model.");
    }

    const parsedAIResponse = parseJSON(content);
    
    // Merge the Accurate Local Data with the AI Interpretation
    return sanitizeData(parsedAIResponse, localBaZi);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};