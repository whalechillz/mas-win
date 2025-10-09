// 이미지 메타데이터 관리 API (SEO 최적화)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Vision API를 사용한 이미지 분석 (실제 구현 시 API 키 필요)
const analyzeImageWithGoogleVision = async (imageUrl) => {
  // 실제 구현 시 Google Vision API 사용
  // 현재는 더미 데이터 반환
  return {
    labels: ['골프', '드라이버', '스포츠', '장비'],
    confidence: 0.95,
    dominantColors: ['#2D5016', '#FFFFFF', '#1A1A1A'],
    text: null,
    faces: 0
  };
};

// 이미지 파일명에서 SEO 키워드 추출
const extractKeywordsFromFilename = (filename) => {
  const keywords = [];
  
  // 파일명에서 하이픈, 언더스코어, 점으로 분리
  const parts = filename.toLowerCase()
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .split(/[-_.]/);
  
  // 골프 관련 키워드 매핑
  const golfKeywords = {
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
    'masgolf': '마스골프',
    'mas': '마스'
  };
  
  parts.forEach(part => {
    if (golfKeywords[part]) {
      keywords.push(golfKeywords[part]);
    } else if (part.length > 2) {
      keywords.push(part);
    }
  });
  
  return [...new Set(keywords)]; // 중복 제거
};

