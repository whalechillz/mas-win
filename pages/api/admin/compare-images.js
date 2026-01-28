/**
 * Phase 5-7: 이미지 비교 API
 * 
 * 선택된 2-4개 이미지의 메타데이터를 비교하고, 중복 여부를 판단합니다.
 * Phase 8-9-3: pHash 기반 시각적 유사도 계산 추가
 */

import { createClient } from '@supabase/supabase-js';
// Sharp는 동적 import로 로드 (Vercel 환경 호환성)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 파일명 정규화 (확장자 제외, UUID 제거)
function normalizeFileNameWithoutExt(fileName) {
  if (!fileName) return '';
  
  // UUID 제거 (UUID-파일명 형식)
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const match = fileName.match(uuidPattern);
  const baseName = match ? match[1] : fileName;
  
  // 확장자 제거
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  
  // 소문자 변환 및 특수문자 제거
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// pHash 계산 함수 (Perceptual Hash)
async function calculatePHash(imageBuffer) {
  try {
    // Sharp 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    // 1. 이미지를 32x32 그레이스케일로 리사이즈
    const resized = await sharp(imageBuffer)
      .resize(32, 32, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();

    // 2. DCT (Discrete Cosine Transform) 계산을 위한 평균값 계산
    let sum = 0;
    for (let i = 0; i < resized.length; i++) {
      sum += resized[i];
    }
    const average = sum / resized.length;

    // 3. 평균값 기준으로 해시 생성 (간단한 버전)
    // 실제로는 DCT를 사용하지만, 성능을 위해 간단한 버전 사용
    let hash = 0;
    let hashBits = '';
    
    for (let i = 0; i < resized.length; i++) {
      if (resized[i] >= average) {
        hashBits += '1';
      } else {
        hashBits += '0';
      }
    }

    // 4. 해시를 64비트로 축소 (8x8 그리드)
    const hash64 = [];
    for (let i = 0; i < 64; i++) {
      const bitIndex = Math.floor((i / 64) * hashBits.length);
      hash64.push(hashBits[bitIndex] === '1' ? 1 : 0);
    }

    return hash64.join('');
  } catch (error) {
    console.error('❌ pHash 계산 오류:', error.message);
    return null;
  }
}

// 해밍 거리 계산 (두 pHash 간의 차이)
function calculateHammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return 64; // 최대 거리
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

// pHash 기반 유사도 계산 (0-100%)
function calculatePHashSimilarity(hash1, hash2) {
  if (!hash1 || !hash2) return 0;
  
  const hammingDistance = calculateHammingDistance(hash1, hash2);
  // 64비트 해시에서 해밍 거리를 유사도로 변환
  const similarity = 1 - (hammingDistance / 64);
  return Math.round(similarity * 100);
}

// 이미지 사용 현황 확인
async function checkImageUsage(imageId, filePath, fileName, cdnUrl) {
  try {
    // image-usage-tracker API는 imageUrl을 받으므로, cdn_url 우선 사용
    let imageUrl = cdnUrl;
    
    // cdn_url이 없으면 file_path 또는 fileName 사용
    if (!imageUrl) {
      if (filePath) {
        // file_path가 상대 경로인 경우 Supabase Storage URL로 변환
        if (filePath.startsWith('originals/') || filePath.startsWith('campaigns/')) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const bucketName = 'blog-images';
          imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
        } else {
          imageUrl = filePath;
        }
      } else if (fileName) {
        imageUrl = fileName;
      }
    }

    if (!imageUrl) {
      console.warn(`⚠️ 이미지 URL을 찾을 수 없습니다:`, { imageId, filePath, fileName, cdnUrl });
      return { used: false, usageCount: 0, usedIn: [] };
    }

    // GET 요청으로 imageUrl 전달
    const url = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/image-usage-tracker`);
    url.searchParams.append('imageUrl', imageUrl);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ 이미지 사용 현황 API 응답 실패: ${response.status}`, imageUrl);
      return { used: false, usageCount: 0, usedIn: [] };
    }

    const data = await response.json();
    
    // used_in 배열 구성 (image-usage-tracker API 응답 구조에 맞춤)
    const usedIn = [];
    if (data.usage) {
      if (data.usage.blogPosts && data.usage.blogPosts.length > 0) {
        usedIn.push(...data.usage.blogPosts.map(post => ({
          type: 'blog',
          title: post.title,
          url: post.url,
          isFeatured: post.isFeatured,
          isInContent: post.isInContent
        })));
      }
      if (data.usage.funnelPages && data.usage.funnelPages.length > 0) {
        usedIn.push(...data.usage.funnelPages.map(page => ({
          type: 'funnel',
          title: page.title,
          url: page.url,
          isFeatured: page.isFeatured,
          isInContent: page.isInContent
        })));
      }
      if (data.usage.homepage && data.usage.homepage.length > 0) {
        usedIn.push(...data.usage.homepage.map(item => ({
          type: 'homepage',
          title: item.title,
          url: item.url,
          isFeatured: item.isFeatured,
          isInContent: item.isInContent
        })));
      }
      if (data.usage.muziik && data.usage.muziik.length > 0) {
        usedIn.push(...data.usage.muziik.map(item => ({
          type: 'muziik',
          title: item.title,
          url: item.url,
          isFeatured: item.isFeatured,
          isInContent: item.isInContent
        })));
      }
      // Survey 페이지 추가
      if (data.usage.survey && data.usage.survey.length > 0) {
        usedIn.push(...data.usage.survey.map(item => ({
          type: 'survey',
          title: item.title,
          url: item.url,
          isFeatured: item.isFeatured,
          isInContent: item.isInContent
        })));
      }
      if (data.usage.staticPages && data.usage.staticPages.length > 0) {
        usedIn.push(...data.usage.staticPages.map(page => ({
          type: 'static_page',
          title: page.title,
          url: page.url,
          isFeatured: page.isFeatured,
          isInContent: page.isInContent
        })));
      }
      // 카카오 프로필 콘텐츠 추가
      if (data.usage.kakaoProfile && data.usage.kakaoProfile.length > 0) {
        usedIn.push(...data.usage.kakaoProfile.map(item => ({
          type: 'kakao_profile',
          title: item.title,
          url: item.url,
          date: item.date,
          account: item.account,
          isBackground: item.isBackground,
          isProfile: item.isProfile,
          created_at: item.created_at
        })));
      }
      // 카카오 피드 콘텐츠 추가
      if (data.usage.kakaoFeed && data.usage.kakaoFeed.length > 0) {
        usedIn.push(...data.usage.kakaoFeed.map(item => ({
          type: 'kakao_feed',
          title: item.title,
          url: item.url,
          date: item.date,
          account: item.account,
          created_at: item.created_at
        })));
      }
    }
    
    const total = data.usage?.totalUsage || data.summary?.totalUsage || usedIn.length;
    
    // usedIn 배열에서 중복 제거 (같은 위치에서 여러 번 사용된 경우)
    const uniqueUsedIn = usedIn.filter((item, index, self) => 
      index === self.findIndex(t => t.type === item.type && t.title === item.title)
    );
    
    // 디버깅 로그
    if (total > 0 && uniqueUsedIn.length === 0) {
      console.warn(`⚠️ 사용 횟수(${total})는 있지만 사용 위치 정보가 없습니다.`, {
        imageId,
        filePath,
        fileName,
        imageUrl,
        usage: data.usage
      });
    }
    
    return {
      used: total > 0,
      usageCount: total,
      usedIn: uniqueUsedIn, // 중복 제거된 배열 반환
    };
  } catch (error) {
    console.error(`❌ 이미지 사용 현황 확인 오류:`, error.message);
    return { used: false, usageCount: 0, usedIn: [] };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length < 1 || imageIds.length > 4) {
      return res.status(400).json({
        error: '1-4개의 이미지 ID가 필요합니다',
      });
    }

    console.log(`🔍 이미지 비교 시작: ${imageIds.length}개 이미지`);

    // 이미지 메타데이터 조회
    const { data: images, error: dbError } = await supabase
      .from('image_assets')
      .select('*')
      .in('id', imageIds);

    if (dbError) {
      console.error('❌ DB 이미지 조회 실패:', dbError);
      return res.status(500).json({ error: 'DB 조회 실패', details: dbError.message });
    }

    if (images.length !== imageIds.length) {
      return res.status(404).json({
        error: '일부 이미지를 찾을 수 없습니다',
        requested: imageIds.length,
        found: images.length,
      });
    }

    // 각 이미지의 메타데이터 조회 (tags + used_in 포함)
    const imageMetadataMap = new Map();
    if (images.length > 0) {
      const cdnUrls = images.map(img => img.cdn_url).filter(Boolean);
      if (cdnUrls.length > 0) {
        const { data: metadataList, error: metadataError } = await supabase
          .from('image_assets')
          .select('cdn_url, ai_tags, alt_text, title, description, usage_count')
          .in('cdn_url', cdnUrls);
        
        if (!metadataError && metadataList) {
          metadataList.forEach(meta => {
            // image_metadata 형식으로 변환 (하위 호환성)
            imageMetadataMap.set(meta.cdn_url, {
              image_url: meta.cdn_url,
              tags: meta.ai_tags || [],
              alt_text: meta.alt_text,
              title: meta.title,
              description: meta.description,
              used_in: null, // image_assets에는 used_in이 없음
              usage_count: meta.usage_count || 0
            });
          });
        }
      }
    }

    // 각 이미지의 사용 현황 확인 및 pHash 계산
    const imagesWithUsage = await Promise.all(
      images.map(async (img) => {
        console.log(`🔍 이미지 사용 현황 확인 시작:`, {
          id: img.id,
          filename: img.filename,
          file_path: img.file_path,
          cdn_url: img.cdn_url
        });
        
        // ✅ image_metadata에서 직접 used_in 가져오기 (우선)
        const metadata = imageMetadataMap.get(img.cdn_url);
        let usedIn = [];
        let usageCount = 0;
        
        if (metadata?.used_in) {
          try {
            usedIn = Array.isArray(metadata.used_in) ? metadata.used_in : JSON.parse(metadata.used_in);
            usageCount = usedIn.length > 0 ? usedIn.length : (metadata.usage_count || 0);
            console.log(`✅ image_metadata에서 used_in 발견:`, {
              imageId: img.id,
              usedInCount: usedIn.length,
              usageCount
            });
          } catch (e) {
            console.warn('⚠️ used_in 파싱 실패:', e.message);
            usedIn = [];
          }
        }
        
        // used_in이 없으면 image-usage-tracker API로 조회 (fallback)
        if (usedIn.length === 0) {
          const usage = await checkImageUsage(img.id, img.file_path, img.filename, img.cdn_url);
          usedIn = usage.usedIn || [];
          usageCount = usage.usageCount || 0;
          console.log(`✅ image-usage-tracker API에서 사용 위치 조회:`, {
            imageId: img.id,
            usedInCount: usedIn.length,
            usageCount
          });
        }
        
        // 메타데이터에서 tags 가져오기
        const tags = metadata?.tags || img.ai_tags || [];
        
        console.log(`✅ 이미지 사용 현황 확인 완료:`, {
          id: img.id,
          filename: img.filename,
          used: usedIn.length > 0,
          usageCount: usageCount,
          usedInCount: usedIn.length,
          usedIn: usedIn
        });
        
        // pHash 및 이미지 픽셀 사이즈 계산 (이미지 다운로드 필요)
        let phash = null;
        let width = null;
        let height = null;
        try {
          let imageBuffer = null;
          
          if (img.file_path) {
            // Supabase Storage에서 직접 다운로드 (더 안정적)
            const { data: imageData, error: downloadError } = await supabase.storage
              .from('blog-images')
              .download(img.file_path);
            
            if (!downloadError && imageData) {
              const arrayBuffer = await imageData.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            }
          } else if (img.cdn_url) {
            // 폴백: URL에서 다운로드
            const imageResponse = await fetch(img.cdn_url);
            if (imageResponse.ok) {
              const arrayBuffer = await imageResponse.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            }
          }

          if (imageBuffer) {
            // pHash 계산
            phash = await calculatePHash(imageBuffer);
            
            // 이미지 픽셀 사이즈 추출
            try {
              // Sharp 동적 import (Vercel 환경 호환성)
              const sharp = (await import('sharp')).default;
              const metadata = await sharp(imageBuffer).metadata();
              width = metadata.width;
              height = metadata.height;
            } catch (metaError) {
              console.warn(`⚠️ 이미지 메타데이터 추출 실패 (${img.filename}):`, metaError.message);
            }
          }
        } catch (error) {
          console.warn(`⚠️ 이미지 처리 실패 (${img.filename}):`, error.message);
        }

        const result = {
          ...img,
          tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
          usage: usedIn.length > 0,
          usageCount: usageCount,
          usedIn: usedIn,
          phash,
          width,
          height,
        };
        
        console.log(`📦 최종 이미지 데이터:`, {
          id: result.id,
          filename: result.filename,
          usage: result.usage,
          usageCount: result.usageCount,
          usedInCount: result.usedIn?.length || 0,
          usedIn: result.usedIn
        });
        
        return result;
      })
    );

    // 비교 분석
    console.log(`📊 비교 분석 시작: ${imagesWithUsage.length}개 이미지`);
    imagesWithUsage.forEach((img, idx) => {
      console.log(`  이미지 ${idx + 1}:`, {
        id: img.id,
        filename: img.filename,
        usage: img.usage,
        usageCount: img.usageCount,
        usedInCount: img.usedIn?.length || 0,
        usedIn: img.usedIn
      });
    });
    
    const comparison = {
      images: imagesWithUsage.map(img => {
        const imageData = {
          id: img.id,
          filename: img.filename,
          originalFilename: img.original_filename,
          filePath: img.file_path,
          fileSize: img.file_size,
          width: img.width,
          height: img.height,
          format: img.format,
          cdnUrl: img.cdn_url,
          hashMd5: img.hash_md5,
          hashSha256: img.hash_sha256,
          phash: img.phash,
          altText: img.alt_text,
          title: img.title,
          description: img.description,
          tags: img.tags || img.ai_tags || [],
          aiTags: img.ai_tags,
          usage: img.usage,
          usageCount: img.usageCount,
          usedIn: img.usedIn || [],
        };
        
        console.log(`📤 반환할 이미지 데이터:`, {
          id: imageData.id,
          filename: imageData.filename,
          usage: imageData.usage,
          usageCount: imageData.usageCount,
          usedInCount: imageData.usedIn?.length || 0,
          usedIn: imageData.usedIn
        });
        
        return imageData;
      }),
      analysis: {
        filenameMatch: false,
        normalizedFilenameMatch: false,
        hashMatch: false,
        sizeMatch: false,
        formatMatch: false,
        similarityScore: 0,
        phashSimilarity: 0,
        isDuplicate: false,
        recommendation: '',
      },
    };

    // 1개 이미지인 경우 비교 분석 건너뛰기
    if (imagesWithUsage.length === 1) {
      comparison.analysis.recommendation = '이미지 상세 정보를 확인할 수 있습니다.';
      return res.status(200).json({
        success: true,
        comparison,
      });
    }

    // 파일명 비교
    const filenames = imagesWithUsage.map(img => img.filename);
    const normalizedFilenames = imagesWithUsage.map(img => normalizeFileNameWithoutExt(img.filename));

    comparison.analysis.filenameMatch = new Set(filenames).size === 1;
    comparison.analysis.normalizedFilenameMatch = new Set(normalizedFilenames).size === 1;

    // 해시 비교
    const hashMd5s = imagesWithUsage.map(img => img.hash_md5).filter(Boolean);
    const hashSha256s = imagesWithUsage.map(img => img.hash_sha256).filter(Boolean);

    comparison.analysis.hashMatch = 
      (hashMd5s.length > 0 && new Set(hashMd5s).size === 1) ||
      (hashSha256s.length > 0 && new Set(hashSha256s).size === 1);

    // 파일 크기 비교 (10% 오차 허용)
    const sizes = imagesWithUsage.map(img => img.file_size);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    comparison.analysis.sizeMatch = maxSize - minSize <= minSize * 0.1;

    // 포맷 비교
    const formats = imagesWithUsage.map(img => img.format?.toLowerCase());
    comparison.analysis.formatMatch = new Set(formats).size === 1;

    // 포맷 호환성 확인 (JPG↔WebP, PNG↔WebP 등)
    const hasJpgOrPng = formats.some(f => ['jpg', 'jpeg', 'png'].includes(f));
    const hasWebp = formats.some(f => f === 'webp');
    const hasFormatCompatibility = hasJpgOrPng && hasWebp && formats.length === 2;

    // 유사도 점수 계산 함수
    function calculateSimilarityScore() {
      let score = 0;
      let factors = 0;

      // 1. 파일명 유사도 (40% 가중치)
      if (comparison.analysis.normalizedFilenameMatch) {
        score += 40;
      }
      factors += 40;

      // 2. 해시 유사도 (30% 가중치)
      if (comparison.analysis.hashMatch) {
        score += 30;
      }
      factors += 30;

      // 3. 크기 유사도 (20% 가중치)
      if (comparison.analysis.sizeMatch) {
        score += 20;
      } else if (sizes.length > 0) {
        // 크기 차이에 따른 점수 계산
        const sizeDiff = Math.abs(maxSize - minSize) / minSize;
        if (sizeDiff <= 0.2) {
          score += 15; // 20% 오차 내
        } else if (sizeDiff <= 0.5) {
          score += 10; // 50% 오차 내
        } else if (sizeDiff <= 1.0) {
          score += 5; // 100% 오차 내
        }
      }
      factors += 20;

      // 4. 포맷 호환성 (10% 가중치)
      if (comparison.analysis.formatMatch) {
        score += 10;
      } else if (hasFormatCompatibility) {
        // JPG↔WebP 또는 PNG↔WebP 호환성
        score += 9; // 95% 호환성
      }
      factors += 10;

      return factors > 0 ? Math.round((score / factors) * 100) : 0;
    }

    // pHash 기반 시각적 유사도 계산
    let phashSimilarity = 0;
    if (imagesWithUsage.length === 2 && imagesWithUsage[0].phash && imagesWithUsage[1].phash) {
      phashSimilarity = calculatePHashSimilarity(imagesWithUsage[0].phash, imagesWithUsage[1].phash);
    } else if (imagesWithUsage.length >= 3) {
      // 3개 이상 이미지인 경우 평균 유사도 계산
      const similarities = [];
      // 모든 이미지 쌍의 유사도 계산
      for (let i = 0; i < imagesWithUsage.length; i++) {
        for (let j = i + 1; j < imagesWithUsage.length; j++) {
          if (imagesWithUsage[i].phash && imagesWithUsage[j].phash) {
            similarities.push(calculatePHashSimilarity(imagesWithUsage[i].phash, imagesWithUsage[j].phash));
          }
        }
      }
      if (similarities.length > 0) {
        phashSimilarity = Math.round(similarities.reduce((a, b) => a + b, 0) / similarities.length);
      }
    }
    comparison.analysis.phashSimilarity = phashSimilarity;

    // 유사도 점수 계산 (pHash 포함)
    const baseSimilarityScore = calculateSimilarityScore();
    
    // pHash 유사도를 종합 유사도에 반영 (30% 가중치 추가)
    let finalSimilarityScore = baseSimilarityScore;
    if (phashSimilarity > 0) {
      // pHash 유사도가 있으면 종합 점수에 반영
      finalSimilarityScore = Math.round((baseSimilarityScore * 0.7) + (phashSimilarity * 0.3));
    }
    
    comparison.analysis.similarityScore = finalSimilarityScore;

    // 중복 여부 판단 (개선된 로직 - 일관성 있게)
    // 확장자만 다른 경우는 유사도가 높아야 중복으로 판단
    const isFormatCompatibleDuplicate = comparison.analysis.normalizedFilenameMatch && hasFormatCompatibility;
    const formatCompatibleScore = isFormatCompatibleDuplicate ? (phashSimilarity > 0 ? phashSimilarity : 85) : 0;
    
    comparison.analysis.isDuplicate =
      comparison.analysis.hashMatch || // 해시가 같으면 중복
      (comparison.analysis.normalizedFilenameMatch && comparison.analysis.sizeMatch && finalSimilarityScore >= 60) || // 파일명, 크기, 유사도 모두 확인
      (isFormatCompatibleDuplicate && (formatCompatibleScore >= 70 || finalSimilarityScore >= 70)) || // 확장자만 다른 경우 pHash 또는 종합 유사도 확인
      (finalSimilarityScore >= 80) || // 종합 유사도 80% 이상
      (phashSimilarity >= 85); // pHash 유사도 85% 이상

    // 추천 사항
    if (comparison.analysis.isDuplicate) {
      // 사용 중인 이미지 확인
      const usedImages = imagesWithUsage.filter(img => img.usage);
      const unusedImages = imagesWithUsage.filter(img => !img.usage);

      if (usedImages.length > 0 && unusedImages.length > 0) {
        // 사용 중인 이미지는 보존, 사용하지 않는 이미지는 삭제 가능
        comparison.analysis.recommendation = `사용 중인 ${usedImages.length}개 이미지는 보존하고, 사용하지 않는 ${unusedImages.length}개 이미지는 삭제할 수 있습니다.`;
      } else if (unusedImages.length > 1) {
        // 모두 사용하지 않으면 하나만 남기고 나머지 삭제 가능
        comparison.analysis.recommendation = `모두 사용하지 않는 이미지입니다. 하나만 남기고 나머지는 삭제할 수 있습니다.`;
      } else {
        // 모두 사용 중이면 삭제 불가
        comparison.analysis.recommendation = `모두 사용 중인 이미지입니다. 삭제할 수 없습니다.`;
      }

      // WebP 우선 정책
      const webpImages = imagesWithUsage.filter(img => img.format === 'webp');
      const jpgImages = imagesWithUsage.filter(img => ['jpg', 'jpeg'].includes(img.format?.toLowerCase()));

      if (webpImages.length > 0 && jpgImages.length > 0) {
        const unusedJpg = jpgImages.filter(img => !img.usage);
        if (unusedJpg.length > 0) {
          comparison.analysis.recommendation += ` WebP 우선 정책에 따라 사용하지 않는 JPG(${unusedJpg.length}개)는 삭제할 수 있습니다.`;
        }
      }
    } else {
      // 유사도 점수에 따른 추천
      if (finalSimilarityScore >= 80) {
        comparison.analysis.recommendation = `유사도 ${finalSimilarityScore}%로 중복 가능성이 높습니다. 시각적 비교를 권장합니다.`;
      } else if (finalSimilarityScore >= 60) {
        comparison.analysis.recommendation = `유사도 ${finalSimilarityScore}%로 일부 유사성이 있습니다. 필요시 시각적 비교를 권장합니다.`;
      } else {
        comparison.analysis.recommendation = `유사도 ${finalSimilarityScore}%로 중복 이미지가 아닙니다. 모두 보존하는 것을 권장합니다.`;
      }
    }

    return res.status(200).json({
      success: true,
      comparison,
      message: '이미지 비교 완료',
    });
  } catch (error) {
    console.error('❌ 이미지 비교 오류:', error);
    return res.status(500).json({
      error: '이미지 비교 실패',
      details: error.message,
    });
  }
}

