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
  const elementToZh: Record<string, string> = { 'Wood': '木', 'Fire': '火', 'Earth': '土', 'Metal': '金', 'Water': '水' };
  const pillarsStr = localData.pillars.map(p => {
    const stemZh = elementToZh[p.elementStem] || p.elementStem;
    const branchZh = elementToZh[p.elementBranch] || p.elementBranch;
    return `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${stemZh}/${branchZh})`;
  }).join(', ');
  const elementsStr = localData.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? '乾造 (男)' : '坤造 (女)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : '中国 (未知城市)';
  
  // Deterministic Data
  const patternStr = localData.pattern || "Unknown";
  const favorableStr = localData.favorableElements ? localData.favorableElements.join(', ') : "Unknown";
  const unfavorableStr = localData.unfavorableElements ? localData.unfavorableElements.join(', ') : "Unknown";

  // Determine date display for prompt
  const dateTypeStr = input.calendarType === 'lunar' ? `农历 (阴历) ${input.isLeapMonth ? '闰' : ''}` : '公历 (阳历)';

  const systemInstruction = `你是一位精通"地理五行"、"八字格局"与"调候用神"的命理大师，同时对中国各城市的产业、人文、地理气候有深入了解。
你的任务是为用户推荐最适合生活和发展的中国城市。

*** 核心指令：必须严格遵循提供的喜用神数据 ***
系统已通过精密算法计算出该命局的喜用神，你**必须直接使用**，严禁自行重新推算或更改。
你的工作是基于这些喜用神，结合城市的多元特征，给出富有洞察力的推荐。

1. **已定格局与喜忌**：
   - 格局：${patternStr}
   - 喜用神（Favorable）：${favorableStr}
   - 忌神（Unfavorable）：${unfavorableStr}

2. **高阶城市推荐逻辑**：
   - **打破刻板印象**：不要仅仅局限于"喜火去南方，喜水去北方"。要综合考虑城市的**地理方位、气候特征、主导产业、人文气质**。
   - **产业五行**：例如，互联网/科技属火，金融属金/水，教育/文化/环保属木，基建/农业属土，物流/贸易属水。如果用户喜木，除了东方城市，也可以推荐文化底蕴深厚或绿化极佳的城市。
   - **调候为急**：必须结合【调候】（如冬生喜火，夏生喜水）进行解释。例如，寒冷命局喜火，推荐气候温暖、阳光充足的城市。
   - **多样性**：推荐的5个城市必须具有多样性，包含一线城市、新一线城市、或极具特色的宜居城市，不要全部集中在同一个省份或同一个纬度。
   - **深度解析**：在描述中，将八字命理与城市的具体特征（如地形、气候、产业、生活节奏）巧妙结合，让推荐显得专业、定制化且令人信服。

3. **返回格式**（纯 JSON）：
{
  "summary": "50-80字的命理摘要，基于已定的【${patternStr}】和喜用神【${favorableStr}】进行阐述，点出其性格特质或发展方向。",
  "suitableCities": [
    { 
      "name": "城市名", 
      "score": 95, 
      "tags": ["气候标签", "产业标签", "五行标签"],
      "description": "详细理由...结合喜用神【${favorableStr}】与该城市的地理、气候或产业特征进行深度解析，说明为何能助旺命主。" 
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
    日主: ${localData.dayMaster} (${elementToZh[localData.dayMasterElement] || localData.dayMasterElement})
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