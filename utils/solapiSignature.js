import crypto from 'crypto';

export function createSolapiSignature(apiKey, apiSecret) {
  // API Key와 Secret에서 모든 공백, 줄바꿈, 탭 문자 제거
  const cleanApiKey = String(apiKey).replace(/[\s\n\r\t\f\v]/g, '').trim();
  const cleanApiSecret = String(apiSecret).replace(/[\s\n\r\t\f\v]/g, '').trim();
  
  // ISO 8601 형식 사용
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', cleanApiSecret).update(data).digest('hex');
  
  // 헤더 값에서 줄바꿈, 탭 문자만 제거 (공백은 유지)
  const authHeader = `HMAC-SHA256 apiKey=${cleanApiKey}, date=${date}, salt=${salt}, signature=${signature}`.replace(/[\n\r\t\f\v]/g, '');
  
  return {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  };
}


