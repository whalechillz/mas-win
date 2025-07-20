import { NextApiRequest, NextApiResponse } from 'next';

// 기본 검증 규칙 설정
const validationRules = [
  {
    id: 'keyword-density',
    ruleName: '키워드 밀도',
    ruleType: 'keyword',
    config: {
      minDensity: 1,
      maxDensity: 3,
      targetKeywords: ['이천전골', '이천순대국', '마쓰구골프']
    },
    weight: 30
  },
  {
    id: 'title-length',
    ruleName: '제목 길이',
    ruleType: 'length',
    config: {
      minLength: 30,
      maxLength: 60
    },
    weight: 20
  },
  {
    id: 'content-length',
    ruleName: '콘텐츠 길이',
    ruleType: 'length',
    config: {
      minLength: 1000,
      recommendedLength: 1500
    },
    weight: 15
  },
  {
    id: 'image-count',
    ruleName: '이미지 사용',
    ruleType: 'media',
    config: {
      minImages: 15,
      recommendedImages: 20
    },
    weight: 15
  },
  {
    id: 'video-usage',
    ruleName: '동영상 포함',
    ruleType: 'video',
    config: {
      required: false,
      bonus: true
    },
    weight: 10
  },
  {
    id: 'location-info',
    ruleName: '위치 정보',
    ruleType: 'location',
    config: {
      required: true,
      mapRequired: true
    },
    weight: 10
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 나중에 데이터베이스에서 동적으로 가져올 수 있도록 확장 가능
  return res.status(200).json(validationRules);
}