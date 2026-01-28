/**
 * 이미지 사용 기록 업데이트 API
 * 배포 완료된 카카오 콘텐츠의 이미지 사용 기록을 업데이트
 * 별도 API로 분리하여 타임아웃 방지
 */

import { createServerSupabase } from '../../../lib/supabase';

/**
 * URL 정규화 (쿼리 파라미터 제거, 디코딩)
 */
function normalizeImageUrl(url) {
  if (!url) return null;
  const cleanUrl = url.split('?')[0].split('#')[0];
  try {
    return decodeURIComponent(cleanUrl);
  } catch {
    return cleanUrl;
  }
}

/**
 * Storage URL에서 파일 경로 추출
 */
function extractStoragePath(url) {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * 이미지 메타데이터 찾기 (image_assets 사용)
 */
async function findImageMetadata(supabase, imageUrl) {
  const normalizedUrl = normalizeImageUrl(imageUrl);
  
  // 1. 정규화된 URL로 정확히 일치하는 경우 (가장 빠름)
  const { data: asset } = await supabase
    .from('image_assets')
    .select('id, usage_count')
    .eq('cdn_url', normalizedUrl)
    .maybeSingle();
  
  if (asset) {
    return {
      id: asset.id,
      usage_count: asset.usage_count || 0,
      used_in: null // image_assets에는 used_in이 없음
    };
  }
  
  // 2. 원본 URL로도 시도
  if (imageUrl !== normalizedUrl) {
    const { data: asset2 } = await supabase
      .from('image_assets')
      .select('id, usage_count')
      .eq('cdn_url', imageUrl)
      .maybeSingle();
    
    if (asset2) {
      return {
        id: asset2.id,
        usage_count: asset2.usage_count || 0,
        used_in: null
      };
    }
  }
  
  // 3. Storage 경로로 찾기
  const storagePath = extractStoragePath(imageUrl);
  if (storagePath) {
    const { data: asset3 } = await supabase
      .from('image_assets')
      .select('id, file_path, cdn_url, usage_count')
      .or(`file_path.eq.${storagePath},cdn_url.eq.${normalizedUrl},cdn_url.eq.${imageUrl}`)
      .maybeSingle();
    
    if (asset3) {
      return {
        id: asset3.id,
        usage_count: asset3.usage_count || 0,
        used_in: null
      };
    }
  }
  
  return null;
}

/**
 * 배포 완료된 항목의 이미지만 수집
 */
function collectPublishedImages(calendarData) {
  const imageUsageMap = new Map(); // imageUrl -> [{ type, title, url, date, account, ... }]
  
  // 프로필 콘텐츠 이미지 수집 (배포 완료된 항목만)
  if (calendarData.profileContent) {
    for (const accountKey of ['account1', 'account2']) {
      const accountData = calendarData.profileContent[accountKey];
      if (!accountData?.dailySchedule) continue;
      
      for (const schedule of accountData.dailySchedule) {
        // ✅ 실제 사용하는 기능만: 배포 완료된 항목만
        if (schedule.status === 'published' && schedule.publishedAt) {
          const date = schedule.date;
          
          if (schedule.background?.imageUrl) {
            const imageUrl = schedule.background.imageUrl;
            if (!imageUsageMap.has(imageUrl)) {
              imageUsageMap.set(imageUrl, []);
            }
            imageUsageMap.get(imageUrl).push({
              type: 'kakao_profile',
              title: `카카오 프로필 배경 - ${date}`,
              url: `/admin/kakao-content?date=${date}`,
              date: date,
              account: accountKey,
              isBackground: true,
              isProfile: false,
              created_at: new Date().toISOString()
            });
          }
          
          if (schedule.profile?.imageUrl) {
            const imageUrl = schedule.profile.imageUrl;
            if (!imageUsageMap.has(imageUrl)) {
              imageUsageMap.set(imageUrl, []);
            }
            imageUsageMap.get(imageUrl).push({
              type: 'kakao_profile',
              title: `카카오 프로필 이미지 - ${date}`,
              url: `/admin/kakao-content?date=${date}`,
              date: date,
              account: accountKey,
              isBackground: false,
              isProfile: true,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    }
  }
  
  // 피드 콘텐츠 이미지 수집 (배포 완료된 항목만)
  if (calendarData.kakaoFeed?.dailySchedule) {
    for (const feed of calendarData.kakaoFeed.dailySchedule) {
      const date = feed.date;
      for (const accountKey of ['account1', 'account2']) {
        const feedData = feed[accountKey];
        // ✅ 실제 사용하는 기능만: 배포 완료된 항목만
        if (feedData?.status === 'published' && feedData.imageUrl) {
          const imageUrl = feedData.imageUrl;
          if (!imageUsageMap.has(imageUrl)) {
            imageUsageMap.set(imageUrl, []);
          }
          imageUsageMap.get(imageUrl).push({
            type: 'kakao_feed',
            title: `카카오 피드 - ${date}`,
            url: `/admin/kakao-content?date=${date}`,
            date: date,
            account: accountKey,
            created_at: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return imageUsageMap;
}

/**
 * 배치 처리로 이미지 사용 기록 업데이트
 */
async function updateImageUsageBatch(imageUsageMap) {
  const supabase = createServerSupabase();
  let updatedCount = 0;
  const updatePromises = [];
  
  for (const [imageUrl, usedInEntries] of imageUsageMap.entries()) {
    updatePromises.push(
      (async () => {
        try {
          const metadata = await findImageMetadata(supabase, imageUrl);
          
          if (metadata) {
            // image_assets에는 used_in이 없으므로 usage_count만 업데이트
            const newUsageCount = (metadata.usage_count || 0) + usedInEntries.length;
            
            await supabase
              .from('image_assets')
              .update({
                usage_count: newUsageCount,
                last_used_at: new Date().toISOString()
              })
              .eq('id', metadata.id);
            
            updatedCount++;
          } else {
            console.warn(`⚠️ 이미지 메타데이터를 찾을 수 없음: ${imageUrl.substring(0, 100)}...`);
          }
        } catch (error) {
          console.warn(`⚠️ 이미지 사용 기록 업데이트 실패 (${imageUrl}):`, error.message);
        }
      })()
    );
  }
  
  // 모든 업데이트를 병렬로 실행 (배치 처리)
  await Promise.all(updatePromises);
  
  if (updatedCount > 0) {
    console.log(`✅ ${updatedCount}개 이미지 사용 기록 업데이트 완료`);
  }
  
  return updatedCount;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { calendarData } = req.body;

    if (!calendarData) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다' 
      });
    }

    // ✅ 배포 완료된 항목의 이미지만 수집
    const imageUsageMap = collectPublishedImages(calendarData);
    
    if (imageUsageMap.size === 0) {
      return res.status(200).json({
        success: true,
        message: '업데이트할 이미지가 없습니다',
        updatedCount: 0
      });
    }

    // ✅ 배치 처리로 업데이트
    const updatedCount = await updateImageUsageBatch(imageUsageMap);

    return res.status(200).json({
      success: true,
      message: `이미지 사용 기록 업데이트 완료 (${updatedCount}개)`,
      updatedCount
    });

  } catch (error) {
    console.error('이미지 사용 기록 업데이트 오류:', error);
    return res.status(500).json({
      success: false,
      message: '이미지 사용 기록 업데이트 실패',
      error: error.message
    });
  }
}
