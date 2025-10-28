import crypto from 'crypto';

export function createSolapiSignature(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  
  // 날짜를 따옴표로 감싸서 HTTP 헤더에서 유효하게 만듦
  return {
    Authorization: `HMAC-SHA256 apiKey=${apiKey}, date="${date}", salt=${salt}, signature=${signature}`
  };
}


