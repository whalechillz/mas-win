// 블로그 이미지 관리 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 블로그 이미지 관리 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 특정 게시물의 이미지 목록 조회
      const { postId } = req.query;
      
      if (!postId) {
        return res.status(400).json({
          error: 'postId 파라미터가 필요합니다.'
        });
      }

      console.log('📝 게시물 이미지 목록 조회 중...', postId);
      
      // blog-images 버킷에서 해당 게시물 관련 이미지들 조회
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('❌ 스토리지 조회 에러:', error);
        return res.status(500).json({
          error: '이미지 목록을 불러올 수 없습니다.',
          details: error.message
        });
      }

      // 게시물 ID와 관련된 이미지들 필터링
      const postImages = files.filter(file => 
        file.name.includes(`migration-${postId}`) || 
        file.name.includes(`complete-migration`) ||
        file.name.includes(`blog-${postId}`)
      );

      // 이미지 URL 생성
      const imagesWithUrl = postImages.map(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl,
          is_featured: false // 기본값, 추후 로직으로 판단
        };
      });

      console.log('✅ 게시물 이미지 조회 성공:', imagesWithUrl.length, '개');
      return res.status(200).json({ 
        images: imagesWithUrl,
        count: imagesWithUrl.length
      });
      
    } else if (req.method === 'POST') {
      // 이미지를 게시물에 연결
      const { postId, imageName, action } = req.body;
      
      if (!postId || !imageName || !action) {
        return res.status(400).json({
          error: 'postId, imageName, action 파라미터가 필요합니다.'
        });
      }

      console.log('📝 이미지 연결 작업:', { postId, imageName, action });
      
      // 여기서는 단순히 성공 응답 (실제 연결 로직은 추후 구현)
      return res.status(200).json({
        success: true,
        message: `이미지 ${action} 완료`,
        data: { postId, imageName, action }
      });
      
    } else if (req.method === 'DELETE') {
      // 이미지 삭제
      const { imageName } = req.query;
      
      if (!imageName) {
        return res.status(400).json({
          error: 'imageName 파라미터가 필요합니다.'
        });
      }

      console.log('🗑️ 이미지 삭제 중...', imageName);
      
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
        message: '이미지가 삭제되었습니다.',
        data: { imageName }
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 블로그 이미지 관리 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
