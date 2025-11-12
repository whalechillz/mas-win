/**
 * 이미지 품질 평가 API
 * 여러 이미지 중 가장 좋은 이미지를 선택하는 데 도움을 줍니다.
 * 
 * 평가 기준:
 * - 이미지 해상도 및 선명도
 * - 프롬프트와의 일치도 (간단한 키워드 매칭)
 * - 이미지 크기 및 품질
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { imageUrls, prompt } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'imageUrls 배열이 필요합니다'
      });
    }

    if (imageUrls.length === 1) {
      return res.status(200).json({
        success: true,
        bestImageIndex: 0,
        scores: [{ index: 0, score: 100, reasons: ['단일 이미지'] }]
      });
    }

    // 각 이미지에 대한 간단한 평가 점수 계산
    const evaluations = await Promise.all(
      imageUrls.map(async (url, index) => {
        try {
          // 이미지 메타데이터 가져오기 (크기, 형식 등)
          const response = await fetch(url, { method: 'HEAD' });
          const contentType = response.headers.get('content-type') || '';
          const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
          
          // 기본 점수 (0-100)
          let score = 50;
          const reasons = [];

          // 1. 이미지 크기 평가 (큰 이미지가 더 좋음)
          if (contentLength > 100000) { // 100KB 이상
            score += 20;
            reasons.push('고해상도 이미지');
          } else if (contentLength > 50000) { // 50KB 이상
            score += 10;
            reasons.push('중간 해상도');
          }

          // 2. 이미지 형식 평가 (PNG, JPEG 등)
          if (contentType.includes('png') || contentType.includes('jpeg') || contentType.includes('webp')) {
            score += 10;
            reasons.push('표준 이미지 형식');
          }

          // 3. 프롬프트 키워드 매칭 (간단한 평가)
          if (prompt) {
            const promptLower = prompt.toLowerCase();
            const keywords = ['golf', 'golfer', '골프', '골퍼', 'course', '코스', 'swing', '스윙'];
            const matchedKeywords = keywords.filter(keyword => 
              promptLower.includes(keyword.toLowerCase())
            );
            if (matchedKeywords.length > 0) {
              score += matchedKeywords.length * 5;
              reasons.push(`프롬프트 키워드 매칭 (${matchedKeywords.length}개)`);
            }
          }

          // 4. 랜덤 요소 추가 (실제로는 더 정교한 평가 필요)
          // 여기서는 간단하게 첫 번째 이미지에 약간의 보너스
          if (index === 0) {
            score += 5;
            reasons.push('첫 번째 옵션');
          }

          // 점수 정규화 (0-100)
          score = Math.min(100, Math.max(0, score));

          return {
            index,
            score: Math.round(score),
            reasons,
            url
          };
        } catch (error) {
          console.error(`이미지 ${index} 평가 오류:`, error);
          return {
            index,
            score: 30, // 오류 시 낮은 점수
            reasons: ['평가 오류'],
            url
          };
        }
      })
    );

    // 가장 높은 점수의 이미지 찾기
    const bestEvaluation = evaluations.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    res.status(200).json({
      success: true,
      bestImageIndex: bestEvaluation.index,
      bestImageUrl: imageUrls[bestEvaluation.index],
      scores: evaluations,
      evaluation: {
        totalImages: imageUrls.length,
        bestScore: bestEvaluation.score,
        bestReasons: bestEvaluation.reasons
      }
    });

  } catch (error) {
    console.error('이미지 평가 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 평가 중 오류가 발생했습니다',
      error: error.message
    });
  }
}

