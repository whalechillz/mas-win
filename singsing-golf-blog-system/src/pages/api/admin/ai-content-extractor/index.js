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
다음은 네이버 블로그에서 추출한 텍스트입니다. 실제 블로그 포스트 내용만 추출하여 깔끔하게 정리해주세요.

제목: ${title}
URL: ${url}

원본 텍스트:
${rawText.substring(0, 5000)}...

위 텍스트에서 다음 요소들을 제거하고 실제 블로그 포스트 내용만 반환해주세요:
- 네이버 블로그 UI 요소 (로그인, 메뉴, 광고, 버튼 등)
- JSON 메타데이터나 시스템 메시지
- HTML 태그 잔여물이나 코드
- 경고 메시지나 시스템 알림
- "요구사항", "결과", "정리 요구사항" 등의 메타 지시사항

이모지와 특수문자는 그대로 유지하고, 마케팅 콘텐츠의 핵심 메시지와 정보는 보존해주세요.

순수한 블로그 포스트 본문 내용만 반환해주세요.
`;
}

// OpenAI API 호출 (실제 ChatGPT API 사용)
async function callOpenAI(prompt) {
  try {
    console.log('🚨 ChatGPT API 호출 시작');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API 키가 설정되지 않음, 기본 정제 로직 사용');
      return fallbackContentCleaning(prompt);
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const cleanedContent = data.choices[0].message.content;
    
    console.log('✅ ChatGPT API 호출 성공:', cleanedContent.length, '자');
    
    // AI 사용량 로그 저장
    await logAIUsageToSupabase({
      api_endpoint: 'ai-content-extractor',
      model: 'gpt-3.5-turbo',
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
      cost: calculateCost(data.usage),
      improvement_type: 'content-extraction',
      content_type: 'blog-post',
      user_agent: 'ai-content-extractor',
      ip_address: null
    });
    
    return cleanedContent;
    
  } catch (error) {
    console.error('❌ ChatGPT API 호출 실패:', error);
    console.log('🔄 기본 정제 로직으로 fallback');
    return fallbackContentCleaning(prompt);
  }
}

// AI 사용량을 Supabase에 로그
async function logAIUsageToSupabase(logData) {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert([{
        ...logData,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('❌ AI 사용량 로그 저장 실패:', error);
    } else {
      console.log('📊 AI 사용량 로그 저장 성공');
    }
  } catch (error) {
    console.error('❌ AI 사용량 로그 오류:', error);
  }
}

// OpenAI API 비용 계산 (GPT-3.5-turbo 기준)
function calculateCost(usage) {
  if (!usage) return 0;
  
  const inputCostPer1K = 0.0015; // $0.0015 per 1K input tokens
  const outputCostPer1K = 0.002; // $0.002 per 1K output tokens
  
  const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1K;
  const outputCost = (usage.completion_tokens / 1000) * outputCostPer1K;
  
  return inputCost + outputCost;
}

// 강화된 네이버 콘텐츠 정제 함수
function cleanNaverContent(text) {
  console.log('🧹 강화된 콘텐츠 정제 시작...');
  
  // 1. JSON 메타데이터 제거 (더 강력한 패턴)
  text = text.replace(/\[\{[^}]*"title"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"source"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"blogName"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"domainIdOrBlogId"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"nicknameOrBlogId"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"logNo"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"smartEditorVersion"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"meDisplay"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"lineDisplay"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"outsideDisplay"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"cafeDisplay"[^}]*\}\]/g, '');
  text = text.replace(/\[\{[^}]*"blogDisplay"[^}]*\}\]/g, '');
  
  // 2. 요구사항 텍스트 제거 (AI 프롬프트 잔여물)
  text = text.replace(/\*\*요구사항:\*\*.*?\*\*결과:\*\*/gs, '');
  text = text.replace(/1\. 실제 포스트 내용만 추출.*?깔끔하게 정리된 포스트 내용만 반환해주세요\./gs, '');
  text = text.replace(/다음은 에서 추출한 원본 텍스트입니다\..*?순수한 블로그 포스트 내용만 반환해 주세요\./gs, '');
  text = text.replace(/위 텍스트에서 다음 요소들을 제거하고.*?순수한 블로그 포스트 본문 내용만 반환해주세요\./gs, '');
  
  // 3. HTML 태그 잔여물 제거
  text = text.replace(/span\.u_likeit_button\)/g, '');
  text = text.replace(/face \d+개 \(전체\)\)/g, '');
  text = text.replace(/이 글에 한 블로거 열고 닫기/g, '');
  text = text.replace(/이 글에 단 블로거 열고 닫기/g, '');
  text = text.replace(/인쇄 쓰기/g, '');
  text = text.replace(/이전 다음/g, '');
  text = text.replace(/전체 글 전체글 보기/g, '');
  text = text.replace(/화면 최상단으로 이동/g, '');
  
  // 4. 시스템 메시지 제거
  text = text.replace(/안녕하세요\. 이 포스트는 에서 작성된 게시글입니다\..*?감사합니다\./gs, '');
  text = text.replace(/글 보내기 서비스 안내.*?더 좋은 서비스로 보답할 수 있도록 노력하겠습니다\./gs, '');
  text = text.replace(/악성코드가 포함되어 있는 파일입니다\..*?고객님의 PC가 악성코드에 감염될 경우.*?주의하시기 바랍니다\./gs, '');
  text = text.replace(/작성자 이외의 방문자에게는 이용이 제한되었습니다\..*?이용제한 파일.*?내PC 저장.*?N드라이브 저장/gs, '');
  text = text.replace(/글보내기 제한 공지.*?건강한 인터넷 환경을 만들어 나갈 수 있도록.*?협조를 부탁드립니다\./gs, '');
  text = text.replace(/주제 분류 제한 공지.*?건강한 인터넷 환경을 만들어 나갈 수 있도록.*?협조를 부탁드립니다\./gs, '');
  text = text.replace(/작성하신 게시글 에 사용이 제한된 문구가 포함.*?해당 게시물 등록이 일시적으로 제한/gs, '');
  
  // 5. UI 요소 제거
  text = text.replace(/태그 취소 확인/g, '');
  text = text.replace(/칭찬 \d+ 감사 \d+ 웃김 \d+ 놀람 \d+ 슬픔 \d+/g, '');
  text = text.replace(/이웃추가/g, '');
  text = text.replace(/본문 기타 기능/g, '');
  text = text.replace(/URL 복사/g, '');
  text = text.replace(/전체보기 \d+개의 글/g, '');
  text = text.replace(/전체보기 목록열기/g, '');
  text = text.replace(/신제품, 비거리 연구/g, '');
  
  // 6. 네이버 블로그 UI 요소 제거
  text = text.replace(/네이버 블로그/g, '');
  text = text.replace(/글 RSS 2\.0 RSS 1\.0 ATOM 0\.3/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  
  // 7. 공백 정리
  text = text.replace(/\s+/g, ' ').trim();
  
  console.log(`✅ 강화된 콘텐츠 정제 완료: ${text.length}자`);
  return text;
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
  
  // 강화된 콘텐츠 정제
  text = cleanNaverContent(text);
  
  // 실제 포스트 내용 시작점 찾기
  const postStartPatterns = [
    /안녕하세요.*?공식.*?입니다/,
    /오늘은.*?지역.*?골퍼.*?여러분을.*?위한/,
    /MASGOLF.*?초고반발.*?드라이버/,
    /골프.*?비거리.*?문제/,
    /📍.*?골프.*?비거리.*?문제/,
    /무더운 여름.*?기다리던 휴가 시즌/
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
