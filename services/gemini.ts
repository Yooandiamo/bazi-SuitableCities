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

// 2. Main Analysis Function (DeepSeek Implementation)
export const analyzeDestiny = async (input: UserInput): Promise<DestinyAnalysis> => {
  // Validate API Key presence
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("未配置 API Key。请在环境配置中添加 DeepSeek API Key。");
  }

  // Step 1: Local Calculation (True Solar Time)
  const localBaZi = calculateAccurateBaZi(input.birthDate, input.birthTime, input.longitude);
  
  // Prepare Prompt Data
  const pillarsStr = localBaZi.pillars.map(p => `${p.name}: ${p.heavenlyStem}${p.earthlyBranch} (${p.elementStem}/${p.elementBranch})`).join(', ');
  const elementsStr = localBaZi.fiveElements.map(e => `${e.label}: ${e.percentage}%`).join(', ');
  const genderStr = input.gender === 'male' ? 'Male (乾造)' : 'Female (坤造)';
  const locationStr = input.city && input.province ? `${input.city}, ${input.province}` : 'China (Unknown City)';

  const systemPrompt = `你是一位精通传统八字命理的大师。请基于用户提供的八字排盘数据进行分析。
  必须以严格的 JSON 格式输出，不要包含 Markdown 格式（如 \`\`\`json），不要包含任何额外的解释文本。
  
  请严格按照以下 JSON 结构返回数据:
  {
    "favorableElements": ["木", "火"],
    "unfavorableElements": ["金"],
    "summary": "50-80字的命理摘要",
    "suitableCities": [{"title": "城市名", "description": "理由", "matchScore": 90}],
    "suitableCareers": [{"title": "职业名", "description": "理由", "matchScore": 95}]
  }`;

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
    // Step 2: Call DeepSeek API directly via Fetch
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }, // DeepSeek supports JSON mode
        temperature: 1.2
      })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("DeepSeek API Error:", response.status, errData);
        
        if (response.status === 401) throw new Error("DeepSeek API Key 无效。请检查 Key 是否正确。");
        if (response.status === 402) throw new Error("DeepSeek 账户余额不足。");
        if (response.status === 429) throw new Error("请求过于频繁，请稍后重试。");
        if (response.status >= 500) throw new Error("DeepSeek 服务器暂时不可用。");
        
        throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("API 返回了空内容");

    let parsedAIResponse;
    try {
        const cleanedText = content.replace(/```json\n?|\n?```/g, '').trim();
        parsedAIResponse = JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON Parse Error:", e, content);
        throw new Error("无法解析 AI 返回的数据格式");
    }
    
    return sanitizeData(parsedAIResponse, localBaZi);

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    throw new Error(error.message || "无法连接到命运分析服务，请检查网络或稍后再试。");
  }
};