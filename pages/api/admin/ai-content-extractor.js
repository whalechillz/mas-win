import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, url, title } = req.body;

  if (!html || !url) {
    return res.status(400).json({ error: 'HTML content and URL are required' });
  }

  try {
    console.log('🤖 AI 콘텐츠 추출 시작:', url);
    
    // 1. HTML에서 기본 정보 추출
    const basicInfo = extractBasicInfo(html);
    console.log('📝 기본 정보 추출 완료:', basicInfo);
    
    // 2. AI를 사용한 콘텐츠 정제
    const cleanedContent = await cleanContentWithAI(html, title, url);
    console.log('🧹 AI 콘텐츠 정제 완료:', cleanedContent.length, '자');
    
    // 3. 이미지 추출 (기존 로직 개선)
    const images = extractImages(html);
    console.log('🖼️ 이미지 추출 완료:', images.length, '개');
    
    // 4. 메타데이터 추출
    const metadata = extractMetadata(html);
    console.log('📊 메타데이터 추출 완료:', metadata);

    return res.status(200).json({
      success: true,
      data: {
        title: title || basicInfo.title,
        content: cleanedContent,
        images: images,
        metadata: metadata,
        extractedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI 콘텐츠 추출 오류:', error);
    return res.status(500).json({ 
      error: 'AI 콘텐츠 추출 실패', 
      details: error.message 
    });
  }
}

// 기본 정보 추출
function extractBasicInfo(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '제목 없음';
  
  const ogDescriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  const description = ogDescriptionMatch ? ogDescriptionMatch[1].trim() : '';
  
  return { title, description };
}

// AI를 사용한 콘텐츠 정제
async function cleanContentWithAI(html, title, url) {
  try {
    // 1. HTML에서 텍스트 추출
    const rawText = extractRawText(html);
    console.log('📄 원본 텍스트 추출:', rawText.length, '자');
    
    // 2. AI 프롬프트 생성
    const prompt = createContentCleaningPrompt(rawText, title, url);
    
    // 3. OpenAI API 호출 (실제 구현 시 API 키 필요)
    const cleanedContent = await callOpenAI(prompt);
    
    return cleanedContent;
    
  } catch (error) {
    console.error('❌ AI 콘텐츠 정제 실패:', error);
    // AI 실패 시 기본 정제 로직 사용
    return fallbackContentCleaning(html);
  }
}

// 원본 텍스트 추출
function extractRawText(html) {
  // HTML 태그 제거
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

// AI 프롬프트 생성
function createContentCleaningPrompt(rawText, title, url) {
  return `
다음은 네이버 블로그에서 추출한 원본 텍스트입니다. 
실제 블로그 포스트 내용만 추출하여 깔끔하게 정리해주세요.

**블로그 정보:**
- 제목: ${title}
- URL: ${url}

**원본 텍스트:**
${rawText.substring(0, 5000)}...

**요구사항:**
1. 실제 블로그 포스트 내용만 추출
2. 네이버 블로그 UI 요소 제거 (로그인, 메뉴, 광고 등)
3. 자연스러운 문단 구분
4. 이모지와 특수문자 유지
5. 마케팅 콘텐츠의 핵심 메시지 보존

**결과:**
깔끔하게 정리된 블로그 포스트 내용만 반환해주세요.
`;
}

// OpenAI API 호출 (실제 구현 시)
async function callOpenAI(prompt) {
  // 실제 구현 시 OpenAI API 키 필요
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-3.5-turbo',
  //     messages: [{ role: 'user', content: prompt }],
  //     max_tokens: 2000,
  //     temperature: 0.3
  //   })
  // });
  
  // 임시로 기본 정제 로직 사용
  console.log('⚠️ OpenAI API 미구현, 기본 정제 로직 사용');
  return fallbackContentCleaning(prompt);
}

// 기본 정제 로직 (AI 실패 시)
function fallbackContentCleaning(html) {
  console.log('🔄 기본 콘텐츠 정제 로직 실행');
  
  // HTML 정리
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  
  // 텍스트 추출
  let text = cleanHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 실제 포스트 내용 시작점 찾기
  const postStartPatterns = [
    /안녕하세요.*?공식.*?입니다/,
    /오늘은.*?지역.*?골퍼.*?여러분을.*?위한/,
    /MASGOLF.*?초고반발.*?드라이버/,
    /골프.*?비거리.*?문제/,
    /📍.*?골프.*?비거리.*?문제/
  ];
  
  for (const pattern of postStartPatterns) {
    const match = text.match(pattern);
    if (match) {
      const startIndex = match.index;
      text = text.substring(startIndex);
      console.log(`✅ 실제 포스트 내용 시작점 발견: ${startIndex}번째 문자부터`);
      break;
    }
  }
  
  // UI 요소 제거
  text = text
    .replace(/네이버 블로그/g, '')
    .replace(/블로그/g, '')
    .replace(/로그인/g, '')
    .replace(/회원가입/g, '')
    .replace(/검색/g, '')
    .replace(/카테고리/g, '')
    .replace(/이전글/g, '')
    .replace(/다음글/g, '')
    .replace(/공감/g, '')
    .replace(/댓글/g, '')
    .replace(/공유/g, '')
    .replace(/신고/g, '')
    .replace(/스크랩/g, '')
    .replace(/구독/g, '')
    .replace(/알림/g, '')
    .replace(/설정/g, '')
    .replace(/도움말/g, '')
    .replace(/이용약관/g, '')
    .replace(/개인정보처리방침/g, '')
    .replace(/저작권/g, '')
    .replace(/광고/g, '')
    .replace(/배너/g, '')
    .replace(/팝업/g, '')
    .replace(/쿠키/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text.substring(0, 5000); // 최대 5000자로 제한
}

// 이미지 추출 (기존 로직 개선)
function extractImages(html) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    
    if (!src) continue;

    // 실제 포스트 이미지만 필터링
    if (src.includes('postfiles.pstatic.net') || 
        src.includes('blogfiles.naver.net')) {
      images.push({
        src: src,
        alt: '',
        fileName: extractFileName(src),
        fileExtension: extractFileExtension(src),
        isNaverImage: true
      });
    }
  }

  return images;
}

// 파일명 추출
function extractFileName(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    try {
      const decodedFilename = decodeURIComponent(filename);
      return decodedFilename || `image-${Date.now()}`;
    } catch (decodeError) {
      return filename || `image-${Date.now()}`;
    }
  } catch (error) {
    return `image-${Date.now()}`;
  }
}

// 파일 확장자 추출
function extractFileExtension(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    const extension = filename.split('.').pop();
    return extension || 'jpg';
  } catch (error) {
    return 'jpg';
  }
}

// 메타데이터 추출
function extractMetadata(html) {
  const publishDateMatch = html.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i);
  const publishDate = publishDateMatch ? publishDateMatch[1].trim() : '';
  
  return { publishDate };
}
