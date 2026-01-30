import { UserInput, DestinyAnalysis, Recommendation } from "../types";
import { calculateAccurateBaZi } from "../utils/baziHelper";
import { GoogleGenAI, Type } from "@google/genai";

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

// 2. Main Analysis Function (Gemini Implementation)
export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // Validate API Key presence
  if (!process.env.API_KEY || process.env.API_KEY.trim() === '') {
    throw new Error("未配置 API Key。请在环境配置中添加 Google API Key。");
  }

  // Step 1: Local Calculation (True Solar Time)
  const localBaZi = calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
  
  // Prepare Prompt Data
  const pillarsStr = localBaZi.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localBaZi.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  const systemInstruction = "你是一位精通传统八字命理的大师。请基于用户提供的八字排盘数据进行分析。必须以严格的 JSON 格式输出，不要包含 Markdown 格式，不要包含任何额外的解释文本。";

  const userPrompt = `
    用户信息:
    性别: ${genderStr}
    出生地: ${locationStr}
    出生时间: ${input.birthDate} ${input.birthTime} (已校正真太阳时)

    *** 八字排盘数据 ***
    四柱: ${pillarsStr}
    日主: ${localBaZi.dayMaster} (${localBaZi.dayMasterElement})
    五行能量分布: ${elementsStr}
    
    任务:
    请进行详细的命运分析（使用简体中文）。
    1. 根据五行强弱，精准判断"喜用神" (Favorable Elements) 和 "忌神" (Unfavorable Elements)。
    2. 提供一段 50-80 字的命理摘要。
    3. 推荐 5 个最适合发展的城市。
    4. 推荐 5 个最适合的职业方向。
  `;

  // Define schema manually to ensure compatibility
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      favorableElements: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of favorable elements (喜用神)",
      },
      unfavorableElements: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of unfavorable elements (忌神)",
      },
      summary: {
        type: Type.STRING,
        description: "50-80字的命理摘要",
      },
      suitableCities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
          },
          required: ["title", "description", "matchScore"],
        },
      },
      suitableCareers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
          },
          required: ["title", "description", "matchScore"],
        },
      },
    },
    required: ["favorableElements", "unfavorableElements", "summary", "suitableCities", "suitableCareers"],
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1,
      }
    });

    const content = response.text;
    
    if (!content) {
      console.error("Empty content received from Gemini API", response);
      throw new Error("API 返回了空内容");
    }

    let parsedAIResponse;
    try {
        // Attempt to parse. response.text usually returns string, but sometimes might wrap in ```json ``` 
        // Although responseMimeType: "application/json" should prevent markdown wrapping, it's good to be safe.
        const cleanedContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        parsedAIResponse = JSON.parse(cleanedContent);
    } catch (e) {
        console.error("JSON Parse Error:", e, content);
        throw new Error("无法解析 AI 返回的数据格式");
    }
    
    return sanitizeData(parsedAIResponse, localBaZi);

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    // Provide a more user-friendly error message for common issues
    if (error.message?.includes('LOAD FAILED') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
       throw new Error("网络连接失败。请检查您的网络设置（如 VPN 或代理），或者 API Key 是否有效。");
    }
    throw new Error(error.message || "无法连接到命运分析服务，请检查网络或稍后再试。");
  }
};