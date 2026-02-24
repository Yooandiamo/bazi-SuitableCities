import { UserInput, DestinyAnalysis, CityRecommendation, LocalAnalysisData } from "../types";
import { calculateAccurateBaZi } from "../utils/baziHelper";

// 1. Local Calculation Only (Free & Instant)
export const getLocalAnalysis = (input: UserInput): LocalAnalysisData => {
  return calculateAccurateBaZi(
      input.birthDate, 
      input.birthTime, 
      input.calendarType, // New Param
      input.isLeapMonth, // New Param
      input.longitude
  );
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

  // Prefer local deterministic calculation for consistency
  const favorableElements = (localData.favorableElements && localData.favorableElements.length > 0)
    ? localData.favorableElements
    : (Array.isArray(data.favorableElements) ? data.favorableElements.map((s: any) => safeString(s)) : []);
    
  const unfavorableElements = (localData.unfavorableElements && localData.unfavorableElements.length > 0)
    ? localData.unfavorableElements
    : (Array.isArray(data.unfavorableElements) ? data.unfavorableElements.map((s: any) => safeString(s)) : []);

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
  
  // Deterministic Data
  const patternStr = localData.pattern || "Unknown";
  const favorableStr = localData.favorableElements ? localData.favorableElements.join(', ') : "Unknown";
  const unfavorableStr = localData.unfavorableElements ? localData.unfavorableElements.join(', ') : "Unknown";

  // Determine date display for prompt
  const dateTypeStr = input.calendarType === 'lunar' ? `农历 (阴历) ${input.isLeapMonth ? '闰' : ''}` : '公历 (阳历)';

  const systemInstruction = `你是一位精通"地理五行"、"八字格局"与"调候用神"的命理大师。
你的任务是为用户推荐最适合生活的中国城市。

*** 核心指令：必须严格遵循提供的喜用神数据 ***
系统已通过精密算法计算出该命局的喜用神，你**必须直接使用**，严禁自行重新推算或更改。
你的工作是基于这些喜用神来解释为何推荐某些城市。

1. **已定格局与喜忌**：
   - 格局：${patternStr}
   - 喜用神（Favorable）：${favorableStr}
   - 忌神（Unfavorable）：${unfavorableStr}

2. **城市推荐逻辑**：
   - 依据上述喜用神选择城市。
   - 喜火 -> 南方; 喜水 -> 北方; 喜木 -> 东方; 喜金 -> 西方; 喜土 -> 中部/内陆。
   - 必须结合【调候】（如冬生喜火，夏生喜水）进行解释。

3. **返回格式**（纯 JSON）：
{
  "summary": "50-80字的命理摘要，基于已定的【${patternStr}】和喜用神【${favorableStr}】进行阐述。",
  "suitableCities": [
    { 
      "name": "城市名", 
      "score": 95, 
      "tags": ["气候标签", "人文标签", "五行标签"],
      "description": "详细理由...解释为何该城市符合喜用神【${favorableStr}】。" 
    }
  ]
}`;

  const userPrompt = `
    用户信息:
    性别: ${genderStr}
    出生地: ${locationStr}
    出生时间: ${input.birthDate} ${input.birthTime} (${dateTypeStr} - 已校正为真太阳时)

    *** 八字排盘数据 ***
    四柱: ${pillarsStr}
    日主: ${localData.dayMaster} (${localData.dayMasterElement})
    五行能量分布: ${elementsStr}
    
    *** 系统计算结果 (必须遵循) ***
    格局: ${patternStr}
    喜用神: ${favorableStr}
    忌神: ${unfavorableStr}
    
    任务:
    1. 基于上述系统确定的喜用神，推荐 5 个最适合发展的中国城市。
    2. 解释必须与系统给定的喜忌一致。
  `;

  try {
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
        accessCode: accessCode 
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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