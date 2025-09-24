// Google API를 활용한 자동 태그 생성 시스템
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Vision API 설정 (실제 구현 시 환경변수에서 가져오기)
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Google Vision API로 이미지 분석
const analyzeImageWithGoogleVision = async (imageUrl) => {
  if (!GOOGLE_VISION_API_KEY) {
    console.log('⚠️ Google Vision API 키가 설정되지 않음, 더미 데이터 반환');
    return {
      labels: ['골프', '드라이버', '스포츠', '장비', '클럽'],
      confidence: 0.95,
      dominantColors: ['#2D5016', '#FFFFFF', '#1A1A1A'],
      text: null,
      faces: 0,
      objects: ['골프클럽', '골프공', '골프장갑']
    };
  }

  try {
    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              source: {
                imageUri: imageUrl
              }
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'TEXT_DETECTION', maxResults: 5 },
              { type: 'IMAGE_PROPERTIES' }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.responses && data.responses[0]) {
      const result = data.responses[0];
      
      return {
        labels: result.labelAnnotations?.map(label => ({
          description: label.description,
          score: label.score
        })) || [],
        objects: result.localizedObjectAnnotations?.map(obj => ({
          name: obj.name,
          score: obj.score
        })) || [],
        text: result.textAnnotations?.[0]?.description || null,
        colors: result.imagePropertiesAnnotation?.dominantColors?.colors || [],
        faces: result.faceAnnotations?.length || 0
      };
    }
    
    return { labels: [], objects: [], text: null, colors: [], faces: 0 };
  } catch (error) {
    console.error('❌ Google Vision API 오류:', error);
    return { labels: [], objects: [], text: null, colors: [], faces: 0 };
  }
};

// 골프 관련 키워드 매핑
const GOLF_KEYWORDS_MAP = {
  // 영어 -> 한국어
  'golf': '골프',
  'driver': '드라이버',
  'club': '클럽',
  'iron': '아이언',
  'putter': '퍼터',
  'wedge': '웨지',
  'wood': '우드',
  'ball': '골프공',
  'tee': '티',
  'bag': '골프백',
  'glove': '골프장갑',
  'shoes': '골프화',
  'swing': '스윙',
  'course': '골프장',
  'green': '그린',
  'fairway': '페어웨이',
  'bunker': '벙커',
  'rough': '러프',
  'sport': '스포츠',
  'equipment': '장비',
  'outdoor': '야외',
  'recreation': '레크리에이션',
  'leisure': '레저',
  'masgolf': '마스골프',
  'mas': '마스'
};

// 골프 관련 키워드 우선순위
const GOLF_PRIORITY_KEYWORDS = [
  '골프', '드라이버', '마스골프', '클럽', '스윙', '골프공', 
  '골프장', '아이언', '퍼터', '웨지', '우드', '골프백'
];

// 키워드 점수 계산
const calculateKeywordScore = (keyword, labels, objects) => {
  let score = 0;
  
  // 골프 관련 키워드 우선순위
  if (GOLF_PRIORITY_KEYWORDS.includes(keyword)) {
    score += 10;
  }
  
  // Google Vision 결과에서 매칭
  labels.forEach(label => {
    if (label.description.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(label.description.toLowerCase())) {
      score += label.score * 5;
    }
  });
  
  objects.forEach(obj => {
    if (obj.name.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(obj.name.toLowerCase())) {
      score += obj.score * 3;
    }
  });
  
  return score;
};

// 자동 태그 생성
const generateAutoTags = (imageUrl, filename, visionResults) => {
  const tags = new Set();
  
  // 1. 파일명에서 키워드 추출
  const filenameKeywords = filename.toLowerCase()
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .split(/[-_.]/)
    .map(part => GOLF_KEYWORDS_MAP[part] || part)
    .filter(keyword => keyword.length > 1);
  
  filenameKeywords.forEach(keyword => tags.add(keyword));
  
  // 2. Google Vision 결과에서 키워드 추출
  if (visionResults.labels) {
    visionResults.labels.forEach(label => {
      const koreanKeyword = GOLF_KEYWORDS_MAP[label.description.toLowerCase()];
      if (koreanKeyword) {
        tags.add(koreanKeyword);
      } else if (label.score > 0.7) {
        tags.add(label.description);
      }
    });
  }
  
  if (visionResults.objects) {
    visionResults.objects.forEach(obj => {
      const koreanKeyword = GOLF_KEYWORDS_MAP[obj.name.toLowerCase()];
      if (koreanKeyword) {
        tags.add(koreanKeyword);
      } else if (obj.score > 0.7) {
        tags.add(obj.name);
      }
    });
  }
  
  // 3. 키워드 점수 계산 및 정렬
  const scoredTags = Array.from(tags).map(tag => ({
    tag,
    score: calculateKeywordScore(tag, visionResults.labels || [], visionResults.objects || [])
  })).sort((a, b) => b.score - a.score);
  
  // 4. 상위 10개 태그 반환
  return scoredTags.slice(0, 10).map(item => item.tag);
};

// SEO 최적화된 alt 텍스트 생성
const generateSEOAltText = (filename, tags, visionResults) => {
  const priorityTags = tags.filter(tag => GOLF_PRIORITY_KEYWORDS.includes(tag));
  const mainTags = priorityTags.length > 0 ? priorityTags : tags.slice(0, 3);
  
  return `${mainTags.join(' ')} 이미지 - MASGOLF 골프 장비 전문`;
};

export default async function handler(req, res) {
  console.log('🔍 자동 태그 생성 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { imageUrl, filename } = req.body;
      
      if (!imageUrl || !filename) {
        return res.status(400).json({
          error: 'imageUrl과 filename이 필요합니다.'
        });
      }

      console.log('🔍 이미지 분석 시작:', filename);
      
      // Google Vision API로 이미지 분석
      const visionResults = await analyzeImageWithGoogleVision(imageUrl);
      
      // 자동 태그 생성
      const autoTags = generateAutoTags(imageUrl, filename, visionResults);
      
      // SEO 최적화된 alt 텍스트 생성
      const seoAltText = generateSEOAltText(filename, autoTags, visionResults);
      
      const result = {
        filename,
        imageUrl,
        autoTags,
        seoAltText,
        visionResults: {
          labels: visionResults.labels?.slice(0, 5) || [],
          objects: visionResults.objects?.slice(0, 5) || [],
          text: visionResults.text,
          faces: visionResults.faces,
          colors: visionResults.colors?.slice(0, 3) || []
        },
        generatedAt: new Date().toISOString()
      };

      console.log('✅ 자동 태그 생성 완료:', autoTags);
      
      return res.status(200).json({ 
        success: true,
        data: result 
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 자동 태그 생성 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
