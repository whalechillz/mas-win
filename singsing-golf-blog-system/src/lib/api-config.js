// API 설정 파일
export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : 'https://win.masgolf.co.kr';

export const SLACK_API_URL = `${API_BASE_URL}/api/slack/notify`;
