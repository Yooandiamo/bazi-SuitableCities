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

  const systemInstruction = `你是一位精通"八字命理"与"现代城市发展"的国学规划师。
你的任务是基于用户的八字喜用神，为他们推荐最适合发展和定居的中国城市。

*** 核心指令：必须严格遵循提供的喜用神数据 ***
系统已通过精密算法计算出该命局的喜用神，你**必须直接使用**，严禁自行重新推算或更改。

1. **已定格局与喜忌**：
   - 格局：${patternStr}
   - 喜用神（Favorable）：${favorableStr}
   - 忌神（Unfavorable）：${unfavorableStr}

2. **高阶城市推荐逻辑（五行 + 性格 双维匹配）**：
   - **维度一：五行与产业（基于喜用神）**：
     * 深圳/广州：南方火木旺地，科技/创新产业发达。适合喜火木、追求高效拼搏的人。
     * 上海：东方/长江口金水旺地，金融/国际贸易发达。适合喜金水、追求精致与规则的人。
     * 北京：北方水土旺地，政治文化中心。适合喜水土、追求宏大叙事与文化底蕴的人。
     * 杭州/成都：木水相生，互联网与休闲文化并存。适合喜木水、追求生活品质与创造力的人。
     * 重庆/武汉/长沙：火土旺地，地形特殊、烟火气重。适合喜火土、性格热情豪爽的人。
     * 西安/郑州：中原土旺地，历史悠久。适合喜土、性格沉稳踏实的人。
   - **维度二：性格与城市气质（基于格局与日主）**：
     * **身强/比劫旺/七杀旺**：性格独立、敢打敢拼、抗压能力强。适合节奏快、竞争激烈、充满机遇的一线城市（如深圳、上海）。
     * **身弱/印星旺/食神旺**：性格内敛、追求安稳、注重生活品质或文化精神追求。适合节奏适中、文化底蕴深厚、宜居属性强的新一线或特色城市（如成都、杭州、苏州、昆明）。
     * **财星旺**：务实、商业嗅觉敏锐。适合商业氛围浓厚、搞钱机会多的重商城市（如广州、泉州、温州）。
   - **综合推荐**：不要机械推荐。必须将“喜用神（决定运气和产业）”与“性格格局（决定生活节奏和适应度）”深度结合。例如：如果喜水木，但性格偏安稳内敛，优先推杭州/苏州，而不是高压的深圳；如果喜火土，且性格敢打敢拼，优先推重庆/武汉甚至深圳，而不是安逸的城市。
   - **优先推荐核心城市**：优先考虑一线（北上广深）和新一线城市，确保推荐对年轻人的职业发展有实际指导意义。推荐的5个城市要有层次感（例如2个一线 + 3个强二线/特色宜居城市）。
   - **深度解析**：在描述中，将八字命理与城市的具体特征（如地形、气候、核心产业如科技/金融等）巧妙结合，说明为何能助旺命主的发展，并点出为何符合其性格。

3. **返回格式**（纯 JSON，注意：输出内容中提到喜用神、五行或格局时，不要加【】等任何括号符号）：
{
  "summary": "50-80字的命理摘要，基于已定的${patternStr}和喜用神${favorableStr}进行阐述，点出其性格特质、生活方式偏好或职业发展方向。",
  "suitableCities": [
    { 
      "name": "城市名", 
      "score": 95, 
      "tags": ["城市特质", "优势产业", "五行属性"],
      "description": "详细理由...结合喜用神${favorableStr}与该城市的地理、气候或核心产业（如科技、金融等）进行深度解析，说明为何能助旺命主的发展，并解释为何该城市的节奏/气质契合命主的性格。" 
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

  // Generate a deterministic seed based on user input
  const generateSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  const seedStr = `${input.birthDate}-${input.birthTime}-${input.gender}-${input.city}-${input.province}`;
  const seed = generateSeed(seedStr);

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
        accessCode: accessCode,
        seed: seed
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