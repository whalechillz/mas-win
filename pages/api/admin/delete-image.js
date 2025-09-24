import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🗑️ 이미지 삭제 API 요청:', req.method, req.url);

  try {
    if (req.method === 'DELETE') {
      const { imageName } = req.body;

      if (!imageName) {
        return res.status(400).json({ 
          error: 'imageName 파라미터가 필요합니다.' 
        });
      }

      console.log('🗑️ 이미지 삭제 중:', imageName);

      // Supabase Storage에서 이미지 삭제
      const { error } = await supabase.storage
        .from('blog-images')
        .remove([imageName]);

      if (error) {
        console.error('❌ 이미지 삭제 에러:', error);
        return res.status(500).json({
          error: '이미지 삭제에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 이미지 삭제 성공:', imageName);
      
      return res.status(200).json({
        success: true,
        message: '이미지가 성공적으로 삭제되었습니다.',
        deletedImage: imageName
      });

    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }

  } catch (error) {
    console.error('❌ 이미지 삭제 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