// SEO 최적화된 alt 텍스트 생성
const generateSEOAltText = (filename, labels = []) => {
  const keywords = extractKeywordsFromFilename(filename);
  const allKeywords = [...keywords, ...labels];
  
  // 골프 관련 키워드 우선순위
  const priorityKeywords = ['골프', '드라이버', '마스골프', '클럽', '스윙'];
  const sortedKeywords = allKeywords.sort((a, b) => {
    const aIndex = priorityKeywords.indexOf(a);
    const bIndex = priorityKeywords.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
  
  return `${sortedKeywords.slice(0, 3).join(' ')} 이미지 - MASGOLF 골프 장비`;
};

export default async function handler(req, res) {
  console.log('🔍 이미지 메타데이터 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 특정 이미지의 메타데이터 조회
      const { imageName, imageUrl } = req.query;
      
      if (!imageName && !imageUrl) {
        return res.status(400).json({
          error: 'imageName 또는 imageUrl 파라미터가 필요합니다.'
        });
      }

      try {
        // 데이터베이스에서 실제 메타데이터 조회
        let query = supabase.from('image_metadata').select('*');
        
        if (imageUrl) {
          query = query.eq('image_url', imageUrl);
        } else if (imageName) {
          // imageName으로 조회할 때는 URL을 구성해서 검색
          const constructedUrl = `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${imageName}`;
          query = query.eq('image_url', constructedUrl);
        }
        
        const { data, error } = await query.single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // 데이터가 없는 경우 더미 데이터 반환
            const metadata = {
              filename: imageName,
              altText: generateSEOAltText(imageName),
              keywords: extractKeywordsFromFilename(imageName),
              seoTitle: `${extractKeywordsFromFilename(imageName).slice(0, 2).join(' ')} - MASGOLF`,
              description: `MASGOLF ${extractKeywordsFromFilename(imageName).join(' ')} 관련 이미지입니다.`,
              createdAt: new Date().toISOString()
            };
            return res.status(200).json({ metadata });
          }
          console.error('❌ 메타데이터 조회 오류:', error);
          return res.status(500).json({ error: '메타데이터 조회 실패', details: error.message });
        }

        // 데이터베이스에서 조회한 실제 데이터 반환
        const metadata = {
          filename: imageName,
          altText: data.alt_text || '',
          keywords: data.tags || [],
          seoTitle: data.title || '',
          description: data.description || '',
          category: data.category_id ? 
            (data.category_id === 1 ? '골프' : 
             data.category_id === 2 ? '장비' : 
             data.category_id === 3 ? '코스' : 
             data.category_id === 4 ? '이벤트' : '기타') : '',
          createdAt: data.created_at
        };

        return res.status(200).json({ metadata });
      } catch (error) {
        console.error('❌ 메타데이터 조회 중 오류:', error);
        return res.status(500).json({ error: '서버 오류', details: error.message });
      }
      
    } else if (req.method === 'POST') {
      // 이미지 메타데이터 생성/업데이트
      const { imageName, imageUrl, alt_text, keywords, title, description, category } = req.body;
      
      if (!imageName || !imageUrl) {
        return res.status(400).json({
          error: 'imageName과 imageUrl이 필요합니다.'
        });
      }

      console.log('📝 메타데이터 저장 시작:', { 
        imageName, 
        imageUrl, 
        alt_text: alt_text ? `${alt_text.substring(0, 50)}... (길이: ${alt_text.length})` : null,
        keywords: keywords ? `${keywords.length}개 키워드` : null,
        title: title ? `${title.substring(0, 30)}... (길이: ${title.length})` : null,
        description: description ? `${description.substring(0, 50)}... (길이: ${description.length})` : null,
        category,
        requestBody: req.body 
      });

      // 카테고리 문자열을 ID로 변환 (한글/영문 모두 지원)
      let categoryId = null;
      if (category && category !== '') {
        // 한글/영문 카테고리를 숫자 ID로 변환
        const categoryMap = {
          // 한글 카테고리
          '골프': 1, '장비': 2, '코스': 3, '이벤트': 4, '기타': 5,
          // 영문 카테고리
          'golf': 1, 'equipment': 2, 'course': 3, 'event': 4, 'other': 5,
          // 추가 영문 카테고리
          'general': 5, 'instruction': 1
        };
        categoryId = categoryMap[category.toLowerCase()] || null;
      }

      // 🔍 입력값 검증 및 길이 제한 확인 (SEO 최적화 기준)
      const validationErrors = [];
      
      if (alt_text && alt_text.length > 125) {
        validationErrors.push(`ALT 텍스트가 너무 깁니다 (${alt_text.length}자, SEO 최적화 권장: 125자 이하)`);
      }
      
      if (title && title.length > 60) {
        validationErrors.push(`제목이 너무 깁니다 (${title.length}자, SEO 최적화 권장: 60자 이하)`);
      }
      
      if (description && description.length > 160) {
        validationErrors.push(`설명이 너무 깁니다 (${description.length}자, SEO 최적화 권장: 160자 이하)`);
      }
      
      // 카테고리 필수 입력 검증
      if (!category || category.trim() === '') {
        validationErrors.push('카테고리를 선택해주세요');
      }
      
      if (validationErrors.length > 0) {
        console.error('❌ 입력값 검증 실패:', validationErrors);
        return res.status(400).json({ 
          error: '입력값 검증 실패', 
          details: validationErrors 
        });
      }

      // 데이터베이스에 메타데이터 저장/업데이트
      const metadataData = {
        image_url: imageUrl,
        alt_text: alt_text || '',
        tags: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []),
        title: title || '',
        description: description || '',
        category_id: categoryId,
        updated_at: new Date().toISOString()
      };
      
      console.log('📊 최종 저장 데이터:', {
        alt_text_length: metadataData.alt_text.length,
        title_length: metadataData.title.length,
        description_length: metadataData.description.length,
        tags_count: metadataData.tags.length,
        category_id: metadataData.category_id
      });

      // 기존 메타데이터가 있는지 확인
      console.log('🔍 기존 메타데이터 확인 중:', imageUrl);
      const { data: existingData, error: checkError } = await supabase
        .from('image_metadata')
        .select('id')
        .eq('image_url', imageUrl)
        .single();
      
      console.log('🔍 기존 메타데이터 확인 결과:', { existingData, checkError });

      let result;
      if (existingData) {
        // 기존 메타데이터 업데이트
        console.log('🔄 기존 메타데이터 업데이트 중:', metadataData);
        const { data, error } = await supabase
          .from('image_metadata')
          .update(metadataData)
          .eq('image_url', imageUrl)
          .select()
          .single();
        
        if (error) {
          console.error('❌ 메타데이터 업데이트 오류:', error);
          return res.status(500).json({ error: '메타데이터 업데이트 실패', details: error.message });
        }
        result = data;
        console.log('✅ 메타데이터 업데이트 완료:', result);
      } else {
        // 새 메타데이터 생성
        console.log('➕ 새 메타데이터 생성 중:', metadataData);
        const { data, error } = await supabase
          .from('image_metadata')
          .insert([{
            ...metadataData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) {
          console.error('❌ 메타데이터 생성 오류:', error);
          return res.status(500).json({ error: '메타데이터 생성 실패', details: error.message });
        }
        result = data;
        console.log('✅ 메타데이터 생성 완료:', result);
      }

      return res.status(200).json({ 
        success: true,
        metadata: result
      });
      
    } else if (req.method === 'PUT') {
      // 이미지 메타데이터 업데이트
      const { imageName, imageUrl, alt_text, keywords, title, description, category } = req.body;
      
      if (!imageName || !imageUrl) {
        return res.status(400).json({
          error: 'imageName과 imageUrl이 필요합니다.'
        });
      }

      console.log('📝 메타데이터 업데이트 시작:', { imageName, imageUrl, alt_text, keywords, title, description, category });

      // 카테고리 문자열을 ID로 변환 (한글/영문 모두 지원)
      let categoryId = null;
      if (category && category !== '') {
        // 한글/영문 카테고리를 숫자 ID로 변환
        const categoryMap = {
          // 한글 카테고리
          '골프': 1, '장비': 2, '코스': 3, '이벤트': 4, '기타': 5,
          // 영문 카테고리
          'golf': 1, 'equipment': 2, 'course': 3, 'event': 4, 'other': 5,
          // 추가 영문 카테고리
          'general': 5, 'instruction': 1
        };
        categoryId = categoryMap[category.toLowerCase()] || null;
      }

      // 데이터베이스에서 메타데이터 업데이트
      const metadataData = {
        image_url: imageUrl,
        alt_text: alt_text || '',
        tags: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []),
        title: title || '',
        description: description || '',
        category_id: categoryId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('image_metadata')
        .update(metadataData)
        .eq('image_url', imageUrl)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 메타데이터 업데이트 오류:', error);
        return res.status(500).json({ error: '메타데이터 업데이트 실패', details: error.message });
      }

      console.log('✅ 메타데이터 업데이트 완료');

      return res.status(200).json({ 
        success: true,
        metadata: data
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 이미지 메타데이터 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
