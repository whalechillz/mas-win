// pages/api/kakao-content/auto-create-account2.js
// Account 2 (업무폰) 자동 생성 API

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const monthStr = date.substring(0, 7); // YYYY-MM
    const calendarPath = path.join(process.cwd(), 'docs', 'content-calendar', `${monthStr}.json`);
    
    if (!fs.existsSync(calendarPath)) {
      return res.status(404).json({ error: 'Calendar file not found' });
    }

    const calendarData = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));
    const dateIndex = calendarData.profileContent?.account2?.dailySchedule?.findIndex(d => d.date === date);
    
    if (dateIndex === -1 || dateIndex === undefined) {
      return res.status(404).json({ error: 'Date not found in calendar' });
    }

    const dateData = calendarData.profileContent.account2.dailySchedule[dateIndex];
    const feedData = calendarData.kakaoFeed?.dailySchedule?.find(d => d.date === date)?.account2;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const results = {
      background: { success: false, imageUrl: null, error: null },
      profile: { success: false, imageUrl: null, error: null },
      feed: { success: false, imageUrl: null, error: null }
    };

    // 배경 이미지 생성
    if (!dateData.background?.imageUrl) {
      try {
        const bgPrompt = dateData.background?.prompt || dateData.background?.image || '하이테크 매장';
        const weeklyTheme = calendarData.profileContent?.account2?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: bgPrompt,
            accountType: 'account2',
            type: 'background',
            brandStrategy: {
              customerpersona: 'tech_enthusiast',
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

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
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
            results.background.imageUrl = imageData.imageUrls[0];
            dateData.background = {
              ...dateData.background,
              imageUrl: imageData.imageUrls[0],
              prompt: imageData.generatedPrompts?.[0] || promptData.prompt
            };
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
      results.background.imageUrl = dateData.background.imageUrl;
    }

    // 프로필 이미지 생성
    if (!dateData.profile?.imageUrl) {
      try {
        const profilePrompt = dateData.profile?.prompt || dateData.profile?.image || '젊은 골퍼';
        const weeklyTheme = calendarData.profileContent?.account2?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: profilePrompt,
            accountType: 'account2',
            type: 'profile',
            brandStrategy: {
              customerpersona: 'tech_enthusiast',
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

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
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
            results.profile.imageUrl = imageData.imageUrls[0];
            dateData.profile = {
              ...dateData.profile,
              imageUrl: imageData.imageUrls[0],
              prompt: imageData.generatedPrompts?.[0] || promptData.prompt
            };
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
      results.profile.imageUrl = dateData.profile.imageUrl;
    }

    // 피드 이미지 생성
    if (feedData && !feedData.imageUrl) {
      try {
        const feedPrompt = feedData.imagePrompt || feedData.imageCategory || '젊은 골퍼의 스윙';
        const weeklyTheme = calendarData.profileContent?.account2?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
        
        // 프롬프트 생성
        const promptResponse = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: feedPrompt,
            accountType: 'account2',
            type: 'feed',
            brandStrategy: {
              customerpersona: 'tech_enthusiast',
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

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: promptData.prompt, paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account2',
              type: 'feed',
              date,
              message: feedData.caption || ''
            }
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.imageUrls && imageData.imageUrls.length > 0) {
            results.feed.success = true;
            results.feed.imageUrl = imageData.imageUrls[0];
            
            // 피드 데이터 업데이트
            const feedIndex = calendarData.kakaoFeed?.dailySchedule?.findIndex(d => d.date === date);
            if (feedIndex !== -1 && feedIndex !== undefined) {
              calendarData.kakaoFeed.dailySchedule[feedIndex].account2 = {
                ...calendarData.kakaoFeed.dailySchedule[feedIndex].account2,
                imageUrl: imageData.imageUrls[0],
                imagePrompt: imageData.generatedPrompts?.[0] || promptData.prompt,
                created: true,
                createdAt: new Date().toISOString()
              };
            }
          }
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          results.feed.error = errorData.error || `HTTP ${imageResponse.status}`;
        }
      } catch (error) {
        results.feed.error = error.message;
        console.error('피드 이미지 생성 에러:', error);
      }
    } else if (feedData?.imageUrl) {
      results.feed.success = true;
      results.feed.imageUrl = feedData.imageUrl;
    }

    // 캘린더 파일 업데이트
    dateData.created = true;
    dateData.createdAt = new Date().toISOString();
    calendarData.profileContent.account2.dailySchedule[dateIndex] = dateData;

    // 파일 저장
    fs.writeFileSync(calendarPath, JSON.stringify(calendarData, null, 2), 'utf8');

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

