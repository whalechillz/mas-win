import crypto from 'crypto';

export function createSolapiSignature(apiKey, apiSecret) {
  // Unix timestamp 사용 (콜론 없는 형식)
  const date = Math.floor(Date.now() / 1000).toString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  
  return {
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json'
  };
}


