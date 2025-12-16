// pages/api/kakao-content/auto-create-account2.js
// Account 2 (업무폰) 자동 생성 API
// Supabase 기반으로 전환

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, forceRegenerate = false, brandStrategy } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    // brandStrategy 헬퍼 함수
    const getBrandStrategyConfig = (brandStrategy, accountType) => {
      if (brandStrategy) {
        return {
          customerpersona:
            brandStrategy.persona ||
            brandStrategy.customerpersona ||
            (accountType === 'account1' ? 'senior_fitting' : 'tech_enthusiast'),
          customerChannel:
            brandStrategy.channel || brandStrategy.customerChannel || 'local_customers',
          brandWeight:
            brandStrategy.brandStrength || brandStrategy.brandWeight || '중간',
          audienceTemperature: brandStrategy.audienceTemperature || 'warm',
          audienceWeight: brandStrategy.audienceWeight || '높음'
        };
      }

      // 기본값
      return {
        customerpersona: accountType === 'account1' ? 'senior_fitting' : 'tech_enthusiast',
        customerChannel: 'local_customers',
        brandWeight: '중간',
        audienceTemperature: 'warm',
        audienceWeight: '높음'
      };
    };

    const brandStrategyConfig = getBrandStrategyConfig(brandStrategy, 'account2');

    const supabase = createServerSupabase();
    const monthStr = date.substring(0, 7); // YYYY-MM

    // Supabase에서 해당 날짜의 데이터 로드
    const { data: profileData, error: profileError } = await supabase
      .from('kakao_profile_content')
      .select('*')
      .eq('date', date)
      .eq('account', 'account2')
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('프로필 데이터 로드 오류:', profileError);
      throw profileError;
    }

    // 날짜가 없으면 기본 구조 생성
    let dateData = profileData || {
      date,
      account: 'account2',
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
      .eq('account', 'account2')
      .single();

    if (feedError && feedError.code !== 'PGRST116') {
      console.error('피드 데이터 로드 오류:', feedError);
      throw feedError;
    }

    // feedData가 없으면 초기화
    if (!feedData) {
      feedData = {
        date,
        account: 'account2',
        image_category: null,
        base_prompt: null,
        image_prompt: null,
        caption: null,
        image_url: null,
        url: null,
        status: 'planned',
        created: false
      };
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
      
      if (calendarData?.profile_content?.account2?.weeklyThemes) {
        const themes = calendarData.profile_content.account2.weeklyThemes;
        const weekNumber = Math.ceil(new Date(date).getDate() / 7);
        const weekKey = `week${Math.min(weekNumber, 4)}`;
        weeklyTheme = themes[weekKey] || themes.week1 || weeklyTheme;
      }
    } catch (error) {
      console.log('⚠️ weeklyTheme 자동 감지 실패, 기본값 사용:', error.message);
    }

    // 배경 이미지 생성
    if (!dateData.background_image_url || forceRegenerate) {
      try {
        // basePrompt 자동 생성 (없는 경우)
        let bgPrompt = dateData.background_base_prompt;
        if (!bgPrompt) {
          try {
            console.log(`🔄 배경 basePrompt 자동 생성 중... (${date})`);
            const basePromptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-base-prompt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date,
                accountType: 'account2',
                type: 'background',
                weeklyTheme
              })
            });
            
            if (basePromptResponse.ok) {
              const basePromptData = await basePromptResponse.json();
              if (basePromptData.success && basePromptData.basePrompt) {
                bgPrompt = basePromptData.basePrompt;
                dateData.background_base_prompt = bgPrompt;
                console.log(`✅ 배경 basePrompt 자동 생성 완료: ${bgPrompt}`);
              }
            }
          } catch (basePromptError) {
            console.warn('⚠️ basePrompt 자동 생성 실패, 기본값 사용:', basePromptError.message);
          }
        }
        
        // basePrompt가 여전히 없으면 fallback 사용
        bgPrompt = bgPrompt || dateData.background_prompt || dateData.background_image || '하이테크 매장';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: bgPrompt,
            accountType: 'account2',
            type: 'background',
            brandStrategy: brandStrategyConfig,
            weeklyTheme,
            date
          })
        });

        const promptData = await promptResponse.json();
        if (!promptData.success) {
          throw new Error('프롬프트 생성 실패');
        }

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/kakao-content/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account2',
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
            // 첫 번째 이미지를 기본값으로 사용
            results.background.imageUrl = imageData.imageUrls[0];
            dateData.background_image_url = imageData.imageUrls[0];
            dateData.background_prompt = imageData.generatedPrompts?.[0] || promptData.prompt;
            
            // 생성된 모든 이미지 URL 로깅 (나중에 image_metadata에서 조회 가능)
            if (imageData.imageUrls.length > 1) {
              console.log(`📸 배경 이미지 ${imageData.imageUrls.length}개 생성됨:`);
              imageData.imageUrls.forEach((url, idx) => {
                console.log(`  ${idx + 1}. ${url}`);
              });
              console.log(`✅ 기본값으로 첫 번째 이미지 사용: ${imageData.imageUrls[0]}`);
              console.log(`💡 다른 이미지를 선택하려면 image_metadata 테이블에서 조회하거나 관리자 페이지에서 갤러리 선택 기능 사용`);
            }
            
            // 결과에 모든 이미지 URL 포함 (선택 가능하도록)
            results.background.allImageUrls = imageData.imageUrls;
            results.background.totalGenerated = imageData.imageUrls.length;
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          results.background.error = errorData.error || `HTTP ${imageResponse.status}`;
        }
      } catch (error) {
        results.background.error = error.message;
        console.error('배경 이미지 생성 에러:', error);
      }
    } else if (!forceRegenerate) {
      results.background.success = true;
      results.background.imageUrl = dateData.background_image_url;
    }

    // 프로필 이미지 생성
    if (!dateData.profile_image_url || forceRegenerate) {
      try {
        // basePrompt 자동 생성 (없는 경우)
        let profilePrompt = dateData.profile_base_prompt;
        if (!profilePrompt) {
          try {
            console.log(`🔄 프로필 basePrompt 자동 생성 중... (${date})`);
            const basePromptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-base-prompt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date,
                accountType: 'account2',
                type: 'profile',
                weeklyTheme
              })
            });
            
            if (basePromptResponse.ok) {
              const basePromptData = await basePromptResponse.json();
              if (basePromptData.success && basePromptData.basePrompt) {
                profilePrompt = basePromptData.basePrompt;
                dateData.profile_base_prompt = profilePrompt;
                console.log(`✅ 프로필 basePrompt 자동 생성 완료: ${profilePrompt}`);
              }
            }
          } catch (basePromptError) {
            console.warn('⚠️ basePrompt 자동 생성 실패, 기본값 사용:', basePromptError.message);
          }
        }
        
        // basePrompt가 여전히 없으면 fallback 사용
        profilePrompt = profilePrompt || dateData.profile_prompt || dateData.profile_image || '젊은 골퍼';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: profilePrompt,
            accountType: 'account2',
            type: 'profile',
            brandStrategy: brandStrategyConfig,
            weeklyTheme,
            date
          })
        });

        const promptData = await promptResponse.json();
        if (!promptData.success) {
          throw new Error('프롬프트 생성 실패');
        }

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/kakao-content/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account2',
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
            // 첫 번째 이미지를 기본값으로 사용
            results.profile.imageUrl = imageData.imageUrls[0];
            dateData.profile_image_url = imageData.imageUrls[0];
            dateData.profile_prompt = imageData.generatedPrompts?.[0] || promptData.prompt;
            
            // 생성된 모든 이미지 URL 로깅 (나중에 image_metadata에서 조회 가능)
            if (imageData.imageUrls.length > 1) {
              console.log(`📸 프로필 이미지 ${imageData.imageUrls.length}개 생성됨:`);
              imageData.imageUrls.forEach((url, idx) => {
                console.log(`  ${idx + 1}. ${url}`);
              });
              console.log(`✅ 기본값으로 첫 번째 이미지 사용: ${imageData.imageUrls[0]}`);
              console.log(`💡 다른 이미지를 선택하려면 image_metadata 테이블에서 조회하거나 관리자 페이지에서 갤러리 선택 기능 사용`);
            }
            
            // 결과에 모든 이미지 URL 포함 (선택 가능하도록)
            results.profile.allImageUrls = imageData.imageUrls;
            results.profile.totalGenerated = imageData.imageUrls.length;
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          results.profile.error = errorData.error || `HTTP ${imageResponse.status}`;
        }
      } catch (error) {
        results.profile.error = error.message;
        console.error('프로필 이미지 생성 에러:', error);
      }
    } else if (!forceRegenerate) {
      results.profile.success = true;
      results.profile.imageUrl = dateData.profile_image_url;
    }

    // 프로필 메시지 생성 (없는 경우)
    if (!dateData.message || dateData.message.trim() === '') {
      try {
        const messageResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message',
            accountType: 'account2',
            brandStrategy: brandStrategyConfig,
            weeklyTheme,
            date
          })
        });

        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          if (messageData.success && messageData.data?.message) {
            let cleanedMessage = messageData.data.message.trim();
            
            // "json { message: " 패턴 제거
            cleanedMessage = cleanedMessage.replace(/^json\s*\{\s*message\s*:\s*/i, '');
            cleanedMessage = cleanedMessage.replace(/\s*\}\s*$/i, '');
            
            // 따옴표 제거 (앞뒤 따옴표)
            cleanedMessage = cleanedMessage.replace(/^["'`]+|["'`]+$/g, '').trim();
            
            dateData.message = cleanedMessage;
            console.log(`✅ 프로필 메시지 생성 완료: ${dateData.message}`);
          }
        }
      } catch (messageError) {
        console.warn('⚠️ 프로필 메시지 생성 실패:', messageError.message);
      }
    }

    // 피드 이미지 생성
    if (feedData && (!feedData.image_url || forceRegenerate)) {
      try {
        // Phase 2.3: 이미지 카테고리 로테이션 (피드 이미지 카테고리가 없을 때)
        if (!feedData.image_category) {
          const categories = [
            '시니어 골퍼의 스윙',
            '피팅 상담의 모습',
            '매장의 모습',
            '젊은 골퍼의 스윙',
            '제품 컷',
            '감성 컷'
          ];
          
          // 날짜 기반 인덱스 (주 단위로 순환)
          const dayOfMonth = new Date(date).getDate();
          const categoryIndex = Math.floor((dayOfMonth - 1) / 7) % categories.length;
          feedData.image_category = categories[categoryIndex];
          console.log(`🔄 피드 이미지 카테고리 자동 선택: ${feedData.image_category} (날짜: ${date}, 주차: ${Math.floor((dayOfMonth - 1) / 7) + 1})`);
        }
        
        // basePrompt 자동 생성 (없는 경우)
        let feedPrompt = feedData.base_prompt;
        if (!feedPrompt) {
          try {
            console.log(`🔄 피드 basePrompt 자동 생성 중... (${date})`);
            const basePromptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-base-prompt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date,
                accountType: 'account2',
                type: 'feed',
                weeklyTheme
              })
            });
            
            if (basePromptResponse.ok) {
              const basePromptData = await basePromptResponse.json();
              if (basePromptData.success && basePromptData.basePrompt) {
                feedPrompt = basePromptData.basePrompt;
                feedData.base_prompt = feedPrompt;
                console.log(`✅ 피드 basePrompt 자동 생성 완료: ${feedPrompt}`);
              }
            }
          } catch (basePromptError) {
            console.warn('⚠️ basePrompt 자동 생성 실패, 기본값 사용:', basePromptError.message);
          }
        }
        
        // basePrompt가 여전히 없으면 fallback 사용
        feedPrompt = feedPrompt || feedData.image_prompt || feedData.image_category || '젊은 골퍼의 스윙';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: feedPrompt,
            accountType: 'account2',
            type: 'feed',
            brandStrategy: brandStrategyConfig,
            weeklyTheme,
            date
          })
        });

        const promptData = await promptResponse.json();
        if (!promptData.success) {
          throw new Error('프롬프트 생성 실패');
        }

        // 피드 캡션 생성 (이미지 생성 전에 생성 - account1과 동일한 순서)
        let feedCaption = feedData.caption;
        if (!feedCaption || feedCaption.trim().length === 0) {
          try {
            const captionResponse = await fetch(`${baseUrl}/api/kakao-content/generate-feed-caption`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageCategory: feedData.image_category || '젊은 골퍼의 스윙',
                accountType: 'account2',
                weeklyTheme,
                date,
                existingCaption: feedData.caption
              })
            });

            const captionData = await captionResponse.json();
            if (captionData.success && captionData.caption) {
              feedCaption = captionData.caption;
              feedData.caption = feedCaption;
              console.log(`✅ 피드 캡션 생성 완료: ${feedCaption}`);
            }
          } catch (captionError) {
            console.warn('⚠️ 피드 캡션 생성 실패, 기존 캡션 사용:', captionError.message);
          }
        }

        // URL 자동 선택
        const { getFeedUrl } = require('../../../lib/kakao-feed-url-selector');
        const selectedUrl = getFeedUrl(
          feedData.image_category || '젊은 골퍼의 스윙',
          'account2',
          date
        );

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/kakao-content/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account2',
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
            // 첫 번째 이미지를 기본값으로 사용
            results.feed.imageUrl = imageData.imageUrls[0];
            
            // 피드 데이터 업데이트
            feedData.image_url = imageData.imageUrls[0];
            feedData.image_prompt = imageData.generatedPrompts?.[0] || promptData.prompt;
            feedData.caption = feedCaption || feedData.caption || '';
            feedData.url = selectedUrl;
            feedData.created = true;
            
            // 생성된 모든 이미지 URL 로깅 (나중에 image_metadata에서 조회 가능)
            if (imageData.imageUrls.length > 1) {
              console.log(`📸 피드 이미지 ${imageData.imageUrls.length}개 생성됨:`);
              imageData.imageUrls.forEach((url, idx) => {
                console.log(`  ${idx + 1}. ${url}`);
              });
              console.log(`✅ 기본값으로 첫 번째 이미지 사용: ${imageData.imageUrls[0]}`);
              console.log(`💡 다른 이미지를 선택하려면 image_metadata 테이블에서 조회하거나 관리자 페이지에서 갤러리 선택 기능 사용`);
            }
            
            // 결과에 모든 이미지 URL 포함 (선택 가능하도록)
            results.feed.allImageUrls = imageData.imageUrls;
            results.feed.totalGenerated = imageData.imageUrls.length;
          } else {
            // ✅ 개선: 이미지가 생성되지 않은 경우 명확한 에러
            throw new Error('이미지 생성은 성공했지만 URL을 받지 못했습니다.');
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${imageResponse.status}`;
          
          // ✅ 개선: 에러 타입별 처리
          if (imageResponse.status === 402 || imageResponse.status === 403) {
            throw new Error(`크레딧 부족: ${errorMessage}`);
          } else if (imageResponse.status === 500) {
            throw new Error(`서버 오류: ${errorMessage}`);
          } else {
            throw new Error(`이미지 생성 실패: ${errorMessage}`);
          }
        }
      } catch (error) {
        results.feed.error = error.message;
        console.error('피드 이미지 생성 에러:', error);
      }
    } else if (feedData?.image_url && !forceRegenerate) {
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
      } else {
        // ✅ basePrompt를 kakao_calendar에도 동기화
        if (feedData.base_prompt) {
          try {
            const { data: calendarRecord } = await supabase
              .from('kakao_calendar')
              .select('kakaoFeed')
              .eq('month', monthStr)
              .single();

            if (calendarRecord?.kakaoFeed) {
              const kakaoFeed = { ...calendarRecord.kakaoFeed };
              if (!kakaoFeed.dailySchedule) {
                kakaoFeed.dailySchedule = [];
              }

              const feedIndex = kakaoFeed.dailySchedule.findIndex(
                (f) => f.date === date
              );

              if (feedIndex >= 0) {
                // 기존 항목 업데이트
                if (!kakaoFeed.dailySchedule[feedIndex].account2) {
                  kakaoFeed.dailySchedule[feedIndex].account2 = {};
                }
                kakaoFeed.dailySchedule[feedIndex].account2.basePrompt = feedData.base_prompt;
              } else {
                // 새 항목 생성
                kakaoFeed.dailySchedule.push({
                  date,
                  account1: {},
                  account2: { basePrompt: feedData.base_prompt }
                });
              }

              const { error: calendarUpdateError } = await supabase
                .from('kakao_calendar')
                .update({ kakaoFeed })
                .eq('month', monthStr);

              if (calendarUpdateError) {
                console.warn('⚠️ kakao_calendar basePrompt 동기화 실패:', calendarUpdateError.message);
              } else {
                console.log(`✅ kakao_calendar basePrompt 동기화 완료: ${date}`);
              }
            }
          } catch (calendarError) {
            console.warn('⚠️ kakao_calendar 동기화 실패 (치명적이지 않음):', calendarError.message);
          }
        }
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

