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

// 2. Main Analysis Function (Gemini Implementation)
export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // Validate API Key presence
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("未配置 API Key。请在环境配置中添加 API Key。");
  }

  // Step 1: Local Calculation (True Solar Time)
  const localBaZi = calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
  
  // Prepare Prompt Data
  const pillarsStr = localBaZi.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localBaZi.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  const systemPrompt = `你是一位精通传统八字命理的大师。请基于用户提供的八字排盘数据进行分析。`;

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

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            favorableElements: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            unfavorableElements: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            summary: { type: Type.STRING },
            suitableCities: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER }
                }
              } 
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
              } 
            }
          }
        }
      }
    });

    const jsonText = response.text;
    
    if (!jsonText) throw new Error("API 返回了空内容");

    let parsedAIResponse;
    try {
        parsedAIResponse = JSON.parse(jsonText);
    } catch (e) {
        console.error("JSON Parse Error:", e, jsonText);
        throw new Error("无法解析 AI 返回的数据格式");
    }
    
    return sanitizeData(parsedAIResponse, localBaZi);

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    throw new Error(error.message || "无法连接到命运分析服务，请检查网络或稍后再试。");
  }
};