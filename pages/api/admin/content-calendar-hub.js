import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 채널별 최적화 함수들
function optimizeForBlog(originalContent) {
  return {
    title: originalContent.title,
    content: originalContent.content,
    excerpt: originalContent.content.substring(0, 200) + '...',
    category: originalContent.category || '골프',
    status: 'draft',
    meta_title: originalContent.title,
    meta_description: originalContent.content.substring(0, 160),
    meta_keywords: extractKeywords(originalContent.content),
    author: '마쓰구골프',
    published_at: originalContent.content_date ? new Date(originalContent.content_date).toISOString() : null
  };
}

function optimizeForNaverBlog(originalContent) {
  return {
    title: addNaverKeywords(originalContent.title),
    content: formatForNaver(originalContent.content),
    category: '골프',
    status: 'draft',
    tags: extractNaverTags(originalContent.content),
    author: '마쓰구골프',
    published_at: originalContent.content_date ? new Date(originalContent.content_date).toISOString() : null
  };
}

function optimizeForSMS(originalContent) {
  const compressedContent = compressTo160Chars(originalContent.content);
  return {
    message: compressedContent,
    call_to_action: extractCTA(originalContent.content),
    status: 'draft',
    scheduled_at: originalContent.content_date ? new Date(originalContent.content_date).toISOString() : null
  };
}

function optimizeForKakao(originalContent) {
  return {
    title: originalContent.title,
    content: formatForKakao(originalContent.content),
    status: 'draft',
    scheduled_at: originalContent.content_date ? new Date(originalContent.content_date).toISOString() : null
  };
}

// 유틸리티 함수들
function extractKeywords(content) {
  const keywords = ['골프', '드라이버', '비거리', '스윙', '피팅'];
  return keywords.join(', ');
}

function addNaverKeywords(title) {
  return `${title} | 골프 전문점 마쓰구골프`;
}

function formatForNaver(content) {
  return content.replace(/\n/g, '<br>');
}

function extractNaverTags(content) {
  return ['골프', '드라이버', '비거리', '마쓰구골프'];
}

function compressTo160Chars(content) {
  if (content.length <= 160) return content;
  return content.substring(0, 157) + '...';
}

function extractCTA(content) {
  if (content.includes('체험')) return '무료 체험 신청';
  if (content.includes('할인')) return '할인 혜택 받기';
  return '자세히 보기';
}

function formatForKakao(content) {
  return content.substring(0, 500);
}

