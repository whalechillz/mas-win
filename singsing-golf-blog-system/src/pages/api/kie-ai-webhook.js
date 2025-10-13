// Kie AI 웹훅 콜백 API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log('🔔 Kie AI 웹훅 콜백 수신:', req.body);
    
    const { taskId, status, images, result, error } = req.body;
    
    if (status === 'completed' || status === 'success') {
      console.log('✅ Kie AI 이미지 생성 완료:', { taskId, images, result });
      
      // 이미지 URL 추출
      let imageUrls = [];
      if (images) {
        imageUrls = Array.isArray(images) ? images : [images];
      } else if (result) {
        imageUrls = Array.isArray(result) ? result : [result];
      }
      
      console.log('🖼️ 생성된 이미지 URLs:', imageUrls);
      
      // 여기서 이미지를 Supabase에 저장하거나 다른 처리를 할 수 있습니다
      // 현재는 로그만 출력
      
      return res.status(200).json({ 
        success: true, 
        message: '웹훅 처리 완료',
        imageUrls 
      });
    } else if (status === 'failed' || error) {
      console.log('❌ Kie AI 이미지 생성 실패:', { taskId, error });
      return res.status(200).json({ 
        success: false, 
        message: '이미지 생성 실패',
        error 
      });
    } else {
      console.log('⏳ Kie AI 이미지 생성 진행 중:', { taskId, status });
      return res.status(200).json({ 
        success: true, 
        message: '처리 중',
        status 
      });
    }
  } catch (error) {
    console.error('❌ Kie AI 웹훅 처리 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '웹훅 처리 오류',
      error: error.message 
    });
  }
}
