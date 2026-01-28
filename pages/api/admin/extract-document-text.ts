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

    console.log('🔍 [OCR] Google Vision API 호출 시작:', {
      imageUrl: imageUrl.substring(0, 100),
      urlType: imageUrl.startsWith('gs://') ? 'Google Cloud Storage' : 'HTTP/HTTPS',
      hasApiKey: !!googleApiKey,
      apiKeyPrefix: googleApiKey ? googleApiKey.substring(0, 10) + '...' : '없음'
    });

    // 이미지 URL에서 이미지 데이터 가져오기
    let imageData: string;
    let useContentField = false;
    
    // Google Cloud Storage URI (gs://)인 경우
    if (imageUrl.startsWith('gs://')) {
      // imageUri 방식 사용
      imageData = imageUrl;
      console.log('📋 [OCR] Google Cloud Storage URI 사용:', imageUrl);
    } else {
      // HTTP/HTTPS URL인 경우 이미지를 다운로드하여 Base64로 변환
      console.log('📥 [OCR] 이미지 다운로드 시작:', {
        url: imageUrl,
        timestamp: new Date().toISOString()
      });
      
      try {
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MASGOLF-OCR/1.0)'
          }
        });
        
        console.log('📥 [OCR] 이미지 다운로드 응답:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          contentType: imageResponse.headers.get('content-type'),
          contentLength: imageResponse.headers.get('content-length')
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text().catch(() => '');
          console.error('❌ [OCR] 이미지 다운로드 실패:', {
            status: imageResponse.status,
            statusText: imageResponse.statusText,
            url: imageUrl,
            errorText: errorText.substring(0, 200)
          });
          return res.status(500).json({
            error: `이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`,
            details: errorText.substring(0, 200)
          });
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        imageData = base64Image;
        useContentField = true;
        
        console.log('✅ [OCR] 이미지 Base64 변환 완료:', {
          originalSize: imageBuffer.byteLength,
          base64Size: base64Image.length,
          originalUrl: imageUrl.substring(0, 100),
          mimeType: imageResponse.headers.get('content-type') || 'unknown'
        });
      } catch (downloadError: any) {
        console.error('❌ [OCR] 이미지 다운로드 중 예외 발생:', {
          error: downloadError.message,
          stack: downloadError.stack,
          url: imageUrl
        });
        return res.status(500).json({
          error: '이미지 다운로드 중 오류 발생',
          details: downloadError.message
        });
      }
    }

    // Google Vision API DOCUMENT_TEXT_DETECTION 호출
    const requestBody: any = {
      requests: [
        {
          image: useContentField
            ? { content: imageData }
            : { source: { imageUri: imageData } },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`;
    
    console.log('📤 [OCR] Google Vision API 요청 준비:', {
      method: useContentField ? 'content (base64)' : 'imageUri',
      url: imageUrl.substring(0, 100),
      apiUrl: apiUrl.substring(0, 100) + '...',
      requestBodySize: JSON.stringify(requestBody).length,
      imageDataSize: useContentField ? imageData.length : 'N/A (gs://)',
      timestamp: new Date().toISOString()
    });

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 [OCR] Google Vision API 응답 수신:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (fetchError: any) {
      console.error('❌ [OCR] Google Vision API 호출 중 네트워크 오류:', {
        error: fetchError.message,
        stack: fetchError.stack,
        apiUrl: apiUrl.substring(0, 100) + '...'
      });
      return res.status(500).json({
        error: 'Google Vision API 호출 중 네트워크 오류',
        details: fetchError.message
      });
    }

    if (!response.ok) {
      let errorText = '';
      let errorJson: any = null;
      
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // JSON 파싱 실패 시 텍스트 그대로 사용
        }
      } catch (e) {
        errorText = '응답 본문을 읽을 수 없습니다';
      }
      
      console.error('❌ [OCR] Google Vision API 오류 상세:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        errorJson: errorJson,
        apiKeyPrefix: googleApiKey ? googleApiKey.substring(0, 10) + '...' : '없음',
        requestMethod: useContentField ? 'content' : 'imageUri',
        imageUrl: imageUrl.substring(0, 100)
      });
      
      // 401 오류인 경우 특별한 메시지
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Google Vision API 인증 실패 (401 Unauthorized)',
          details: errorJson || errorText,
          possibleCauses: [
            'API 키가 잘못되었거나 만료됨',
            'API 키에 Vision API 권한이 없음',
            'Google Cloud 프로젝트에서 Vision API가 활성화되지 않음',
            'API 키에 IP/Referrer 제한이 설정되어 localhost 접근이 차단됨'
          ],
          suggestion: 'Google Cloud Console에서 API 키와 Vision API 설정을 확인하세요'
        });
      }
      
      return res.status(response.status).json({
        error: `Google Vision API 오류: ${response.status}`,
        details: errorJson || errorText
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
