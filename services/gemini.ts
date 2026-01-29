import { UserInput, DestinyAnalysis } from "../types";

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

export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // 1. Configuration Validation
  const apiKey = process.env.API_KEY;
  // Default to DeepSeek if not provided, as it's excellent for Chinese metaphysics
  const baseUrl = process.env.API_BASE_URL || "https://api.deepseek.com"; 
  const model = process.env.AI_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("API Key is missing. Please set 'API_KEY' in your environment variables.");
  }

  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';

  // 2. Prompt Construction
  // We include the schema definition directly in the prompt for high compatibility across different LLMs
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
    // 3. API Call using standard fetch (compatible with DeepSeek, OpenAI, Moonshot, etc.)
    // We append /chat/completions to the base URL if it's missing, assuming standard OpenAI format
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
        temperature: 1.3, // Higher temp for DeepSeek usually yields better creative/reasoning results, adjust as needed
        response_format: { type: "json_object" }, // Enforce JSON mode if supported
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Response:", errorData);
      
      if (response.status === 401) throw new Error("Invalid API Key.");
      if (response.status === 402) throw new Error("Insufficient Balance (No Credits).");
      if (response.status === 404) throw new Error(`Model '${model}' not found or endpoint incorrect.`);
      if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
      if (response.status >= 500) throw new Error("The AI service is currently unavailable.");
      
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from the AI model.");
    }

    return parseJSON(content) as DestinyAnalysis;

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw error; // Re-throw to be handled by the UI
  }
};