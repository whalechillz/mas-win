import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('📂 카테고리 관리 API 요청:', req.method, req.url);

  try {
    // GET: 카테고리 목록 조회
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('image_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ 카테고리 조회 오류:', error);
        return res.status(500).json({
          error: '카테고리 조회에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 카테고리 조회 성공:', data.length, '개');
      return res.status(200).json({
        success: true,
        categories: data
      });
    }

    // POST: 새 카테고리 생성
    if (req.method === 'POST') {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          error: '카테고리 이름이 필요합니다.'
        });
      }

      // slug 생성 (한글을 영문으로 변환)
      const slug = name.toLowerCase()
        .replace(/[가-힣]/g, (match) => {
          const koreanToEnglish = {
            '골프': 'golf',
            '장비': 'equipment',
            '코스': 'course',
            '이벤트': 'event',
            '기타': 'etc',
            '드라이버': 'driver',
            '아이언': 'iron',
            '퍼터': 'putter',
            '웨지': 'wedge',
            '볼': 'ball',
            '악세서리': 'accessory',
            '의류': 'clothing',
            '신발': 'shoes',
            '가방': 'bag',
            '장갑': 'glove'
          };
          return koreanToEnglish[match] || match;
        })
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data, error } = await supabase
        .from('image_categories')
        .insert([
          {
            name: name.trim(),
            slug: slug,
            description: description || null
          }
        ])
        .select();

      if (error) {
        console.error('❌ 카테고리 생성 오류:', error);
        return res.status(500).json({
          error: '카테고리 생성에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 카테고리 생성 성공:', data[0]);
      return res.status(201).json({
        success: true,
        category: data[0]
      });
    }

    // PUT: 카테고리 수정
    if (req.method === 'PUT') {
      const { id, name, description } = req.body;

      if (!id || !name || name.trim() === '') {
        return res.status(400).json({
          error: '카테고리 ID와 이름이 필요합니다.'
        });
      }

      // slug 생성
      const slug = name.toLowerCase()
        .replace(/[가-힣]/g, (match) => {
          const koreanToEnglish = {
            '골프': 'golf',
            '장비': 'equipment',
            '코스': 'course',
            '이벤트': 'event',
            '기타': 'etc',
            '드라이버': 'driver',
            '아이언': 'iron',
            '퍼터': 'putter',
            '웨지': 'wedge',
            '볼': 'ball',
            '악세서리': 'accessory',
            '의류': 'clothing',
            '신발': 'shoes',
            '가방': 'bag',
            '장갑': 'glove'
          };
          return koreanToEnglish[match] || match;
        })
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data, error } = await supabase
        .from('image_categories')
        .update({
          name: name.trim(),
          slug: slug,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ 카테고리 수정 오류:', error);
        return res.status(500).json({
          error: '카테고리 수정에 실패했습니다.',
          details: error.message
        });
      }

      if (data.length === 0) {
        return res.status(404).json({
          error: '카테고리를 찾을 수 없습니다.'
        });
      }

      console.log('✅ 카테고리 수정 성공:', data[0]);
      return res.status(200).json({
        success: true,
        category: data[0]
      });
    }

    // DELETE: 카테고리 삭제
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          error: '카테고리 ID가 필요합니다.'
        });
      }

      // 먼저 해당 카테고리를 사용하는 이미지가 있는지 확인
      // 주의: image_metadata 테이블에는 category 컬럼이 없고 category_id 컬럼이 있음
      const { data: imageCount, error: countError } = await supabase
        .from('image_assets')
        .select('id', { count: 'exact' })
        .eq('category_id', id);

      if (countError) {
        console.error('❌ 이미지 카운트 조회 오류:', countError);
        return res.status(500).json({
          error: '카테고리 사용 현황 확인에 실패했습니다.',
          details: countError.message
        });
      }

      if (imageCount && imageCount.length > 0) {
        return res.status(400).json({
          error: `이 카테고리를 사용하는 이미지가 ${imageCount.length}개 있습니다. 먼저 이미지의 카테고리를 변경해주세요.`
        });
      }

      const { error } = await supabase
        .from('image_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 카테고리 삭제 오류:', error);
        return res.status(500).json({
          error: '카테고리 삭제에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 카테고리 삭제 성공:', id);
      return res.status(200).json({
        success: true,
        message: '카테고리가 삭제되었습니다.'
      });
    }

    return res.status(405).json({
      error: '지원하지 않는 HTTP 메서드입니다.'
    });

  } catch (error) {
    console.error('❌ 카테고리 관리 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
