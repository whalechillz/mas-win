/**
 * 캘린더 데이터 저장 API
 * Supabase 데이터베이스에 저장 (로컬/배포 모두 동기화)
 */

import { createServerSupabase } from '../../../lib/supabase';

/**
 * URL 정규화 (쿼리 파라미터 제거, 디코딩)
 */
function normalizeImageUrl(url) {
  if (!url) return null;
  // 쿼리 파라미터와 해시 제거
  const cleanUrl = url.split('?')[0].split('#')[0];
  // URL 디코딩
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
  // Supabase Storage URL 형식: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * 이미지 메타데이터 찾기 (다중 방법 시도)
 */
async function findImageMetadata(supabase, imageUrl) {
  // 1. 정규화된 URL로 정확히 일치하는 경우
  const normalizedUrl = normalizeImageUrl(imageUrl);
  let { data: metadata } = await supabase
    .from('image_metadata')
    .select('id, usage_count, used_in')
    .eq('image_url', normalizedUrl)
    .maybeSingle();
  
  if (metadata) {
    return metadata;
  }
  
  // 2. 원본 URL로도 시도
  if (imageUrl !== normalizedUrl) {
    const { data: metadata2 } = await supabase
      .from('image_metadata')
      .select('id, usage_count, used_in')
      .eq('image_url', imageUrl)
      .maybeSingle();
    
    if (metadata2) {
      return metadata2;
    }
  }
  
  // 3. Storage 경로 추출 후 image_assets를 통해 찾기
  const storagePath = extractStoragePath(imageUrl);
  if (storagePath) {
    // image_assets에서 파일 경로로 찾기
    const { data: asset } = await supabase
      .from('image_assets')
      .select('id, file_path, cdn_url')
      .or(`file_path.eq.${storagePath},cdn_url.eq.${normalizedUrl},cdn_url.eq.${imageUrl}`)
      .maybeSingle();
    
    if (asset) {
      // image_assets의 cdn_url로 image_metadata 찾기
      const { data: metadata3 } = await supabase
        .from('image_metadata')
        .select('id, usage_count, used_in')
        .eq('image_url', asset.cdn_url || asset.file_path)
        .maybeSingle();
      
      if (metadata3) {
        return metadata3;
      }
      
      // image_metadata가 없으면 생성
      const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images';
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicUrl = asset.cdn_url || `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
      
      const { data: newMetadata, error: createError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: publicUrl,
          title: storagePath.split('/').pop().replace(/\.[^/.]+$/, ''),
          upload_source: 'auto_created',
          status: 'active',
          usage_count: 0,
          used_in: []
        })
        .select('id, usage_count, used_in')
        .single();
      
      if (!createError && newMetadata) {
        return newMetadata;
      }
    }
  }
  
  // 4. 파일명으로 검색 (마지막 수단)
  const fileName = imageUrl.split('/').pop().split('?')[0];
  if (fileName) {
    const { data: metadataList } = await supabase
      .from('image_metadata')
      .select('id, usage_count, used_in, image_url')
      .ilike('image_url', `%${fileName}%`)
      .limit(5);
    
    if (metadataList && metadataList.length > 0) {
      // 파일명이 정확히 일치하는 것 우선
      const exactMatch = metadataList.find(m => m.image_url.includes(fileName));
      if (exactMatch) {
        return exactMatch;
      }
      // 첫 번째 결과 반환
      return metadataList[0];
    }
  }
  
  return null;
}

/**
 * 배포 완료 시 이미지 사용 기록 업데이트
 */
async function updateImageUsageOnPublish(calendarData) {
  const supabase = createServerSupabase();
  // 이미지 URL과 사용 위치 정보를 함께 저장
  const imageUsageMap = new Map(); // imageUrl -> [{ type, title, url, date, account, ... }]
  
  // 프로필 콘텐츠 이미지 수집 (배포 완료된 항목만)
  if (calendarData.profileContent) {
    for (const accountKey of ['account1', 'account2']) {
      const accountData = calendarData.profileContent[accountKey];
      if (!accountData?.dailySchedule) continue;
      
      for (const schedule of accountData.dailySchedule) {
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
  
  // 각 이미지 URL에 대해 사용 기록 업데이트
  let updatedCount = 0;
  for (const [imageUrl, usedInEntries] of imageUsageMap.entries()) {
    try {
      // ✅ 개선된 이미지 메타데이터 찾기 (다중 방법 시도)
      const metadata = await findImageMetadata(supabase, imageUrl);
      
      if (metadata) {
        // 기존 used_in 배열 가져오기
        let existingUsedIn = [];
        if (metadata.used_in) {
          try {
            existingUsedIn = Array.isArray(metadata.used_in) ? metadata.used_in : JSON.parse(metadata.used_in);
          } catch (e) {
            existingUsedIn = [];
          }
        }
        
        // 중복 제거: 같은 type, date, account 조합이 이미 있으면 추가하지 않음
        const existingKeys = new Set(
          existingUsedIn.map((u) => `${u.type}-${u.date}-${u.account || ''}`)
        );
        
        const newEntries = usedInEntries.filter((entry) => {
          const key = `${entry.type}-${entry.date}-${entry.account || ''}`;
          return !existingKeys.has(key);
        });
        
        // 새로운 항목만 추가
        const updatedUsedIn = [...existingUsedIn, ...newEntries];
        
        // ✅ usage_count를 used_in 배열의 실제 길이로 설정 (더 정확함)
        const newUsageCount = updatedUsedIn.length;
        
        await supabase
          .from('image_metadata')
          .update({
            usage_count: newUsageCount,
            used_in: updatedUsedIn,
            last_used_at: new Date().toISOString()
          })
          .eq('id', metadata.id);
        
        if (newEntries.length > 0) {
          updatedCount++;
        }
      } else {
        console.warn(`⚠️ 이미지 메타데이터를 찾을 수 없음: ${imageUrl.substring(0, 100)}...`);
      }
      
      // image_assets 테이블도 업데이트 (있는 경우)
      const storagePath = extractStoragePath(imageUrl);
      if (storagePath) {
        const { data: asset } = await supabase
          .from('image_assets')
          .select('id, usage_count')
          .or(`file_path.eq.${storagePath},cdn_url.ilike.%${storagePath.split('/').pop()}%`)
          .maybeSingle();
        
        if (asset) {
          await supabase
            .from('image_assets')
            .update({
              usage_count: (asset.usage_count || 0) + usedInEntries.length,
              last_used_at: new Date().toISOString()
            })
            .eq('id', asset.id);
        }
      }
    } catch (error) {
      console.warn(`⚠️ 이미지 사용 기록 업데이트 실패 (${imageUrl}):`, error.message);
    }
  }
  
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
    const { month, calendarData } = req.body;

    if (!month || !calendarData) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다' 
      });
    }

    const supabase = createServerSupabase();
    let savedCount = 0;
    let errors = [];

    // ✅ 배치 처리로 변경: 프로필 콘텐츠 저장
    if (calendarData.profileContent) {
      const profileRecords = [];
      
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (!accountData || !accountData.dailySchedule) continue;

        for (const schedule of accountData.dailySchedule) {
          profileRecords.push({
            date: schedule.date,
            account: accountKey,
            background_image_url: schedule.background?.imageUrl || null,
            background_prompt: schedule.background?.prompt || null,
            background_base_prompt: schedule.background?.basePrompt || null,
            background_image: schedule.background?.image || null,
            profile_image_url: schedule.profile?.imageUrl || null,
            profile_prompt: schedule.profile?.prompt || null,
            profile_base_prompt: schedule.profile?.basePrompt || null,
            profile_image: schedule.profile?.image || null,
            message: schedule.message || null,
            status: schedule.status || 'planned',
            created: schedule.created || false,
            published_at: schedule.publishedAt || null
          });
        }
      }

      // 배치로 한 번에 저장
      if (profileRecords.length > 0) {
        try {
          const { error, data } = await supabase
            .from('kakao_profile_content')
            .upsert(profileRecords, {
              onConflict: 'date,account',
              ignoreDuplicates: false
            });

          if (error) {
            console.error('프로필 배치 저장 오류:', error);
            // 개별 항목별로 에러 처리 (어떤 항목이 실패했는지 알 수 없으므로 전체 실패로 처리)
            errors.push({ 
              type: 'profile', 
              error: error.message,
              details: error,
              count: profileRecords.length
            });
          } else {
            savedCount += profileRecords.length;
            console.log(`✅ 프로필 콘텐츠 배치 저장 완료: ${profileRecords.length}개`);
          }
        } catch (error) {
          console.error('프로필 배치 저장 처리 오류:', error);
          errors.push({ type: 'profile', error: error.message, count: profileRecords.length });
        }
      }
    }

    // ✅ 배치 처리로 변경: 피드 콘텐츠 저장
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      const feedRecords = [];
      
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (!feedData) continue;

          feedRecords.push({
            date: feed.date,
            account: accountKey,
            image_category: feedData.imageCategory || null,
            image_prompt: feedData.imagePrompt || null,
            base_prompt: feedData.basePrompt || null,
            caption: feedData.caption || null,
            image_url: feedData.imageUrl || null,
            url: feedData.url || null,
            status: feedData.status || 'planned',
            created: feedData.created || false
          });
        }
      }

      // 배치로 한 번에 저장
      if (feedRecords.length > 0) {
        try {
          const { error, data } = await supabase
            .from('kakao_feed_content')
            .upsert(feedRecords, {
              onConflict: 'date,account',
              ignoreDuplicates: false
            });

          if (error) {
            console.error('피드 배치 저장 오류:', error);
            errors.push({ 
              type: 'feed', 
              error: error.message,
              details: error,
              count: feedRecords.length
            });
          } else {
            savedCount += feedRecords.length;
            console.log(`✅ 피드 콘텐츠 배치 저장 완료: ${feedRecords.length}개`);
          }
        } catch (error) {
          console.error('피드 배치 저장 처리 오류:', error);
          errors.push({ type: 'feed', error: error.message, count: feedRecords.length });
        }
      }
    }

    // ✅ 이미지 사용 기록 업데이트는 별도 API로 분리 (비동기 처리)
    // 클라이언트에서 별도로 호출하도록 변경

    // 부분 성공도 허용 (일부 실패가 있어도 성공한 항목은 저장됨)
    if (errors.length > 0) {
      // 성공한 항목이 있으면 부분 성공으로 처리
      if (savedCount > 0) {
        return res.status(200).json({
          success: true,
          message: `캘린더 데이터 저장 완료 (${savedCount}개 성공, ${errors.length}개 실패)`,
          savedCount,
          errors,
          partialSuccess: true
        });
      } else {
        // 모두 실패한 경우만 에러로 처리
        return res.status(500).json({
          success: false,
          message: `데이터 저장 실패 (${errors.length}개 실패)`,
          errors,
          savedCount: 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `캘린더 데이터 저장 완료 (${savedCount}개 항목)`,
      savedCount
    });

  } catch (error) {
    console.error('캘린더 데이터 저장 오류:', error);
    return res.status(500).json({
      success: false,
      message: '저장 실패',
      error: error.message
    });
  }
}

