/**
 * 문서 텍스트 추출 API (Google Vision API OCR)
 * 스캔된 문서 이미지에서 텍스트를 추출
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    const googleApiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!googleApiKey) {
      console.error('❌ Google Vision API 키가 설정되지 않았습니다');
      return res.status(500).json({ 
        error: 'Google Vision API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.' 
      });
    }

    console.log('🔍 [OCR] Google Vision API 호출 시작:', imageUrl.substring(0, 100));

    // 이미지 URL에서 이미지 데이터 가져오기
    let imageData: string;
    
    // Google Cloud Storage URI (gs://)인 경우
    if (imageUrl.startsWith('gs://')) {
      // imageUri 방식 사용
      imageData = imageUrl;
    } else {
      // HTTP/HTTPS URL인 경우 이미지를 다운로드하여 Base64로 변환
      console.log('📥 [OCR] 이미지 다운로드 중:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        console.error('❌ [OCR] 이미지 다운로드 실패:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          url: imageUrl
        });
        return res.status(500).json({
          error: `이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`
        });
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      imageData = base64Image;
      console.log('✅ [OCR] 이미지 Base64 변환 완료:', {
        size: base64Image.length,
        originalUrl: imageUrl.substring(0, 100)
      });
    }

    // Google Vision API DOCUMENT_TEXT_DETECTION 호출
    const requestBody: any = {
      requests: [
        {
          image: imageUrl.startsWith('gs://') 
            ? { source: { imageUri: imageUrl } }
            : { content: imageData },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    console.log('📤 [OCR] Google Vision API 요청:', {
      method: imageUrl.startsWith('gs://') ? 'imageUri' : 'content (base64)',
      url: imageUrl.substring(0, 100)
    });

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OCR] Google Vision API 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return res.status(response.status).json({
        error: `Google Vision API 오류: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // OCR 결과 추출
    const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
    const extractedText = fullTextAnnotation?.text || '';
    const pages = fullTextAnnotation?.pages || [];
    
    console.log('✅ [OCR] 텍스트 추출 완료:', {
      textLength: extractedText.length,
      pagesCount: pages.length,
      preview: extractedText.substring(0, 100)
    });

    // 구조화된 텍스트 정보 (선택사항)
    const textBlocks = fullTextAnnotation?.blocks?.map((block: any) => ({
      text: block.paragraphs?.map((p: any) => 
        p.words?.map((w: any) => 
          w.symbols?.map((s: any) => s.text).join('')
        ).join(' ')
      ).join('\n'),
      confidence: block.confidence || 0
    })) || [];

    return res.status(200).json({
      success: true,
      text: extractedText,
      textBlocks,
      pagesCount: pages.length,
      confidence: fullTextAnnotation?.pages?.[0]?.confidence || 0,
      fullTextAnnotation: fullTextAnnotation // 전체 구조 정보 (선택사항)
    });

  } catch (error: any) {
    console.error('❌ [OCR] 텍스트 추출 오류:', error);
    return res.status(500).json({
      error: '텍스트 추출 실패',
      details: error.message
    });
  }
}
