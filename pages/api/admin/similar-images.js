import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 메타데이터 추출 (크기, 형식, 압축률 등)
const extractImageMetadata = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // 파일 크기
    const fileSize = buffer.byteLength;
    
    // 이미지 형식 감지
    let format = 'unknown';
    let width = 0;
    let height = 0;
    
    // PNG 시그니처
    if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      format = 'png';
      width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19];
      height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23];
    }
    // JPEG 시그니처
    else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) {
      format = 'jpeg';
      // JPEG는 복잡한 구조이므로 간단한 추정
      width = 0; // 실제로는 더 복잡한 파싱 필요
      height = 0;
    }
    // WebP 시그니처
    else if (uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
      format = 'webp';
      width = (uint8Array[26] << 8) | uint8Array[27];
      height = (uint8Array[28] << 8) | uint8Array[29];
    }
    
    // 압축률 추정 (픽셀 수 대비 파일 크기)
    const pixelCount = width * height;
    const compressionRatio = pixelCount > 0 ? fileSize / pixelCount : 0;
    
    return {
      fileSize,
      format,
      width,
      height,
      pixelCount,
      compressionRatio,
      aspectRatio: width > 0 && height > 0 ? width / height : 0
    };
    
  } catch (error) {
    console.error(`❌ 이미지 메타데이터 추출 실패 (${imageUrl}):`, error);
    return {
      fileSize: 0,
      format: 'unknown',
      width: 0,
      height: 0,
      pixelCount: 0,
      compressionRatio: 0,
      aspectRatio: 0
    };
  }
};

// 유사 이미지 감지 (메타데이터 기반)
const findSimilarImages = async (images) => {
  const similarGroups = [];
  const processedImages = [];
  
  // 모든 이미지의 메타데이터 추출
  for (const image of images) {
    const metadata = await extractImageMetadata(image.url);
    processedImages.push({
      ...image,
      metadata
    });
  }
  
  // 유사성 그룹화
  for (let i = 0; i < processedImages.length; i++) {
    const currentImage = processedImages[i];
    if (currentImage.processed) continue;
    
    const similarGroup = [currentImage];
    currentImage.processed = true;
    
    for (let j = i + 1; j < processedImages.length; j++) {
      const compareImage = processedImages[j];
      if (compareImage.processed) continue;
      
      // 유사성 점수 계산
      const similarityScore = calculateSimilarityScore(currentImage.metadata, compareImage.metadata);
      
      // 유사도 임계값 (70% 이상)
      if (similarityScore >= 0.7) {
        similarGroup.push(compareImage);
        compareImage.processed = true;
      }
    }
    
    // 2개 이상의 유사 이미지가 있는 그룹만 추가
    if (similarGroup.length > 1) {
      similarGroups.push({
        groupId: `similar_${i}`,
        count: similarGroup.length,
        images: similarGroup,
        similarityScore: calculateGroupSimilarityScore(similarGroup)
      });
    }
  }
  
  return similarGroups.sort((a, b) => b.count - a.count);
};

// 유사성 점수 계산
const calculateSimilarityScore = (metadata1, metadata2) => {
  let score = 0;
  let factors = 0;
  
  // 크기 유사성 (30% 가중치)
  if (metadata1.width > 0 && metadata2.width > 0) {
    const widthSimilarity = 1 - Math.abs(metadata1.width - metadata2.width) / Math.max(metadata1.width, metadata2.width);
    const heightSimilarity = 1 - Math.abs(metadata1.height - metadata2.height) / Math.max(metadata1.height, metadata2.height);
    score += (widthSimilarity + heightSimilarity) / 2 * 0.3;
    factors += 0.3;
  }
  
  // 종횡비 유사성 (20% 가중치)
  if (metadata1.aspectRatio > 0 && metadata2.aspectRatio > 0) {
    const aspectSimilarity = 1 - Math.abs(metadata1.aspectRatio - metadata2.aspectRatio) / Math.max(metadata1.aspectRatio, metadata2.aspectRatio);
    score += aspectSimilarity * 0.2;
    factors += 0.2;
  }
  
  // 파일 크기 유사성 (20% 가중치)
  if (metadata1.fileSize > 0 && metadata2.fileSize > 0) {
    const sizeSimilarity = 1 - Math.abs(metadata1.fileSize - metadata2.fileSize) / Math.max(metadata1.fileSize, metadata2.fileSize);
    score += sizeSimilarity * 0.2;
    factors += 0.2;
  }
  
  // 압축률 유사성 (15% 가중치)
  if (metadata1.compressionRatio > 0 && metadata2.compressionRatio > 0) {
    const compressionSimilarity = 1 - Math.abs(metadata1.compressionRatio - metadata2.compressionRatio) / Math.max(metadata1.compressionRatio, metadata2.compressionRatio);
    score += compressionSimilarity * 0.15;
    factors += 0.15;
  }
  
  // 형식 유사성 (15% 가중치)
  const formatSimilarity = metadata1.format === metadata2.format ? 1 : 0.5; // 같은 형식이면 1, 다르면 0.5
  score += formatSimilarity * 0.15;
  factors += 0.15;
  
  return factors > 0 ? score / factors : 0;
};

// 그룹 유사성 점수 계산
const calculateGroupSimilarityScore = (group) => {
  if (group.length < 2) return 1;
  
  let totalScore = 0;
  let comparisons = 0;
  
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      totalScore += calculateSimilarityScore(group[i].metadata, group[j].metadata);
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalScore / comparisons : 0;
};

export default async function handler(req, res) {
  console.log('🔍 유사 이미지 찾기 API 요청:', req.method, req.url);

  try {
    if (req.method === 'GET') {
      // 모든 이미지 목록 조회
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: 1000,
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

      // 이미지 URL 생성
      const imagesWithUrl = files.map(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl
        };
      });

      // 유사 이미지 찾기
      const similarGroups = await findSimilarImages(imagesWithUrl);
      
      console.log('✅ 유사 이미지 분석 완료:', similarGroups.length, '개 그룹');
      
      return res.status(200).json({
        similarGroups,
        totalGroups: similarGroups.length,
        totalSimilarImages: similarGroups.reduce((sum, group) => sum + group.count, 0),
        summary: {
          highSimilarity: similarGroups.filter(g => g.similarityScore >= 0.8).length,
          mediumSimilarity: similarGroups.filter(g => g.similarityScore >= 0.7 && g.similarityScore < 0.8).length,
          lowSimilarity: similarGroups.filter(g => g.similarityScore < 0.7).length
        }
      });

    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }

  } catch (error) {
    console.error('❌ 유사 이미지 찾기 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
