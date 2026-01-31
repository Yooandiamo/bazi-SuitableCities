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

  const systemInstruction = `你是一位精通"地理五行"和"八字喜忌"的命理大师。
核心逻辑：
1. 先计算用户的【喜用神】（Favorable Elements）。
2. 根据【喜用神】寻找对应的地理方位：
   - 喜【木】：宜往东方（如上海、杭州、青岛）。
   - 喜【火】：宜往南方（如深圳、广州、三亚、重庆-火炉）。
   - 喜【土】：宜往中原或内陆（如西安、郑州、成都）。
   - 喜【金】：宜往西方（但中国地理西方较偏，通常取金融中心或西部大城，如乌鲁木齐、或是由于"金生水"取沿海发达城市）。
   - 喜【水】：宜往北方或水边（如北京、哈尔滨、大连）。
3. **必须**基于上述逻辑推荐城市，不能随机推荐。推荐理由必须明确指出"因为你喜X，而该城市属Y..."。

返回格式必须为纯 JSON，不要带 markdown 标记：
{
  "favorableElements": ["喜神1", "喜神2"],
  "unfavorableElements": ["忌神1", "忌神2"],
  "summary": "50-80字的命理摘要。",
  "suitableCities": [
    { 
      "name": "城市名", 
      "score": 95, 
      "tags": ["标签1", "标签2"],
      "description": "详细理由..." 
    }
  ]
}`;

  const userPrompt = `
    用户信息:
    性别: ${genderStr}
    出生地: ${locationStr}
    出生时间: ${input.birthDate} ${input.birthTime} (真太阳时)

    *** 八字排盘数据 ***
    四柱: ${pillarsStr}
    日主: ${localData.dayMaster} (${localData.dayMasterElement})
    五行能量分布: ${elementsStr}
    
    任务:
    1. 判断喜用神。
    2. 推荐 5 个最适合发展的中国城市。
       - **第 1 名（本命城市）**：分数 90+。描述约 80-100 字。重点解释五行与方位的契合度（例如："你八字火弱，深圳位于南方离卦，火气最旺，能补足你的..."）。
       - **第 2-5 名（备选城市）**：分数 80-89。描述约 30-50 字。简要说明该城市为何适合（如："位于东方甲乙木地，利于你的..."）。
       - 不要提及"xx型人格"。
       - 标签使用 3-4 个短词（如：南方火旺、创业热土、安逸巴适）。
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