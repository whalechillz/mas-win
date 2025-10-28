import crypto from 'crypto';

export function createSolapiSignature(apiKey, apiSecret) {
  // ISO 8601 형식 사용
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  
  return {
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json'
  };
}


