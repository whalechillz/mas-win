// pages/api/kakao-content/auto-create-account1.js
// Account 1 (대표폰) 자동 생성 API
// Supabase 기반으로 전환

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const supabase = createServerSupabase();
    const monthStr = date.substring(0, 7); // YYYY-MM

    // Supabase에서 해당 날짜의 데이터 로드
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .eq('date', date)
      .eq('account', 'account1')
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('프로필 데이터 로드 오류:', profileError);
      throw profileError;
    }

    // 날짜가 없으면 기본 구조 생성
    let dateData = profileData || {
      date,
      account: 'account1',
      background_image: null,
      background_prompt: null,
      background_base_prompt: null,
      background_image_url: null,
      profile_image: null,
      profile_prompt: null,
      profile_base_prompt: null,
      profile_image_url: null,
      message: '',
      status: 'planned',
      created: false
    };

    // 피드 데이터 로드
    let { data: feedData, error: feedError } = await supabase
      .from('kakao_feed_content')
      .select('*')
      .eq('date', date)
      .eq('account', 'account1')
      .single();

    if (feedError && feedError.code !== 'PGRST116') {
      console.error('피드 데이터 로드 오류:', feedError);
      throw feedError;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const results = {
      background: { success: false, imageUrl: null, error: null },
      profile: { success: false, imageUrl: null, error: null },
      feed: { success: false, imageUrl: null, error: null }
    };

    // Self-Adaptive Automation: weeklyTheme 자동 감지
    // 1순위: Supabase에서 주차별 테마 가져오기 시도
    let weeklyTheme = '비거리의 감성 – 스윙과 마음의 연결'; // 기본값
    
    try {
      // 캘린더 데이터에서 주차별 테마 가져오기
      const { data: calendarData } = await supabase
        .from('kakao_calendar')
        .select('profile_content')
        .eq('month', monthStr)
        .single();
      
      if (calendarData?.profile_content?.account1?.weeklyThemes) {
        const themes = calendarData.profile_content.account1.weeklyThemes;
        const weekNumber = Math.ceil(new Date(date).getDate() / 7);
        const weekKey = `week${Math.min(weekNumber, 4)}`;
        weeklyTheme = themes[weekKey] || themes.week1 || weeklyTheme;
      }
    } catch (error) {
      console.log('⚠️ weeklyTheme 자동 감지 실패, 기본값 사용:', error.message);
    }

    // 배경 이미지 생성
    if (!dateData.background_image_url) {
      try {
        const bgPrompt = dateData.background_prompt || dateData.background_image || '절경 골프장 배경';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: bgPrompt,
            accountType: 'account1',
            type: 'background',
            brandStrategy: {
              customerpersona: 'senior_fitting',
              customerChannel: 'local_customers',
              brandWeight: '높음',
              audienceTemperature: 'warm',
              audienceWeight: '높음'
            },
            weeklyTheme,
            date
          })
        });

        const promptData = await promptResponse.json();
        if (!promptData.success) {
          throw new Error('프롬프트 생성 실패');
        }

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account1',
              type: 'background',
              date,
              message: dateData.message || ''
            }
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.imageUrls && imageData.imageUrls.length > 0) {
            results.background.success = true;
            results.background.imageUrl = imageData.imageUrls[0];
            dateData.background_image_url = imageData.imageUrls[0];
            dateData.background_prompt = imageData.generatedPrompts?.[0] || promptData.prompt;
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          results.background.error = errorData.error || `HTTP ${imageResponse.status}`;
        }
      } catch (error) {
        results.background.error = error.message;
        console.error('배경 이미지 생성 에러:', error);
      }
    } else {
      results.background.success = true;
      results.background.imageUrl = dateData.background_image_url;
    }

    // 프로필 이미지 생성
    if (!dateData.profile_image_url) {
      try {
        const profilePrompt = dateData.profile_prompt || dateData.profile_image || '시니어 골퍼';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: profilePrompt,
            accountType: 'account1',
            type: 'profile',
            brandStrategy: {
              customerpersona: 'senior_fitting',
              customerChannel: 'local_customers',
              brandWeight: '높음',
              audienceTemperature: 'warm',
              audienceWeight: '높음'
            },
            weeklyTheme,
            date
          })
        });

        const promptData = await promptResponse.json();
        if (!promptData.success) {
          throw new Error('프롬프트 생성 실패');
        }

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account1',
              type: 'profile',
              date,
              message: dateData.message || ''
            }
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.imageUrls && imageData.imageUrls.length > 0) {
            results.profile.success = true;
            results.profile.imageUrl = imageData.imageUrls[0];
            dateData.profile_image_url = imageData.imageUrls[0];
            dateData.profile_prompt = imageData.generatedPrompts?.[0] || promptData.prompt;
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          results.profile.error = errorData.error || `HTTP ${imageResponse.status}`;
        }
      } catch (error) {
        results.profile.error = error.message;
        console.error('프로필 이미지 생성 에러:', error);
      }
    } else {
      results.profile.success = true;
      results.profile.imageUrl = dateData.profile_image_url;
    }

    // 피드 이미지 생성
    if (feedData && !feedData.image_url) {
      try {
        const feedPrompt = feedData.image_prompt || feedData.image_category || '시니어 골퍼의 스윙';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: feedPrompt,
            accountType: 'account1',
            type: 'feed',
            brandStrategy: {
              customerpersona: 'senior_fitting',
              customerChannel: 'local_customers',
              brandWeight: '중간',
              audienceTemperature: 'warm'
            },
            weeklyTheme,
            date
          })
        });

        const promptData = await promptResponse.json();
        if (!promptData.success) {
          throw new Error('프롬프트 생성 실패');
        }

        // 피드 캡션 생성 (기존 캡션이 없거나 재생성 요청 시)
        let feedCaption = feedData.caption;
        if (!feedCaption || feedCaption.trim().length === 0) {
          try {
            const captionResponse = await fetch(`${baseUrl}/api/kakao-content/generate-feed-caption`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageCategory: feedData.image_category || '시니어 골퍼의 스윙',
                accountType: 'account1',
                weeklyTheme,
                date,
                existingCaption: feedData.caption
              })
            });

            const captionData = await captionResponse.json();
            if (captionData.success && captionData.caption) {
              feedCaption = captionData.caption;
              console.log(`✅ 피드 캡션 생성 완료: ${feedCaption}`);
            }
          } catch (captionError) {
            console.warn('⚠️ 피드 캡션 생성 실패, 기존 캡션 사용:', captionError.message);
          }
        }

        // URL 자동 선택
        const { getFeedUrl } = require('../../lib/kakao-feed-url-selector');
        const selectedUrl = getFeedUrl(
          feedData.image_category || '시니어 골퍼의 스윙',
          'account1',
          date
        );

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account1',
              type: 'feed',
              date,
              message: feedCaption || ''
            }
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.imageUrls && imageData.imageUrls.length > 0) {
            results.feed.success = true;
            results.feed.imageUrl = imageData.imageUrls[0];
            
            // 피드 데이터 업데이트
            feedData.image_url = imageData.imageUrls[0];
            feedData.image_prompt = imageData.generatedPrompts?.[0] || promptData.prompt;
            feedData.caption = feedCaption || feedData.caption || '';
            feedData.url = selectedUrl;
            feedData.created = true;
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          results.feed.error = errorData.error || `HTTP ${imageResponse.status}`;
        }
      } catch (error) {
        results.feed.error = error.message;
        console.error('피드 이미지 생성 에러:', error);
      }
    } else if (feedData?.image_url) {
      results.feed.success = true;
      results.feed.imageUrl = feedData.image_url;
    }

    // Supabase에 저장
    dateData.created = true;
    dateData.updated_at = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('kakao_profile_content')
      .upsert({
        ...dateData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date,account'
      });

    if (upsertError) {
      console.error('프로필 데이터 저장 오류:', upsertError);
      throw upsertError;
    }

    // 피드 데이터 저장
    if (feedData) {
      feedData.updated_at = new Date().toISOString();
      const { error: feedUpsertError } = await supabase
        .from('kakao_feed_content')
        .upsert({
          ...feedData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date,account'
        });

      if (feedUpsertError) {
        console.error('피드 데이터 저장 오류:', feedUpsertError);
        // 피드 저장 실패는 치명적이지 않으므로 계속 진행
      }
    }

    res.status(200).json({
      success: true,
      date,
      results
    });

  } catch (error) {
    console.error('자동 생성 에러:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

