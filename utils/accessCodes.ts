
// 在这里配置您的“卡密”。
// 当您在小红书收到钱后，把其中一个码发给客户。
// 注意：前端硬编码是不安全的，仅作为演示或极低成本的方案。
// 建议定期更换这里的码，或者重新部署。

export const VALID_ACCESS_CODES = [
  "VIP888",
  "LUCKY2024",
  "DESTINY123",
  "XHS001",
  "XHS002",
  "XHS003",
  // 您可以随意添加更多...
];

export const verifyCode = (code: string): boolean => {
  return VALID_ACCESS_CODES.includes(code.trim().toUpperCase());
};
