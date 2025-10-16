import { generatePsychologyMessages } from '../../../lib/psychology-messages';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { text, channelType, messageType, targetLength } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '텍스트는 필수입니다.'
      });
    }

    // 공통 함수를 사용하여 심리학 기반 메시지 3개 생성
    const psychologyMessages = generatePsychologyMessages(text, channelType, messageType, targetLength);

    return res.status(200).json({
      success: true,
      messages: psychologyMessages,
      originalText: text
    });

  } catch (error) {
    console.error('심리학 기반 메시지 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '심리학 기반 메시지 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

