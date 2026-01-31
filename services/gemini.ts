import { UserInput, DestinyAnalysis, CityRecommendation, LocalAnalysisData } from "../types";
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
  const safeArray = (val: any) => (Array.isArray(val) ? val : []);

  const suitableCities: CityRecommendation[] = Array.isArray(data.suitableCities)
    ? data.suitableCities.map((c: any) => ({
        name: safeString(c?.name),
        tags: safeArray(c?.tags).map(safeString).slice(0, 4), // Limit to 4 tags
        description: safeString(c?.description),
        score: safeNumber(c?.score)
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
请务必返回标准的 JSON 格式，不要包含 Markdown 代码块标记。
返回的 JSON 必须严格遵守以下结构：
{
  "favorableElements": ["喜用神1", "喜用神2"],
  "unfavorableElements": ["忌神1", "忌神2"],
  "summary": "50-80字的命理摘要，风格神秘且具有启发性。",
  "suitableCities": [
    { 
      "name": "城市名", 
      "score": 98, 
      "tags": ["城市特色关键词1", "城市特色关键词2", "城市特色关键词3"],
      "description": "详细描述（100字左右）：为什么这个城市的气场旺该用户？结合五行、方位、气候等因素进行温情且有说服力的解读。" 
    }
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
    1. 根据五行强弱，判断"喜用神"和"忌神"。
    2. 提供一段 50-80 字的命理摘要。
    3. 重点推荐 5 个最适合发展的城市（中国境内）。
       - 第 1 个城市必须是"本命城市"，请给出极高的匹配分（90以上），并提供非常详细的推荐理由，描述这个城市如何滋养用户，不用提及具体的“人格类型”（如不要说“你是自然型人格”），直接描述城市特质与用户的契合点。
       - 后 4 个城市作为备选，分数递减。
       - 每个城市提供 3-4 个短标签（例如：海滨风情、历史底蕴、节奏舒缓、创业热土、水木清华等）。
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