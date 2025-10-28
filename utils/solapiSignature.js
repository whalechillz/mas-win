import crypto from 'crypto';

export function createSolapiSignature(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  return {
    Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
  };
}


