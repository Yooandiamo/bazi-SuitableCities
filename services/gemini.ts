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
  
  // Determine date display for prompt
  const dateTypeStr = input.calendarType === 'lunar' ? `农历 (阴历) ${input.isLeapMonth ? '闰' : ''}` : '公历 (阳历)';

  const systemInstruction = `你是一位精通"地理五行"、"八字格局"与"调候用神"的命理大师。
你的任务是为用户推荐最适合生活的中国城市。

*** 重要逻辑说明 ***
1. **严禁仅看五行缺什么就补什么**。必须分析【日主强弱】与【八字格局】。
   - 若八字为从格（从强/从弱），则需顺势而为，不能简单求平衡。
   - 若八字为正格，则依据身强身弱取【扶抑用神】。
2. **高度重视【调候用神】**：
   - 城市选择很大程度上受气候影响。
   - 生于冬季（水旺、金寒）者，通常急需【火】来暖局，宜往南方或阳光充足之地，不宜再往寒冷北方。
   - 生于夏季（火旺、土燥）者，通常急需【水】来润局，宜往北方或沿海湿润之地。
3. **结合地理方位**：
   - 东方/东南（木）：上海、杭州、江浙。
   - 南方（火）：深圳、广州、海南、重庆（火炉）。
   - 西方/西北（金）：成都（金水相涵）、西安、西部城市。
   - 北方（水）：北京、大连、沿海港口。
   - 中原（土）：郑州、中部地区。

返回格式必须为纯 JSON，不要带 markdown 标记：
{
  "favorableElements": ["喜神1", "喜神2"],
  "unfavorableElements": ["忌神1", "忌神2"],
  "summary": "50-80字的命理摘要，指出格局特点（如：身弱喜印比，或冬生喜火调候）。",
  "suitableCities": [
    { 
      "name": "城市名", 
      "score": 95, 
      "tags": ["气候标签", "人文标签", "五行标签"],
      "description": "详细理由...必须结合八字格局和调候来解释（如：'你生于亥月，金寒水冷，急需南方火气暖局，深圳位于离卦...'）。" 
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
    
    任务:
    1. 综合判断格局（身强/身弱/从格）与调候需求，确定喜用神。
    2. 推荐 5 个最适合发展的中国城市。
       - **第 1 名（本命城市）**：分数 90+。描述约 80-100 字。
       - **第 2-5 名（备选城市）**：分数 80-89。
       - 标签使用 3-4 个短词（如：南方火旺、调候得宜、印星得地）。
       - 理由要专业，不要只说“因为你缺木”，要说“因八字燥热需水润泽”或“身弱需印生扶”等。
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