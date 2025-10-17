import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { blogId, postUrls, urls, options = {} } = req.body;
  
  // 프론트엔드에서 urls로 전송하는 경우 postUrls로 변환
  const finalPostUrls = postUrls || urls;

  if (!blogId && !finalPostUrls) {
    return res.status(400).json({ error: '블로그 ID 또는 포스트 URL이 필요합니다.' });
  }

  try {
    console.log('🔵 네이버 블로그 스크래핑 시작:', { blogId, finalPostUrls });

    let posts = [];

    if (blogId) {
      // 1. 블로그 ID로 RSS 피드에서 포스트 목록 가져오기
      posts = await getBlogPostsFromRSS(blogId);
    } else if (finalPostUrls && Array.isArray(finalPostUrls)) {
      // 2. 직접 제공된 포스트 URL들 처리
      posts = await scrapeMultiplePosts(finalPostUrls);
    }

    console.log(`📊 총 ${posts.length}개 포스트 처리 완료`);

    return res.status(200).json({
      success: true,
      totalPosts: posts.length,
      successfulPosts: posts.filter(p => p.title && p.content).length,
      failedPosts: posts.filter(p => !p.title || !p.content).length,
      posts: posts,
      message: `총 ${posts.length}개 포스트 중 ${posts.filter(p => p.title && p.content).length}개 성공적으로 스크래핑되었습니다.`
    });

  } catch (error) {
    console.error('❌ 네이버 블로그 스크래핑 오류:', error);
    return res.status(500).json({
      error: '네이버 블로그 스크래핑 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// RSS 피드에서 블로그 포스트 목록 가져오기
async function getBlogPostsFromRSS(blogId) {
  try {
    console.log('📡 RSS 피드에서 포스트 목록 가져오기:', blogId);
    
    const rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;
    console.log('📡 RSS 피드 가져오기:', rssUrl);
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NaverBlogScraper/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS 피드 로드 실패: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('📄 RSS XML 응답 길이:', xmlText.length);

    // XML 파싱하여 포스트 URL들 추출
    const postUrls = [];
    const urlRegex = /<link><!\[CDATA\[(https:\/\/blog\.naver\.com\/[^\]]+)\]\]><\/link>/g;
    let match;

    while ((match = urlRegex.exec(xmlText)) !== null) {
      postUrls.push(match[1]);
    }

    console.log(`📊 RSS에서 ${postUrls.length}개 포스트 URL 추출됨`);

    // 각 포스트 상세 스크래핑
    return await scrapeMultiplePosts(postUrls.slice(0, 10)); // 최대 10개만 처리

  } catch (error) {
    console.error('❌ RSS 피드 처리 오류:', error);
    throw error;
  }
}

// 여러 포스트 스크래핑
async function scrapeMultiplePosts(postUrls) {
  const posts = [];
  
  for (const url of postUrls) {
    try {
      const post = await scrapeNaverPost(url);
      posts.push(post);
    } catch (error) {
      console.error(`❌ 포스트 스크래핑 실패 (${url}):`, error.message);
      posts.push({
        url,
        title: '스크래핑 실패',
        content: '콘텐츠를 가져올 수 없습니다.',
        images: [],
        error: error.message
      });
    }
  }
  
  return posts;
}

// 네이버 블로그 포스트 상세 스크래핑
async function scrapeNaverPost(url) {
  try {
    console.log('📄 포스트 스크래핑:', url);
    
    // 네이버 블로그 URL을 PostView URL로 변환
    let targetUrl = url;
    if (url.includes('blog.naver.com/') && !url.includes('PostView.naver')) {
      const urlMatch = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/);
      if (urlMatch) {
        const blogId = urlMatch[1];
        const logNo = urlMatch[2];
        targetUrl = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
        console.log(`🔄 PostView URL로 변환: ${targetUrl}`);
      }
    }
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 30000,
      redirect: 'follow',
      follow: 5
    });

    if (!response.ok) {
      throw new Error(`포스트 로드 실패: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // 네이버 블로그 특화 파싱 (AI 기반)
    const title = extractNaverTitle(html);
    const content = await extractNaverContentWithAI(html, title, url);
    const images = extractNaverImages(html);
    const publishDate = extractNaverPublishDate(html);
    const category = extractNaverCategory(html);
    
    // 첫 번째 실제 포스트 이미지를 대표 이미지로 설정
    const featuredImage = images.length > 0 ? images[0] : null;

    return {
      url,
      title,
      content,
      images,
      featuredImage,
      publishDate,
      category,
      naverPostId: url.match(/\/(\d+)$/)?.[1] || '',
      originalUrl: url,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ 포스트 스크래핑 오류:', error);
    throw error;
  }
}

// AI 기반 네이버 블로그 콘텐츠 추출
async function extractNaverContentWithAI(html, title, url) {
  try {
    console.log('🤖 AI 콘텐츠 추출 시작:', url);
    
    // AI 사용량 추적
    await logAIUsage('content-extraction', 'naver-blog-scraper', url, {
      title: title,
      htmlLength: html.length
    });
    
    // AI API 사용 시점 알림
    console.log('🚨 AI API 사용 시점: ChatGPT API 호출 시작');
    console.log('📊 입력 데이터:', {
      htmlLength: html.length,
      title: title,
      url: url
    });
    
    // AI 콘텐츠 추출 API 호출
    const aiResponse = await fetch('http://localhost:3000/api/admin/ai-content-extractor/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: html,
        title: title,
        url: url
      })
    });

    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      console.log('✅ AI 콘텐츠 추출 성공:', aiResult.data.content.length, '자');
      
      // AI 사용량 추적 (성공)
      await logAIUsage('content-extraction-success', 'naver-blog-scraper', url, {
        extractedLength: aiResult.data.content.length,
        success: true
      });
      
      return aiResult.data.content;
    } else {
      console.log('⚠️ AI 콘텐츠 추출 실패, 기본 로직 사용');
      
      // AI 사용량 추적 (실패)
      await logAIUsage('content-extraction-failed', 'naver-blog-scraper', url, {
        error: 'AI API 호출 실패',
        fallbackUsed: true
      });
      
      return extractNaverContent(html);
    }
    
  } catch (error) {
    console.error('❌ AI 콘텐츠 추출 오류:', error);
    
    // AI 사용량 추적 (오류)
    await logAIUsage('content-extraction-error', 'naver-blog-scraper', url, {
      error: error.message,
      fallbackUsed: true
    });
    
    return extractNaverContent(html);
  }
}

// AI 사용량 추적 함수 (기존 테이블 구조에 맞게 수정)
async function logAIUsage(action, source, url, metadata = {}) {
  try {
    const logData = {
      api_endpoint: 'naver-blog-scraper',
      model: 'content-extraction',
      input_tokens: metadata.htmlLength || 0,
      output_tokens: metadata.extractedLength || 0,
      total_tokens: (metadata.htmlLength || 0) + (metadata.extractedLength || 0),
      cost: 0, // OpenAI API 비용 (필요시 계산)
      improvement_type: action,
      content_type: 'blog-post',
      user_agent: 'naver-blog-scraper',
      ip_address: null, // 서버에서 실행되므로 null
      created_at: new Date().toISOString()
    };
    
    // Supabase에 AI 사용량 로그 저장
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert([logData]);
    
    if (error) {
      console.error('❌ AI 사용량 로그 저장 실패:', error);
    } else {
      console.log('📊 AI 사용량 로그 저장 성공:', action);
    }
  } catch (error) {
    console.error('❌ AI 사용량 로그 오류:', error);
  }
}

// 네이버 블로그 제목 추출
function extractNaverTitle(html) {
  const titleRegex = /<title>([^<]+)<\/title>/i;
  const match = html.match(titleRegex);
  return match ? match[1].trim() : '제목 없음';
}

// 간단한 콘텐츠 정제 함수
function cleanNaverContent(text) {
  console.log('🧹 콘텐츠 정제 시작...');
  
  // 1. JSON 메타데이터 제거
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
  
  // 2. 요구사항 텍스트 제거
  text = text.replace(/\*\*요구사항:\*\*.*?\*\*결과:\*\*/gs, '');
  text = text.replace(/1\. 실제 포스트 내용만 추출.*?깔끔하게 정리된 포스트 내용만 반환해주세요\./gs, '');
  text = text.replace(/다음은 에서 추출한 원본 텍스트입니다\..*?순수한 블로그 포스트 내용만 반환해 주세요\./gs, '');
  
  // 3. HTML 태그 잔여물 제거
  text = text.replace(/span\.u_likeit_button\)/g, '');
  text = text.replace(/face \d+개 \(전체\)\)/g, '');
  text = text.replace(/이 글에 한 블로거 열고 닫기/g, '');
  text = text.replace(/이 글에 단 블로거 열고 닫기/g, '');
  text = text.replace(/인쇄/g, '');
  text = text.replace(/쓰기/g, '');
  text = text.replace(/이전 다음/g, '');
  text = text.replace(/이 전체 글 전체글 보기/g, '');
  text = text.replace(/화면 최상단으로 이동/g, '');
  text = text.replace(/글 RSS 2\.0 RSS 1\.0 ATOM 0\.3/g, '');
  
  // 4. 시스템 메시지 제거
  text = text.replace(/안녕하세요\. 이 포스트는 에서 작성된 게시글입니다\..*?감사합니다\./gs, '');
  text = text.replace(/글 보내기 서비스 안내.*?더 좋은 서비스로 보답할 수 있도록 노력하겠습니다\./gs, '');
  text = text.replace(/악성코드가 포함되어 있는 파일입니다\..*?주의하시기 바랍니다\./gs, '');
  text = text.replace(/작성자 이외의 방문자에게는 이용이 제한되었습니다\..*?이용제한 파일 :/gs, '');
  text = text.replace(/글보내기 제한 공지.*?건강한 인터넷 환경을 만들어 나갈 수 있도록 고객님의 많은 관심과 협조를 부탁드립니다\./gs, '');
  text = text.replace(/주제 분류 제한 공지.*?건강한 인터넷 환경을 만들어 나갈 수 있도록 고객님의 많은 관심과 협조를 부탁드립니다\./gs, '');
  text = text.replace(/작성하신 게시글 에 사용이 제한된 문구가 포함 되어 일시적으로 등록이 제한됩 니다\..*?일시적으로 제한\.\.\./gs, '');
  
  // 5. UI 요소 제거
  text = text.replace(/태그 취소 확인/g, '');
  text = text.replace(/칭찬 \d+ 감사 \d+ 웃김 \d+ 놀람 \d+ 슬픔 \d+/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&#034;/g, '"');
  text = text.replace(/&#039;/g, "'");
  
  // 6. 네이버 블로그 UI 요소 제거
  text = text.replace(/네이버 블로그/g, '');
  text = text.replace(/블로그/g, '');
  text = text.replace(/Naver Blog/gi, '');
  text = text.replace(/네이버/g, '');
  text = text.replace(/Naver/gi, '');
  text = text.replace(/로그인/g, '');
  text = text.replace(/회원가입/g, '');
  text = text.replace(/검색/g, '');
  text = text.replace(/카테고리/g, '');
  text = text.replace(/이전글/g, '');
  text = text.replace(/다음글/g, '');
  text = text.replace(/공감/g, '');
  text = text.replace(/댓글/g, '');
  text = text.replace(/공유/g, '');
  text = text.replace(/신고/g, '');
  text = text.replace(/스크랩/g, '');
  text = text.replace(/구독/g, '');
  text = text.replace(/알림/g, '');
  text = text.replace(/설정/g, '');
  text = text.replace(/도움말/g, '');
  text = text.replace(/이용약관/g, '');
  text = text.replace(/개인정보처리방침/g, '');
  text = text.replace(/저작권/g, '');
  text = text.replace(/광고/g, '');
  text = text.replace(/배너/g, '');
  text = text.replace(/팝업/g, '');
  text = text.replace(/쿠키/g, '');
  
  // 7. 공백 정리
  text = text.replace(/\s+/g, ' ').trim();
  
  console.log(`✅ 콘텐츠 정제 완료: ${text.length}자`);
  return text;
}

// 네이버 블로그 콘텐츠 추출 (개선된 버전)
function extractNaverContent(html) {
  console.log('🔍 콘텐츠 추출 시작...');
  
  // 1. 먼저 og:description에서 콘텐츠 추출 시도 (요약용)
  const ogDescriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  let ogDescription = '';
  if (ogDescriptionMatch && ogDescriptionMatch[1]) {
    ogDescription = ogDescriptionMatch[1].trim();
    console.log(`📝 og:description 발견: ${ogDescription.substring(0, 100)}...`);
  }
  
  // 2. 새로운 접근 방식: 전체 HTML에서 의미있는 텍스트 추출
  console.log('🔍 전체 HTML에서 의미있는 텍스트 추출 중...');
  
  // HTML 정리 (스크립트, 스타일, 메타 태그 제거)
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  
  // 3. 텍스트 노드 추출 (HTML 태그 제거)
  let extractedText = cleanHtml
    .replace(/<[^>]+>/g, ' ') // HTML 태그를 공백으로 변환
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .trim();
  
  // 4. 네이버 블로그 관련 불필요한 텍스트 제거 (강화된 버전)
  extractedText = extractedText
    // 먼저 JSON 메타데이터 완전 제거
    .replace(/\[\{[^}]*"title"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"source"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"blogName"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"domainIdOrBlogId"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"nicknameOrBlogId"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"logNo"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"smartEditorVersion"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"meDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"lineDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"outsideDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"cafeDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"blogDisplay"[^}]*\}\]/g, '')
    
    // 요구사항 텍스트 완전 제거
    .replace(/\*\*요구사항:\*\*.*?\*\*결과:\*\*/gs, '')
    .replace(/1\. 실제 포스트 내용만 추출.*?깔끔하게 정리된 포스트 내용만 반환해주세요\./gs, '')
    .replace(/다음은 에서 추출한 원본 텍스트입니다\..*?순수한 블로그 포스트 내용만 반환해 주세요\./gs, '')
    
    // HTML 태그 잔여물 제거
    .replace(/span\.u_likeit_button\)/g, '')
    .replace(/face \d+개 \(전체\)\)/g, '')
    .replace(/이 글에 한 블로거 열고 닫기/g, '')
    .replace(/이 글에 단 블로거 열고 닫기/g, '')
    .replace(/인쇄/g, '')
    .replace(/쓰기/g, '')
    .replace(/이전 다음/g, '')
    .replace(/이 전체 글 전체글 보기/g, '')
    .replace(/화면 최상단으로 이동/g, '')
    .replace(/글 RSS 2\.0 RSS 1\.0 ATOM 0\.3/g, '')
    
    // 시스템 메시지 완전 제거
    .replace(/안녕하세요\. 이 포스트는 에서 작성된 게시글입니다\..*?감사합니다\./gs, '')
    .replace(/글 보내기 서비스 안내.*?더 좋은 서비스로 보답할 수 있도록 노력하겠습니다\./gs, '')
    .replace(/악성코드가 포함되어 있는 파일입니다\..*?주의하시기 바랍니다\./gs, '')
    .replace(/작성자 이외의 방문자에게는 이용이 제한되었습니다\..*?이용제한 파일 :/gs, '')
    .replace(/글보내기 제한 공지.*?건강한 인터넷 환경을 만들어 나갈 수 있도록 고객님의 많은 관심과 협조를 부탁드립니다\./gs, '')
    .replace(/주제 분류 제한 공지.*?건강한 인터넷 환경을 만들어 나갈 수 있도록 고객님의 많은 관심과 협조를 부탁드립니다\./gs, '')
    .replace(/작성하신 게시글 에 사용이 제한된 문구가 포함 되어 일시적으로 등록이 제한됩 니다\..*?일시적으로 제한\.\.\./gs, '')
    
    // UI 요소 제거
    .replace(/태그 취소 확인/g, '')
    .replace(/칭찬 \d+ 감사 \d+ 웃김 \d+ 놀람 \d+ 슬픔 \d+/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#034;/g, '"')
    .replace(/&#039;/g, "'")
    // 네이버 블로그 기본 UI 요소들
    .replace(/네이버 블로그/g, '')
    .replace(/블로그/g, '')
    .replace(/Naver Blog/gi, '')
    .replace(/네이버/g, '')
    .replace(/Naver/gi, '')
    
    // 반응 버튼들
    .replace(/칭찬/g, '')
    .replace(/감사/g, '')
    .replace(/웃김/g, '')
    .replace(/놀람/g, '')
    .replace(/슬픔/g, '')
    .replace(/span\.u_likeit_button\)/g, '')
    .replace(/face \d+개 \(전체\)\)/g, '')
    
    // 네비게이션 및 메뉴
    .replace(/이웃추가/g, '')
    .replace(/본문 바로가기/g, '')
    .replace(/공지 목록/g, '')
    .replace(/전체보기/g, '')
    .replace(/목록열기/g, '')
    .replace(/글쓰기/g, '')
    .replace(/가벼운 글쓰기툴/g, '')
    .replace(/퀵에디터가 오픈했어요/g, '')
    
    // 시스템 메시지들
    .replace(/주소 변경 불가 안내/g, '')
    .replace(/마켓 판매자의 이력 관리를 위해 주소 변경이 불가합니다/g, '')
    .replace(/자세히 보기/g, '')
    .replace(/레이어 닫기/g, '')
    .replace(/아이디가 필요해요/g, '')
    .replace(/진짜 나를 기록하고 다양한 이웃과 소식을 만나보세요/g, '')
    .replace(/지금 시작해볼까요/g, '')
    .replace(/아이디 만들기/g, '')
    .replace(/한 아이디는 나중에 변경할 수 없으니 신중하게 입력해주세요/g, '')
    .replace(/변경 전 된 \/글\/클립 링크는 연결이 끊길 수 있습니다/g, '')
    .replace(/아이디 또는 개인정보가 포함된 문자 사용 은 피해주세요/g, '')
    .replace(/아이디 변경 유의사항을 확인해보세요/g, '')
    .replace(/나중에 할게요/g, '')
    .replace(/이전 주소로 된 글은 3개월간 새로운 주소로 연결을 지원하며 이후 언제든 연결이 끊길 수 있습니다/g, '')
    .replace(/아이디는 한번 변경하면 다시 변경이 불가능 합니다/g, '')
    .replace(/변경하시겠습니까/g, '')
    .replace(/취소/g, '')
    .replace(/확인/g, '')
    .replace(/아이디는 한번 정하면 다시 변경이 불가능합니다/g, '')
    .replace(/이 아이디로 를 만들까요/g, '')
    .replace(/환영합니다/g, '')
    .replace(/아이디가 만들어졌어요/g, '')
    .replace(/바로 시작하기/g, '')
    .replace(/추가정보 입력하기/g, '')
    .replace(/기본정보를 입력해주세요/g, '')
    .replace(/나중에 언제든지 변경할 수 있어요/g, '')
    .replace(/프로필 지우기/g, '')
    .replace(/사진 업로드/g, '')
    .replace(/적용/g, '')
    .replace(/별명/g, '')
    .replace(/주제/g, '')
    .replace(/주제 없음/g, '')
    .replace(/주제 선택/g, '')
    .replace(/보류/g, '')
    .replace(/이웃 맺기/g, '')
    .replace(/뒤로가기 버튼/g, '')
    .replace(/선택한 주제의 글과 이웃을 추천받을 수 있어요/g, '')
    .replace(/인기블로거와 이웃을 맺으세요/g, '')
    .replace(/이웃을 맺으면 이웃새글에서 글을 받아볼 수 있어요/g, '')
    .replace(/시작하기/g, '')
    .replace(/기본정보 입력/g, '')
    .replace(/이웃 바로가기/g, '')
    .replace(/내 이웃/g, '')
    .replace(/홈/g, '')
    .replace(/어 켜기/g, '')
    .replace(/프롤로그/g, '')
    .replace(/리얼 체험, 비거리 성공 후기/g, '')
    .replace(/신제품, 비거리 연구/g, '')
    .replace(/스윙 솔루션/g, '')
    .replace(/최신 골프 트렌드, 장비 안부/g, '')
    .replace(/마쓰구 비거리 챌린지/g, '')
    .replace(/공지/g, '')
    .replace(/공지글/g, '')
    .replace(/글 제목/g, '')
    .replace(/작성일/g, '')
    .replace(/URL 복사/g, '')
    .replace(/본문 기타 기능/g, '')
    .replace(/하기/g, '')
    .replace(/이 글에 한 블로거 열고 닫기/g, '')
    .replace(/이 글에 단 블로거 열고 닫기/g, '')
    .replace(/인쇄/g, '')
    .replace(/쓰기/g, '')
    .replace(/이전/g, '')
    .replace(/다음/g, '')
    .replace(/이 전체 글/g, '')
    .replace(/전체글 보기/g, '')
    .replace(/화면 최상단으로 이동/g, '')
    .replace(/글 RSS 2\.0/g, '')
    .replace(/RSS 1\.0/g, '')
    .replace(/ATOM 0\.3/g, '')
    .replace(/안녕하세요\. 이 포스트는 에서 작성된 게시글입니다\. 자세한 내용을 보려면 링크를 클릭해주세요\. 감사합니다\./g, '')
    .replace(/글 보내기 서비스 안내/g, '')
    .replace(/2009년 6월 30일 여행 서비스가 종료되었습니다\. 여행 서비스를 이용해 주신 여러분께 감사드리며, 더 좋은 서비스로 보답할 수 있도록 노력하겠습니다\./g, '')
    .replace(/악성코드가 포함되어 있는 파일입니다\./g, '')
    .replace(/\{FILENAME\}/g, '')
    .replace(/백신 프로그램으로 치료하신 후 다시 첨부하시거나, 치료가 어려우시면 파일을 삭제하시기 바랍니다\./g, '')
    .replace(/백신으로 치료하기/g, '')
    .replace(/고객님의 PC가 악성코드에 감염될 경우 시스템성능 저하, 개인정보 유출등의 피해를 입을 수 있으니 주의하시기 바랍니다\./g, '')
    .replace(/작성자 이외의 방문자에게는 이용이 제한되었습니다\./g, '')
    .replace(/\{ALERTMESSAGE\}/g, '')
    .replace(/이용제한 파일 :/g, '')
    .replace(/내PC 저장/g, '')
    .replace(/N드라이브 저장/g, '')
    .replace(/카메라 모델/g, '')
    .replace(/해상도/g, '')
    .replace(/노출시간/g, '')
    .replace(/노출보정/g, '')
    .replace(/프로그램모드/g, '')
    .replace(/ISO감도/g, '')
    .replace(/조리개값/g, '')
    .replace(/초점길이/g, '')
    .replace(/측광모드/g, '')
    .replace(/촬영일시/g, '')
    .replace(/글보내기 제한 공지/g, '')
    .replace(/침해가 우려되는 컨텐츠가 포함되어 있어 글보내기 기능을 제한합니다\./g, '')
    .replace(/는 를 통해 저작물이 무단으로 되는 것을 막기 위해, 을 침해하는 컨텐츠가 포함되어 있는 게시물의 경우 글보내기 기능을 제한하고 있습니다\./g, '')
    .replace(/상세한 안내를 받고 싶으신 경우 고객센터로 문의주시면 도움드리도록 하겠습니다\./g, '')
    .replace(/건강한 인터넷 환경을 만들어 나갈 수 있도록 고객님의 많은 관심과 협조를 부탁드립니다\./g, '')
    .replace(/주제 분류 제한 공지/g, '')
    .replace(/침해가 우려되는 컨텐츠가 포함되어 있어 주제 분류 기능을 제한합니다\./g, '')
    .replace(/는 를 통해 저작물이 무단으로 되는 것을 막기 위해, 을 침해하는 컨텐츠가 포함되어 있는 게시물의 경우 주제 분류 기능을 제한하고 있습니다\./g, '')
    .replace(/작성하신 게시글 에 사용이 제한된 문구가 포함 되어 일시적으로 등록이 제한됩니다\./g, '')
    .replace(/이용자 분들이 홍보성 도배, 스팸 게시물로 불편을 겪지 않도록 다음과 같은 경우 해당 게시물 등록이 일시적으로 제한됩니다\./g, '')
    .replace(/특정 게시물 대량으로 등록되거나 해당 게시물에서 자주 사용하는 문구가 포함된 경우/g, '')
    .replace(/특정 게시물이 과도하게 반복 작성되거나 해당 게시물에서 자주 사용하는 문구가 포함된 경우/g, '')
    .replace(/스팸 게시물이 확대 생성되는 것을 방지하기 위하여 문구 및 사용 제한기간을 상세하게 안내해 드리지 못하는 점 양해 부탁 드립니다\./g, '')
    .replace(/모두가 행복한 인터넷 문화를 만들기 위한 의 노력이오니 회원님의 양해와 협조 부탁 드립니다\./g, '')
    .replace(/더 궁금하신 사항은 고객센터 로 문의하시면 자세히 알려드리겠습니다\./g, '')
    .replace(/수정하신 후 다시 등록해 주세요\./g, '')
    .replace(/회원님의 안전한 서비스 이용을 위해 비밀번호를 확인해 주세요\./g, '')
    .replace(/다시 한번 비밀번호 확인 하시면 이용중인 화면으로 돌아가며, 작성 중이던 내용을 정상적으로 전송 또는 등록하실 수 있습니다\./g, '')
    .replace(/1일 안부글 작성횟수를 초과하셨습니다\./g, '')
    .replace(/에서는 프로그램을 이용한 안부글 자동등록 방지를 위해 1일 안부글 작성횟수에 제한을 두고 있습니다\./g, '')
    .replace(/고객님이 남기신 안부글에 대한 다수의 가 접수되어 1일 안부글 작성 횟수가 5회 로 제한 되었습니다\./g, '')
    .replace(/는 여러 사람이 함께 모여 즐거움을 나누는 공간으로 모든 분들이 기분좋게 를 이용할 수 있도록 고객님의 이해와 협조 부탁 드립니다\./g, '')
    .replace(/을 삭제하시겠습니까/g, '')
    .replace(/이 글의 수도 함께 차감됩니다\./g, '')
    .replace(/이웃으로 추가하시겠어요/g, '')
    .replace(/마쓰구 마스터/g, '')
    .replace(/마쓰구 비거리 챌린지/g, '')
    .replace(/이웃추가 이웃추가/g, '')
    .replace(/작성하신 에 이용자들의 가 많은 표현이 포함 되어 있습니다\./g, '')
    .replace(/가 많은 표현 다른 표현을 사용해주시기 바랍니다\./g, '')
    .replace(/건전한 인터넷 문화 조성을 위해 회원님의 적극적인 협조를 부탁드립니다\./g, '')
    .replace(/마켓 가입 완료/g, '')
    .replace(/내 상품 관리에서 배송비 후 상품 판매를 시작해보세요/g, '')
    .replace(/배송비 하기/g, '')
    .replace(/마켓 가입 완료/g, '')
    .replace(/마켓 탈퇴가 완료되었습니다\. 문의사항은 마켓 고객센터로 연락주세요\./g, '')
    
    // JSON 데이터 제거
    .replace(/\[\{&#034;title&#034;:[^}]+\}\]/g, '')
    .replace(/\[\{[^}]*"title"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"source"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"blogName"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"domainIdOrBlogId"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"nicknameOrBlogId"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"logNo"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"smartEditorVersion"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"meDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"lineDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"outsideDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"cafeDisplay"[^}]*\}\]/g, '')
    .replace(/\[\{[^}]*"blogDisplay"[^}]*\}\]/g, '')
    
    // 요구사항 텍스트 제거
    .replace(/\*\*요구사항:\*\*/g, '')
    .replace(/1\. 실제 포스트 내용만 추출/g, '')
    .replace(/2\. UI 요소 제거 \(, 메뉴, 등\)/g, '')
    .replace(/3\. 자연스러운 문단 구분/g, '')
    .replace(/4\. 이모지와 특수문자 유지/g, '')
    .replace(/5\. 마케팅 콘텐츠의 핵심 메시지 보존/g, '')
    .replace(/\*\*결과:\*\*/g, '')
    .replace(/깔끔하게 정리된 포스트 내용만 반환해주세요\./g, '')
    .replace(/다음은 에서 추출한 원본 텍스트입니다\./g, '')
    .replace(/실제 블로그 포스트 내용만 추출하여 깔끔하게 정리해주세요\./g, '')
    .replace(/\*\*블로그 정보:\*\*/g, '')
    .replace(/\*\*원본 텍스트:\*\*/g, '')
    .replace(/\*\*정리 요구사항:\*\*/g, '')
    .replace(/\*\*중요:\*\*/g, '')
    .replace(/메타 지시사항이나 요구사항 텍스트는 절대 포함하지 마세요\./g, '')
    .replace(/순수한 블로그 포스트 내용만 반환해 주세요\./g, '')
    
    .replace(/&nbsp;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#034;/g, '"')
    .replace(/&#039;/g, "'")
    
    // 기타 불필요한 텍스트들
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
    .replace(/JavaScript/gi, '')
    .replace(/CSS/gi, '')
    .replace(/HTML/gi, '')
    .replace(/웹표준/g, '')
    .replace(/접근성/g, '')
    .replace(/모바일/g, '')
    .replace(/반응형/g, '')
    .replace(/웹폰트/g, '')
    .replace(/이미지/g, '')
    .replace(/동영상/g, '')
    .replace(/오디오/g, '')
    .replace(/플래시/g, '')
    .replace(/애니메이션/g, '')
    .replace(/슬라이더/g, '')
    .replace(/캐러셀/g, '')
    .replace(/탭/g, '')
    .replace(/아코디언/g, '')
    .replace(/드롭다운/g, '')
    .replace(/메뉴/g, '')
    .replace(/네비게이션/g, '')
    .replace(/사이드바/g, '')
    .replace(/푸터/g, '')
    .replace(/헤더/g, '')
    .replace(/컨테이너/g, '')
    .replace(/레이아웃/g, '')
    .replace(/그리드/g, '')
    .replace(/플렉스/g, '')
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .trim();
  
  console.log(`📊 전체 텍스트 추출 완료: ${extractedText.length}자`);
  console.log(`📝 추출된 텍스트 샘플: ${extractedText.substring(0, 200)}...`);
  
  // 5. 추출된 텍스트가 충분히 긴지 확인
  console.log(`📊 최종 추출된 텍스트 길이: ${extractedText.length}자`);
  if (extractedText.length > 200) { // 임계값을 200자로 낮춤
    console.log('✅ 전체 텍스트 추출 성공');
    console.log(`📝 추출된 텍스트 샘플: ${extractedText.substring(0, 300)}...`);
    
    // 새로운 정제 함수 적용
    const cleanedText = cleanNaverContent(extractedText);
    return cleanedText.substring(0, 10000); // 최대 10000자로 제한
  }
  
  // 2. 네이버 블로그의 다양한 콘텐츠 컨테이너 시도 (더 강력한 선택자들)
  const contentSelectors = [
    // 스마트에디터 4.0 - 가장 최신 버전
    /<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 스마트에디터 3.0
    /<div[^>]*class="[^"]*se-component[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 스마트에디터 2.0
    /<div[^>]*class="[^"]*post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 일반적인 포스트 영역
    /<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>/i,
    // 더 넓은 범위의 콘텐츠 영역
    /<div[^>]*class="[^"]*se-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 본문 영역
    /<div[^>]*class="[^"]*post_ct[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 콘텐츠 영역
    /<div[^>]*class="[^"]*contents[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 더 넓은 범위의 포스트 영역
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 본문 영역 (더 넓은 범위)
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 메인 콘텐츠 영역
    /<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // iframe 내부 콘텐츠 (네이버 블로그는 iframe을 많이 사용)
    /<iframe[^>]*src="[^"]*PostView[^"]*"[^>]*>([\s\S]*?)<\/iframe>/i,
    // 더 일반적인 텍스트 영역
    /<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 본문 텍스트
    /<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 새로운 선택자들 추가
    /<div[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-text-align-[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<p[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    /<span[^>]*class="[^"]*se-text[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    // 네이버 블로그 특화 선택자들 추가
    /<div[^>]*class="[^"]*se-module[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-module-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-text-align-center[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-text-align-left[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-text-align-right[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-text-align-justify[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<p[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    /<span[^>]*class="[^"]*se-text[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    // 더 넓은 범위의 선택자들
    /<div[^>]*class="[^"]*se-component-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-component-wrap[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-layout[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se-layout-cell[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 네이버 블로그 본문 영역 (더 정확한 선택자)
    /<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*blog-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];

  let allContents = [];
  let bestContent = '';
  let bestLength = 0;
  
  for (let i = 0; i < contentSelectors.length; i++) {
    const selector = contentSelectors[i];
    const match = html.match(selector);
    if (match && match[1]) {
      let content = match[1].trim();
      console.log(`📝 선택자 ${i + 1}에서 콘텐츠 발견, 길이: ${content.length}`);
      
      // HTML 태그 제거하고 텍스트만 추출
      content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      content = content.replace(/<[^>]+>/g, ' ');
      content = content.replace(/\s+/g, ' ').trim();
      
      // 유효한 콘텐츠만 수집
      if (content.length > 50) {
        allContents.push(content);
        console.log(`📊 유효한 콘텐츠 수집: ${content.length}자 - ${content.substring(0, 100)}...`);
        
        // 더 긴 콘텐츠를 우선 선택
        if (content.length > bestLength) {
          bestContent = content;
          bestLength = content.length;
        }
      }
    }
  }
  
  // 여러 선택자에서 추출한 콘텐츠를 조합
  if (allContents.length > 1) {
    console.log(`🔄 ${allContents.length}개의 콘텐츠 조각을 조합합니다...`);
    
    // 중복 제거 및 조합
    const uniqueContents = [...new Set(allContents)];
    const combinedContent = uniqueContents.join(' ').replace(/\s+/g, ' ').trim();
    
    console.log(`📊 조합된 콘텐츠 길이: ${combinedContent.length}자`);
    
    // 조합된 콘텐츠가 더 길면 사용
    if (combinedContent.length > bestLength) {
      bestContent = combinedContent;
      bestLength = combinedContent.length;
      console.log(`✅ 조합된 콘텐츠 사용: ${bestLength}자`);
    }
  }
  
  // 가장 긴 콘텐츠가 있으면 반환
  if (bestContent.length > 0) {
    console.log(`✅ 최적 콘텐츠 추출 성공: ${bestLength}자`);
    return bestContent;
  }

  // 3. 마지막 시도: 전체 HTML에서 텍스트 추출 (개선된 버전)
  console.log('🔄 전체 HTML에서 텍스트 추출 시도...');
  let fallbackContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`📊 전체 HTML 텍스트 길이: ${fallbackContent.length}`);
  
  // 네이버 블로그 관련 텍스트 제거 (더 정교하게)
  fallbackContent = fallbackContent
    .replace(/네이버 블로그/g, '')
    .replace(/블로그/g, '')
    .replace(/Naver Blog/gi, '')
    .replace(/네이버/g, '')
    .replace(/Naver/gi, '')
    .replace(/로그인/g, '')
    .replace(/회원가입/g, '')
    .replace(/검색/g, '')
    .replace(/카테고리/g, '')
    .replace(/태그/g, '')
    .replace(/댓글/g, '')
    .replace(/공유/g, '')
    .replace(/좋아요/g, '')
    .replace(/구독/g, '')
    .replace(/이웃/g, '')
    .replace(/방문자/g, '')
    .replace(/조회수/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`📊 정리 후 텍스트 길이: ${fallbackContent.length}`);
  
  // 4. og:description과 fallback 콘텐츠 중 더 긴 것을 선택
  if (fallbackContent.length > ogDescription.length && fallbackContent.length > 100) {
    const result = fallbackContent.substring(0, 5000); // 5000자로 확장
    console.log(`✅ 전체 HTML에서 콘텐츠 추출 성공: ${result.substring(0, 100)}...`);
    return result;
  } else if (ogDescription.length > 0) {
    console.log(`✅ og:description 사용: ${ogDescription.substring(0, 100)}...`);
    return ogDescription;
  }

  console.log('❌ 콘텐츠 추출 실패');
  return '콘텐츠를 추출할 수 없습니다.';
}

// 네이버 블로그 이미지 추출
function extractNaverImages(html) {
  console.log('🖼️ 이미지 추출 시작...');
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    
    if (!src) continue;

    console.log(`🖼️ 이미지 발견: ${src}`);

    // 실제 포스트 이미지만 필터링 (UI 이미지 제외)
    if (src.includes('postfiles.pstatic.net') || 
        src.includes('blogfiles.naver.net')) {
      images.push({
        src: src,
        alt: '',
        fileName: extractFileName(src),
        fileExtension: extractFileExtension(src),
        isNaverImage: true
      });
      console.log(`✅ 포스트 이미지 추가: ${src}`);
    } else if (src.includes('naver.com') || src.includes('pstatic.net')) {
      // UI 이미지는 제외하지만 로그는 남김
      console.log(`⚠️ UI 이미지 제외: ${src}`);
    } else {
      console.log(`⚠️ 네이버 이미지가 아님: ${src}`);
    }
  }

  console.log(`📊 총 ${images.length}개 이미지 추출됨`);
  return images;
}

// 네이버 블로그 발행일 추출
function extractNaverPublishDate(html) {
  const dateRegex = /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i;
  const match = html.match(dateRegex);
  return match ? match[1].trim() : '';
}

// 네이버 블로그 카테고리 추출
function extractNaverCategory(html) {
  // 네이버 블로그의 카테고리 추출 시도
  const categoryRegexes = [
    /<span[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<a[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/a>/i,
    /<div[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/div>/i,
    /카테고리[:\s]*([^<\n]+)/i
  ];
  
  for (const regex of categoryRegexes) {
    const match = html.match(regex);
    if (match && match[1]) {
      const category = match[1].trim();
      // 골프 관련 키워드가 포함된 경우 골프 카테고리로 분류
      if (category.includes('골프') || category.includes('golf') || category.includes('드라이버') || category.includes('클럽')) {
        return '골프';
      }
      return category;
    }
  }
  
  // 기본값: 골프 (마쓰구골프 블로그이므로)
  return '골프';
}

// 파일명 추출 (URL 디코딩 포함)
function extractFileName(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    // URL 디코딩 시도
    try {
      const decodedFilename = decodeURIComponent(filename);
      return decodedFilename || `image-${Date.now()}`;
    } catch (decodeError) {
      console.log('⚠️ 파일명 디코딩 실패, 원본 사용:', filename);
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