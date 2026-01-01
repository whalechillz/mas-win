/**
 * Supabase에서 카카오톡 캘린더 데이터 로드
 * 월별 데이터를 가져와서 기존 JSON 형식으로 변환
 */

import { createServerSupabase } from '../../../lib/supabase';

// 이미지 존재 여부 확인 함수 (HTTP HEAD 요청만 사용 - 가장 간단하고 확실함)
async function checkImageExists(supabase, imageUrl) {
  if (!imageUrl) return false;
  
  try {
    // HTTP HEAD 요청으로 실제 파일 존재 여부 확인
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // ✅ 5초 → 2초로 단축 (성능 향상)
    
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return response.ok; // 200-299 상태 코드면 true
  } catch (error) {
    // 타임아웃이나 네트워크 오류 시 false 반환 (로그 생략하여 성능 향상)
    return false;
  }
}

// 폴더의 이미지 개수 조회 함수
async function getImageCount(supabase, date, account, type) {
  try {
    const accountFolder = account === 'account1' ? 'account1' : 'account2';
    const folderPath = `originals/daily-branding/kakao/${date}/${accountFolder}/${type}`;
    
    const { data: files } = await supabase.storage
      .from('blog-images')
      .list(folderPath, { limit: 100 });
    
    if (!files) return 0;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });
    
    return imageFiles.length;
  } catch (error) {
    // 에러 발생 시 0 반환 (치명적이지 않음)
    return 0;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // ✅ 타임아웃 감지 및 부분 결과 반환을 위한 시작 시간
  const startTime = Date.now();
  const TIMEOUT_WARNING_MS = 80000; // 80초 경고
  const TIMEOUT_PARTIAL_MS = 85000; // 85초 부분 결과 반환

  try {
    const { month, skipImageCheck = 'false' } = req.query; // YYYY-MM 형식, skipImageCheck 파라미터 추가
    let shouldSkipImageCheck = skipImageCheck === 'true'; // ✅ 이미지 확인 스킵 옵션 (let으로 변경하여 타임아웃 시 재할당 가능)

    if (!month) {
      return res.status(400).json({ 
        success: false, 
        message: 'month 파라미터가 필요합니다 (YYYY-MM 형식)' 
      });
    }

    const supabase = createServerSupabase();

    // 프로필 콘텐츠 로드
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .gte('date', `${month}-01`)
      .lt('date', getNextMonth(month))
      .order('date', { ascending: true })
      .order('account', { ascending: true });

    if (profileError) {
      console.error('프로필 데이터 로드 오류:', profileError);
      throw profileError;
    }

    // 피드 콘텐츠 로드
    const { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('*')
      .gte('date', `${month}-01`)
      .lt('date', getNextMonth(month))
      .order('date', { ascending: true })
      .order('account', { ascending: true });

    if (feedError) {
      console.error('피드 데이터 로드 오류:', feedError);
      throw feedError;
    }

    // JSON 형식으로 변환
    const calendarData = {
      month,
      profileContent: {
        account1: {
          account: '010-6669-9000',
          name: 'MAS GOLF ProWhale',
          persona: '시니어 중심 감성형 브랜딩',
          tone: '따뜻한 톤 (골드·브라운)',
          dailySchedule: []
        },
        account2: {
          account: '010-5704-0013',
          name: 'MASGOLF Tech',
          persona: '하이테크 중심 혁신형 브랜딩',
          tone: '블랙톤 젊은 매너',
          dailySchedule: []
        }
      },
      kakaoFeed: {
        dailySchedule: []
      }
    };

    // 프로필 데이터 변환 (이미지 존재 여부 확인 - 선택적 수행)
    const profileByDate = {};
    
    // ✅ 이미지 존재 확인 (skipImageCheck가 false일 때만)
    let profileImageMap = new Map();
    if (!shouldSkipImageCheck) {
      // 모든 이미지 URL 수집 및 병렬 확인
      const profileImageChecks = [];
      for (const item of profileData) {
        if (!profileByDate[item.date]) {
          profileByDate[item.date] = { account1: null, account2: null };
        }
        
        if (item.background_image_url) {
          profileImageChecks.push({
            key: `${item.date}_${item.account}_background`,
            url: item.background_image_url
          });
        }
        
        if (item.profile_image_url) {
          profileImageChecks.push({
            key: `${item.date}_${item.account}_profile`,
            url: item.profile_image_url
          });
        }
      }
      
      // 타임아웃 체크
      const elapsed = Date.now() - startTime;
      if (elapsed > TIMEOUT_WARNING_MS) {
        console.warn(`[TIMING] ⚠️ 타임아웃 경고: ${elapsed}ms 경과, 이미지 확인 스킵`);
        shouldSkipImageCheck = true; // 이미지 확인 스킵으로 전환
      } else {
        // 모든 이미지 확인을 병렬로 실행
        const profileImageResults = await Promise.all(
          profileImageChecks.map(async ({ key, url }) => ({
            key,
            exists: await checkImageExists(supabase, url),
            url
          }))
        );
        
        // 결과를 Map으로 변환하여 빠른 조회
        profileImageMap = new Map(
          profileImageResults.map(r => [r.key, r.exists ? r.url : undefined])
        );
      }
    }
    
    // profileByDate 초기화 (이미지 확인을 스킵한 경우)
    if (shouldSkipImageCheck) {
      for (const item of profileData) {
        if (!profileByDate[item.date]) {
          profileByDate[item.date] = { account1: null, account2: null };
        }
      }
    }
    
    // ✅ 이미지 개수 조회를 배치 처리로 변경 (모든 날짜/계정/타입을 한 번에 조회)
    const imageCountPromises = [];
    const imageCountKeys = [];
    for (const item of profileData) {
      imageCountKeys.push(`${item.date}_${item.account}_background`);
      imageCountPromises.push(getImageCount(supabase, item.date, item.account, 'background'));
      imageCountKeys.push(`${item.date}_${item.account}_profile`);
      imageCountPromises.push(getImageCount(supabase, item.date, item.account, 'profile'));
    }
    
    // 타임아웃 체크
    let imageCounts = [];
    const elapsedBeforeCount = Date.now() - startTime;
    if (elapsedBeforeCount < TIMEOUT_PARTIAL_MS) {
      imageCounts = await Promise.all(imageCountPromises);
    } else {
      // 타임아웃 임박 시 기본값 사용
      imageCounts = new Array(imageCountPromises.length).fill(0);
      console.warn(`[TIMING] ⚠️ 타임아웃 임박: 이미지 개수 조회 스킵, 기본값(0) 사용`);
    }
    
    // 이미지 개수 Map 생성
    const imageCountMap = new Map();
    for (let i = 0; i < imageCountKeys.length; i++) {
      imageCountMap.set(imageCountKeys[i], imageCounts[i]);
    }
    
    // 프로필 데이터 변환 (확인된 결과 사용 + 이미지 개수 조회)
    let countIndex = 0;
    for (const item of profileData) {
      const backgroundKey = `${item.date}_${item.account}_background`;
      const profileKey = `${item.date}_${item.account}_profile`;
      
      // ✅ 이미지 확인 실패 시 원본 URL 사용 (피드와 동일한 로직)
      const checkedBackgroundUrl = profileImageMap.get(backgroundKey);
      const finalBackgroundUrl = checkedBackgroundUrl !== undefined ? checkedBackgroundUrl : item.background_image_url || undefined;
      
      const checkedProfileUrl = profileImageMap.get(profileKey);
      const finalProfileUrl = checkedProfileUrl !== undefined ? checkedProfileUrl : item.profile_image_url || undefined;
      
      // ✅ 이미지 개수 조회 (배치 처리 결과 사용)
      const backgroundCount = imageCountMap.get(backgroundKey) || 0;
      const profileCount = imageCountMap.get(profileKey) || 0;
      
      const scheduleItem = {
        date: item.date,
        background: {
          image: item.background_image || '',
          prompt: item.background_prompt || '',
          basePrompt: item.background_base_prompt || null,
          status: item.status || 'planned',
          imageUrl: finalBackgroundUrl, // ✅ 확인 실패 시에도 원본 URL 사용
          imageCount: backgroundCount // ✅ 이미지 개수 추가
        },
        profile: {
          image: item.profile_image || '',
          prompt: item.profile_prompt || '',
          basePrompt: item.profile_base_prompt || null,
          status: item.status || 'planned',
          imageUrl: finalProfileUrl, // ✅ 확인 실패 시에도 원본 URL 사용
          imageCount: profileCount // ✅ 이미지 개수 추가
        },
        message: item.message || '',
        status: item.status || 'planned',
        created: item.created || false,
        publishedAt: item.published_at || undefined,
        createdAt: item.created_at || undefined
      };

      profileByDate[item.date][item.account] = scheduleItem;
    }

    // account1과 account2로 분리
    Object.keys(profileByDate).forEach(date => {
      if (profileByDate[date].account1) {
        calendarData.profileContent.account1.dailySchedule.push(profileByDate[date].account1);
      }
      if (profileByDate[date].account2) {
        calendarData.profileContent.account2.dailySchedule.push(profileByDate[date].account2);
      }
    });

    // 피드 데이터 변환 (이미지 존재 여부 확인 - 선택적 수행)
    const feedByDate = {};
    
    // ✅ 이미지 존재 확인 (skipImageCheck가 false일 때만)
    let feedImageMap = new Map();
    if (!shouldSkipImageCheck) {
      // 모든 피드 이미지 URL 수집 및 병렬 확인
      const feedImageChecks = [];
      for (const item of feedData) {
        if (!feedByDate[item.date]) {
          feedByDate[item.date] = { date: item.date, account1: null, account2: null };
        }
        
        if (item.image_url) {
          feedImageChecks.push({
            key: `${item.date}_${item.account}`,
            url: item.image_url
          });
        }
      }
      
      // 타임아웃 체크
      const elapsed = Date.now() - startTime;
      if (elapsed > TIMEOUT_WARNING_MS) {
        console.warn(`[TIMING] ⚠️ 타임아웃 경고: ${elapsed}ms 경과, 피드 이미지 확인 스킵`);
        shouldSkipImageCheck = true; // 이미지 확인 스킵으로 전환
      } else {
        // 모든 피드 이미지 확인을 병렬로 실행
        const feedImageResults = await Promise.all(
          feedImageChecks.map(async ({ key, url }) => ({
            key,
            exists: await checkImageExists(supabase, url),
            url
          }))
        );
        
        // 결과를 Map으로 변환하여 빠른 조회
        feedImageMap = new Map(
          feedImageResults.map(r => [r.key, r.exists ? r.url : undefined])
        );
      }
    }
    
    // feedByDate 초기화 (이미지 확인을 스킵한 경우)
    if (shouldSkipImageCheck) {
      for (const item of feedData) {
        if (!feedByDate[item.date]) {
          feedByDate[item.date] = { date: item.date, account1: null, account2: null };
        }
      }
    }
    
    // ✅ 피드 이미지 개수 조회를 배치 처리로 변경
    const feedImageCountPromises = [];
    const feedImageCountKeys = [];
    for (const item of feedData) {
      feedImageCountKeys.push(`${item.date}_${item.account}`);
      feedImageCountPromises.push(getImageCount(supabase, item.date, item.account, 'feed'));
    }
    
    // 타임아웃 체크
    let feedImageCounts = [];
    const elapsedBeforeFeedCount = Date.now() - startTime;
    if (elapsedBeforeFeedCount < TIMEOUT_PARTIAL_MS) {
      feedImageCounts = await Promise.all(feedImageCountPromises);
    } else {
      // 타임아웃 임박 시 기본값 사용
      feedImageCounts = new Array(feedImageCountPromises.length).fill(0);
      console.warn(`[TIMING] ⚠️ 타임아웃 임박: 피드 이미지 개수 조회 스킵, 기본값(0) 사용`);
    }
    
    // 피드 이미지 개수 Map 생성
    const feedImageCountMap = new Map();
    for (let i = 0; i < feedImageCountKeys.length; i++) {
      feedImageCountMap.set(feedImageCountKeys[i], feedImageCounts[i]);
    }
    
    // 피드 데이터 변환 (확인된 결과 사용 + 이미지 개수 조회)
    for (let i = 0; i < feedData.length; i++) {
      const item = feedData[i];
      const feedKey = `${item.date}_${item.account}`;
      
      // 이미지 확인 결과가 없으면 원본 URL 사용 (타임아웃/네트워크 오류 대응)
      const checkedImageUrl = feedImageMap.get(feedKey);
      const finalImageUrl = checkedImageUrl !== undefined ? checkedImageUrl : item.image_url || undefined;
      
      // ✅ 이미지 개수 조회 (배치 처리 결과 사용)
      const feedImageCount = feedImageCountMap.get(feedKey) || 0;
      
      feedByDate[item.date][item.account] = {
        imageCategory: item.image_category || '',
        imagePrompt: item.image_prompt || '',
        basePrompt: item.base_prompt || null, // ✅ base_prompt 추가
        caption: item.caption || '',
        status: item.status || 'planned',
        created: item.created || false,
        imageUrl: finalImageUrl, // ✅ 확인 실패 시에도 원본 URL 사용
        imageCount: feedImageCount, // ✅ 이미지 개수 추가
        url: item.url || undefined,
        createdAt: item.created_at || undefined
      };
    }

    calendarData.kakaoFeed.dailySchedule = Object.values(feedByDate);

    // ✅ 타임아웃 체크 및 부분 결과 반환
    const elapsed = Date.now() - startTime;
    if (elapsed > TIMEOUT_PARTIAL_MS) {
      console.warn(`[TIMING] ⚠️ 타임아웃 임박: ${elapsed}ms 경과, 부분 결과 반환`);
      return res.status(200).json({
        success: true,
        partial: true, // ✅ 부분 결과 표시
        calendarData,
        message: '일부 데이터만 로드되었습니다. 나머지는 기본값으로 표시됩니다.',
        elapsed: elapsed
      });
    }

    return res.status(200).json({
      success: true,
      calendarData,
      elapsed: elapsed
    });

  } catch (error) {
    console.error('캘린더 데이터 로드 오류:', error);
    const elapsed = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      message: '데이터 로드 실패',
      error: error.message,
      elapsed: elapsed
    });
  }
}

// 다음 달 계산 헬퍼 함수
function getNextMonth(month) {
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = monthNum === 12 ? `${year + 1}-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}`;
  return `${nextMonth}-01`;
}