export default async function handler(req, res) {
  console.log('🔍 콘텐츠 캘린더 허브 API 요청:', req.method, req.url);
  
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 환경 변수 확인
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수 누락');
    return res.status(500).json({ 
      error: '서버 설정 오류: 환경 변수가 설정되지 않았습니다.'
    });
  }
  
  try {
    if (req.method === 'POST') {
      // 원본 콘텐츠 생성 및 모든 채널로 파생
      console.log('📝 원본 콘텐츠 생성 및 파생 시작...');
      
      const { title, content, content_date, target_audience, conversion_goal, autoDerive = true } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: '제목과 내용은 필수입니다.' });
      }
      
      // 1. 원본 콘텐츠를 콘텐츠 캘린더에 생성
      const originalContentData = {
        title,
        content_body: content,
        content_type: 'original',
        content_date: content_date || new Date().toISOString().split('T')[0],
        status: 'draft',
        target_audience: target_audience || {
          persona: '시니어 골퍼',
          stage: 'awareness'
        },
        conversion_goal: conversion_goal || '홈페이지 방문',
        published_channels: [],
        is_root_content: true,
        derived_content_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: originalContent, error: originalError } = await supabase
        .from('cc_content_calendar')
        .insert([originalContentData])
        .select()
        .single();
      
      if (originalError) {
        console.error('❌ 원본 콘텐츠 생성 에러:', originalError);
        return res.status(500).json({
          error: '원본 콘텐츠를 생성할 수 없습니다.',
          details: originalError.message
        });
      }
      
      console.log('✅ 원본 콘텐츠 생성 성공:', originalContent.id);
      
      const derivedContents = [];
      
      if (autoDerive) {
        // 2. 모든 채널로 파생 콘텐츠 생성
        const channels = [
          { name: 'blog', optimize: optimizeForBlog },
          { name: 'naver_blog', optimize: optimizeForNaverBlog },
          { name: 'sms', optimize: optimizeForSMS },
          { name: 'kakao', optimize: optimizeForKakao }
        ];
        
        for (const channel of channels) {
          try {
            const optimizedData = channel.optimize(originalContent);
            
            // 각 채널별 테이블에 저장
            let channelData;
            let tableName;
            
            switch (channel.name) {
              case 'blog':
                tableName = 'blog_posts';
                channelData = {
                  ...optimizedData,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                break;
              case 'naver_blog':
                tableName = 'naver_blog_posts';
                channelData = {
                  ...optimizedData,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                break;
              case 'sms':
                tableName = 'sms_messages';
                channelData = {
                  ...optimizedData,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                break;
              case 'kakao':
                tableName = 'kakao_messages';
                channelData = {
                  ...optimizedData,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                break;
            }
            
            const { data: channelContent, error: channelError } = await supabase
              .from(tableName)
              .insert([channelData])
              .select()
              .single();
            
            if (channelError) {
              console.warn(`⚠️ ${channel.name} 채널 생성 실패:`, channelError);
            } else {
              console.log(`✅ ${channel.name} 채널 생성 성공:`, channelContent.id);
              derivedContents.push({
                channel: channel.name,
                id: channelContent.id,
                status: 'created'
              });
            }
            
          } catch (error) {
            console.warn(`⚠️ ${channel.name} 채널 최적화 실패:`, error);
          }
        }
        
        // 3. 원본 콘텐츠에 파생 정보 업데이트
        const { error: updateError } = await supabase
          .from('cc_content_calendar')
          .update({
            derived_content_count: derivedContents.length,
            published_channels: derivedContents.map(d => d.channel),
            updated_at: new Date().toISOString()
          })
          .eq('id', originalContent.id);
        
        if (updateError) {
          console.warn('⚠️ 원본 콘텐츠 업데이트 실패:', updateError);
        }
      }
      
      return res.status(201).json({
        success: true,
        originalContent,
        derivedContents,
        message: `원본 콘텐츠와 ${derivedContents.length}개 채널 파생 콘텐츠가 생성되었습니다.`
      });
      
    } else if (req.method === 'GET') {
      // 콘텐츠 캘린더 허브 데이터 조회 (원본 + 파생 관계)
      console.log('📅 콘텐츠 캘린더 허브 데이터 조회...');
      
      const { data: contents, error } = await supabase
        .from('cc_content_calendar')
        .select('*')
        .order('content_date', { ascending: false });
      
      if (error) {
        console.error('❌ 콘텐츠 캘린더 조회 에러:', error);
        return res.status(500).json({
          error: '콘텐츠 캘린더 데이터를 불러올 수 없습니다.',
          details: error.message
        });
      }
      
      // 파생 관계 정보 추가
      const contentsWithDerivations = await Promise.all(
        contents.map(async (content) => {
          const derivations = [];
          
          // 각 채널별 파생 콘텐츠 조회
          if (content.published_channels) {
            for (const channel of content.published_channels) {
              try {
                let tableName;
                switch (channel) {
                  case 'blog':
                    tableName = 'blog_posts';
                    break;
                  case 'naver_blog':
                    tableName = 'naver_blog_posts';
                    break;
                  case 'sms':
                    tableName = 'sms_messages';
                    break;
                  case 'kakao':
                    tableName = 'kakao_messages';
                    break;
                  default:
                    continue;
                }
                
                const { data: channelData } = await supabase
                  .from(tableName)
                  .select('id, title, status, created_at')
                  .eq('parent_content_id', content.id)
                  .single();
                
                if (channelData) {
                  derivations.push({
                    channel,
                    id: channelData.id,
                    title: channelData.title,
                    status: channelData.status,
                    created_at: channelData.created_at
                  });
                }
              } catch (error) {
                console.warn(`⚠️ ${channel} 채널 데이터 조회 실패:`, error);
              }
            }
          }
          
          return {
            ...content,
            derivations
          };
        })
      );
      
      return res.status(200).json({
        success: true,
        contents: contentsWithDerivations,
        total: contentsWithDerivations.length
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ 콘텐츠 캘린더 허브 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
