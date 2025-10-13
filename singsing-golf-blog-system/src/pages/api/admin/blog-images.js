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

      // 먼저 해당 게시물의 정보를 가져와서 사용된 이미지 URL들을 추출
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('content, featured_image')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('❌ 게시물 조회 에러:', postError);
        return res.status(500).json({
          error: '게시물 정보를 불러올 수 없습니다.',
          details: postError.message
        });
      }

      // 게시물 본문에서 이미지 URL 추출 (마크다운 형식: ![alt](url))
      const imageUrlRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
      const contentImages = [];
      let match;
      while ((match = imageUrlRegex.exec(postData.content || '')) !== null) {
        contentImages.push(match[1]);
      }

      // featured_image도 추가 (대표이미지는 본문에 없어도 표시되어야 함)
      if (postData.featured_image) {
        contentImages.push(postData.featured_image);
      }

      console.log('📝 게시물에서 추출된 이미지 URL:', contentImages.length, '개');
      console.log('📝 추출된 URL들:', contentImages);

      // 모든 파일을 확인하여 게시물과 관련된 이미지들 찾기
      const postImages = files.filter(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        const isRelated = contentImages.includes(urlData.publicUrl);
        console.log(`🔍 파일 ${file.name}: ${urlData.publicUrl} - 관련됨: ${isRelated}`);
        return isRelated;
      });

      // 이미지 URL 생성
      const imagesWithUrl = postImages.map(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        // 대표이미지인지 확인
        const isFeatured = postData.featured_image === urlData.publicUrl;
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl,
          is_featured: isFeatured
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
