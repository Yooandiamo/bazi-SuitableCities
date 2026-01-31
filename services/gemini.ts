import { UserInput, DestinyAnalysis, Recommendation, LocalAnalysisData } from "../types";
import { calculateAccurateBaZi } from "../utils/baziHelper";

// 1. Local Calculation Only (Free & Instant)
export const getLocalAnalysis = (input: UserInput): LocalAnalysisData => {
  return calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
};

// 2. Data Sanitization Helper
const sanitizeData = (aiData: any, localData: LocalAnalysisData): DestinyAnalysis => {
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
    ...localData,
    isUnlocked: true,
    favorableElements,
    unfavorableElements,
    summary: safeString(data.summary) || "暂无命理摘要。",
    suitableCities,
    suitableCareers,
  };
};

// 3. AI Analysis (Secure Backend Call)
// Now accepts accessCode to send to backend for verification
export const analyzeDestinyAI = async (input: UserInput, localData: LocalAnalysisData, accessCode: string): Promise<DestinyAnalysis> => {
  
  // Prepare Prompt Data
  const pillarsStr = localData.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localData.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  const systemInstruction = `你是一位精通传统八字命理的大师。请基于用户提供的八字排盘数据进行分析。
请务必返回标准的 JSON 格式，不要包含 Markdown 代码块标记（如 \`\`\`json）。
返回的 JSON 必须严格遵守以下结构：
{
  "favorableElements": ["喜用神1", "喜用神2"],
  "unfavorableElements": ["忌神1", "忌神2"],
  "summary": "50-80字的命理摘要，风格神秘且具有启发性。",
  "suitableCities": [
    { "title": "城市名", "description": "结合五行分析的推荐理由", "matchScore": 85 }
  ],
  "suitableCareers": [
    { "title": "职业名", "description": "结合五行分析的推荐理由", "matchScore": 90 }
  ]
}`;

  const userPrompt = `
    用户信息:
    性别: ${genderStr}
    出生地: ${locationStr}
    出生时间: ${input.birthDate} ${input.birthTime} (已校正真太阳时)

    *** 八字排盘数据 ***
    四柱: ${pillarsStr}
    日主: ${localData.dayMaster} (${localData.dayMasterElement})
    五行能量分布: ${elementsStr}
    
    任务:
    请进行详细的命运分析（使用简体中文）。
    1. 根据五行强弱，精准判断"喜用神" (Favorable Elements) 和 "忌神" (Unfavorable Elements)。
    2. 提供一段 50-80 字的命理摘要。
    3. 推荐 5 个最适合发展的城市。
    4. 推荐 5 个最适合的职业方向。
  `;

  try {
    // CHANGE: Request our own backend instead of DeepSeek directly
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        accessCode: accessCode // Send code to backend for verification
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle specific backend errors
        if (response.status === 403) {
            throw new Error("卡密无效，请检查后重新输入。");
        }
        throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("API 返回了空内容");

    let parsedAIResponse;
    try {
        const cleanedContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        parsedAIResponse = JSON.parse(cleanedContent);
    } catch (e) {
        console.error("JSON Parse Error:", e, content);
        throw new Error("无法解析 AI 返回的数据格式");
    }
    
    return sanitizeData(parsedAIResponse, localData);

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    throw new Error(error.message || "命理分析服务暂时不可用。");
  }
};