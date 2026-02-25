export default async function handler(req, res) {
  // 1. 设置 CORS (允许跨域)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, accessCode } = req.body;

    // 2. 获取服务器端的环境变量
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    const VALID_CODES_STRING = process.env.ACCESS_CODES || "VIP888,TEST"; // 默认备用码
    const VALID_CODES = VALID_CODES_STRING.split(',').map(c => c.trim().toUpperCase());

    // 3. 验证 API Key 是否配置
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    // 4. *** 核心安全验证：服务器端验证卡密 ***
    if (!accessCode || !VALID_CODES.includes(accessCode.trim().toUpperCase())) {
      // 这里的延时是为了防止暴力破解，增加破解成本
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(403).json({ error: '无效的解锁码 (Invalid Access Code)' });
    }

    // 5. 卡密正确，代表用户已付费，现在由服务器向 DeepSeek 发起请求
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}` // Key 在这里注入，用户看不见
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.1,
        top_p: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Upstream API Error:", errorData);
        return res.status(response.status).json({ error: 'AI 服务暂时不可用，请稍后重试' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
