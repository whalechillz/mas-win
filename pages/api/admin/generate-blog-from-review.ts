/**
 * 고객 후기로부터 AI 블로그 초안 생성 API
 * Phase 5: 스토리보드 + 후기 통합 또는 후기 중심 블로그 생성
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// 스토리브랜드 7단계 구조
const STORYBRAND_7_STEPS = {
  1: '행복한 주인공 (고객의 평범한 일상)',
  2: '행복+불안 전조 (문제의 조짐)',
  3: '문제 발생 (명확한 문제)',
  4: '가이드 만남 (마쓰구골프 전문가)',
  5: '가이드 장소 (맞춤 피팅, 제품 추천)',
  6: '성공 회복 (문제 해결, 성과 달성)',
  7: '여운 정적 (지속적인 만족, 추천)'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      reviewId, // 선택사항 (없으면 스토리보드만 사용)
      customerId,
      reviewContent, // 선택사항
      reviewImages = [],
      referencedReviewIds = [], // 참조할 기존 글 ID 배열
      blogType = 'storyboard', // 'storyboard' | 'integrated' | 'review-only'
      framework = 'storybrand',
      anonymizeName = false // 이름 익명화 옵션
    } = req.body;

    // customerId는 필수
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'customerId가 필요합니다.'
      });
    }

    // reviewId가 없으면 스토리보드 중심 생성
    let finalBlogType = blogType;
    if (!reviewId && blogType !== 'storyboard') {
      finalBlogType = 'storyboard';
      console.log('⚠️ reviewId가 없어 스토리보드 중심 생성으로 변경');
    }

    console.log('🚀 블로그 생성 시작:', { reviewId, customerId, blogType: finalBlogType, referencedReviewIds });

    // 1. 고객 정보 조회
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, vip_level')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error('고객 정보를 찾을 수 없습니다.');
    }

    // 1.5. 이름 익명화 처리 (미리 계산)
    let displayName = customer.name;
    if (anonymizeName && customer.name && customer.name.length > 1) {
      // 예: "임태희" -> "임O희", "최석호" -> "최O호"
      const firstChar = customer.name[0];
      const lastChar = customer.name[customer.name.length - 1];
      displayName = `${firstChar}${'O'.repeat(Math.max(1, customer.name.length - 2))}${lastChar}`;
    }

    // 2. 스토리보드 데이터 조회 (항상 조회 - 스토리보드 중심이 기본)
    let storyboardData = null;
    let imageAnalyses: Record<number, { description: string; keywords: string[] }> = {};
    
    // 고객 이미지 및 장면 설명 조회 (스토리보드 중심 또는 통합형인 경우)
    if (finalBlogType === 'storyboard' || finalBlogType === 'integrated') {
      // 고객 이미지 및 장면 설명 조회
      // customer_id 컬럼이 비어있을 수 있으므로 tags 배열을 사용하여 조회
      const { data: images, error: imagesError } = await supabase
        .from('image_assets')
        .select('*')
        .contains('ai_tags', [`customer-${customerId}`]) // ai_tags 배열에 customer-{id} 포함
        // ⚠️ image_assets에는 story_scene, is_scene_representative, display_order가 없음
        .order('created_at', { ascending: true });
      
      if (imagesError) {
        console.error('❌ 이미지 조회 오류:', imagesError);
      }

      // 장면 설명 조회
      const { data: scenes } = await supabase
        .from('customer_story_scenes')
        .select('*')
        .eq('customer_id', customerId)
        .order('scene_number', { ascending: true });

      storyboardData = {
        images: images || [],
        scenes: scenes || []
      };
      
      console.log(`📊 storyboardData 설정 완료: 이미지 ${storyboardData.images.length}개, 장면 ${storyboardData.scenes.length}개`);
      if (images && images.length > 0) {
        console.log(`📋 이미지 목록 (최대 5개):`, images.slice(0, 5).map((img: any) => ({
          id: img.id,
          scene: img.story_scene,
          isRep: img.is_scene_representative,
          filename: img.english_filename,
          url: img.image_url?.substring(0, 60) + '...',
          urlValid: img.image_url?.startsWith('http')
        })));
      } else {
        console.warn('⚠️ story_scene이 할당된 이미지가 없습니다.');
        console.warn(`⚠️ customer_id: ${String(customerId)}`);
      }

      // 2.5. 스토리보드 이미지 분석 (하이브리드 방식 C) - 통합형인 경우에만
      if (finalBlogType === 'integrated' && storyboardData?.images && storyboardData.images.length > 0) {
        console.log('🖼️ 스토리보드 이미지 분석 시작 (하이브리드 방식)...');
        
        // 대표 이미지 선택 함수
        const getRepresentativeImages = (images: any[]) => {
          const sceneRepresentativeImages: Record<number, any> = {};
          
          // 1순위: is_scene_representative = true인 이미지
          images.forEach((img: any) => {
            if (img.is_scene_representative && img.story_scene) {
              if (!sceneRepresentativeImages[img.story_scene]) {
                sceneRepresentativeImages[img.story_scene] = img;
              }
            }
          });
          
          // 2순위: display_order가 가장 낮은 이미지 (대표가 없는 장면)
          images.forEach((img: any) => {
            if (!sceneRepresentativeImages[img.story_scene] && img.story_scene) {
              const existing = sceneRepresentativeImages[img.story_scene];
              if (!existing || (img.display_order || 0) < (existing.display_order || 0)) {
                sceneRepresentativeImages[img.story_scene] = img;
              }
            }
          });
          
          return sceneRepresentativeImages;
        };
        
        const representativeImages = getRepresentativeImages(storyboardData.images);
        const representativeImageList = Object.values(representativeImages);
        const otherImages = storyboardData.images.filter((img: any) => 
          !representativeImageList.some((rep: any) => rep.id === img.id)
        );
        
        console.log(`📊 분석 대상: 대표 이미지 ${representativeImageList.length}개, 나머지 ${otherImages.length}개`);
        
        // 대표 이미지들을 GPT-4o로 한 번에 분석 (맥락 통합)
        if (representativeImageList.length > 0) {
          try {
            const visionResponse = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `당신은 골프 스토리보드 이미지를 분석하는 전문가입니다. 
여러 장면의 대표 이미지를 보고 각 장면의 내용, 분위기, 감정을 한국어로 상세히 설명해주세요.
각 장면은 스토리브랜드 7단계 구조의 일부입니다.`
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `이것은 고객 "${displayName}"님의 스토리보드 대표 이미지들입니다.
총 ${representativeImageList.length}개 장면의 대표 이미지를 분석해주세요.

고객 후기:
${reviewContent}

각 장면별로 다음 정보를 제공해주세요:
1. 장면 설명 (2-3문장)
2. 주요 키워드 (5-8개, 쉼표로 구분)
3. 감정/분위기

응답 형식 (JSON):
{
  "scenes": [
    {
      "scene_number": 1,
      "description": "장면 설명",
      "keywords": "키워드1, 키워드2, 키워드3",
      "emotion": "감정/분위기"
    }
  ]
}`
                    },
                    ...representativeImageList.slice(0, 20).map((img: any) => ({
                      type: 'image_url',
                      image_url: { 
                        url: img.cdn_url || img.image_url,
                        detail: 'low' // 비용 절감
                      }
                    }))
                  ]
                }
              ],
              response_format: { type: 'json_object' },
              max_tokens: 2000,
              temperature: 0.7
            });
            
            const visionContent = visionResponse.choices[0].message.content?.trim() || '';
            const visionResult = JSON.parse(visionContent);
            
            // 대표 이미지 분석 결과 저장
            if (visionResult.scenes && Array.isArray(visionResult.scenes)) {
              visionResult.scenes.forEach((scene: any) => {
                imageAnalyses[scene.scene_number] = {
                  description: scene.description || '',
                  keywords: scene.keywords ? scene.keywords.split(',').map((k: string) => k.trim()) : []
                };
              });
            }
            
            console.log('✅ 대표 이미지 분석 완료 (GPT-4o):', Object.keys(imageAnalyses).length, '개 장면');
            
          } catch (error) {
            console.warn('⚠️ GPT-4o 분석 실패, gpt-4o-mini로 대체:', error);
            // 실패 시 gpt-4o-mini로 대체 처리
          }
        }
        
        // 나머지 이미지는 gpt-4o-mini로 병렬 처리 (기존 API 활용)
        if (otherImages.length > 0) {
          console.log(`🔄 나머지 ${otherImages.length}개 이미지 분석 시작 (gpt-4o-mini)...`);
          
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const otherAnalysisPromises = otherImages.slice(0, 20).map(async (img: any) => {
            try {
              const response = await fetch(`${baseUrl}/api/analyze-image-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: img.cdn_url || img.image_url,
                  title: `장면 ${img.story_scene}`,
                  excerpt: `스토리보드 ${img.story_scene}단계 이미지`
                })
              });
              
              const result = await response.json();
              
              if (result.success && img.story_scene) {
                // 기존 분석 결과에 키워드 추가 (설명은 대표 이미지 분석 결과 우선)
                if (!imageAnalyses[img.story_scene]) {
                  imageAnalyses[img.story_scene] = {
                    description: result.description || '',
                    keywords: result.keywords ? result.keywords.split(',').map((k: string) => k.trim()) : []
                  };
                } else {
                  // 키워드만 추가 (중복 제거)
                  const existingKeywords = imageAnalyses[img.story_scene].keywords || [];
                  const newKeywords = result.keywords ? result.keywords.split(',').map((k: string) => k.trim()) : [];
                  imageAnalyses[img.story_scene].keywords = [
                    ...new Set([...existingKeywords, ...newKeywords])
                  ];
                }
              }
            } catch (error) {
              console.warn(`⚠️ 이미지 ${img.id} 분석 실패:`, error);
            }
          });
          
          await Promise.all(otherAnalysisPromises);
          console.log('✅ 나머지 이미지 분석 완료 (gpt-4o-mini)');
        }
        
        console.log('✅ 전체 이미지 분석 완료:', Object.keys(imageAnalyses).length, '개 장면');
      }
    }

    // 3. 참조 글 내용 조회 (있는 경우)
    let referencedContent = '';
    if (referencedReviewIds && referencedReviewIds.length > 0) {
      const { data: referencedReviews } = await supabase
        .from('customer_consultations')
        .select('content, blog_draft_content, topic')
        .in('id', referencedReviewIds);
      
      if (referencedReviews && referencedReviews.length > 0) {
        referencedContent = referencedReviews
          .map(r => {
            const title = r.topic || '제목 없음';
            const content = r.blog_draft_content || r.content || '';
            return `[참조: ${title}]\n${content}`;
          })
          .join('\n\n---\n\n');
        
        console.log(`📚 참조 글 ${referencedReviews.length}개 로드 완료`);
      }
    }

    // 4. 연결된 이미지 메타데이터 조회
    let reviewImageMetadata: any[] = [];
    if (reviewImages && reviewImages.length > 0) {
      const { data: images } = await supabase
        .from('image_assets')
        .select('*')
        .in('id', reviewImages);

      reviewImageMetadata = images || [];
    }

    // 5. 최종 후기 내용 결정 (원본 후기 > 참조 내용 > 빈 문자열)
    const finalReviewContent = reviewContent || referencedContent || '';

    // 6. AI 프롬프트 생성
    const prompt = buildPrompt({
      customer: { ...customer, name: displayName }, // 익명화된 이름 사용
      reviewContent: finalReviewContent,
      blogType: finalBlogType,
      storyboardData,
      reviewImageMetadata,
      imageAnalyses,
      referencedContent: referencedContent || null
    });

    console.log('📝 프롬프트 생성 완료, AI 호출 시작...');

    // 7. OpenAI API 호출
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: finalBlogType === 'storyboard'
            ? '당신은 스토리브랜드 7단계 구조를 활용하여 고객의 골프 여정을 감동적인 이야기로 만드는 전문 작가입니다. 스토리보드의 장면 설명과 이미지를 바탕으로 자연스럽고 감동적인 블로그 포스트를 작성합니다.'
            : finalBlogType === 'integrated'
            ? '당신은 스토리브랜드 7단계 구조를 활용하여 고객의 골프 여정을 감동적인 이야기로 만드는 전문 작가입니다. 고객의 후기와 스토리보드를 통합하여 자연스럽고 감동적인 블로그 포스트를 작성합니다.'
            : '당신은 고객의 직접 경험을 중심으로 한 진솔한 후기 블로그를 작성하는 전문 작가입니다. 고객의 관점에서 1인칭으로 작성하며, 감정과 경험을 생생하게 전달합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const aiContent = aiResponse.choices[0].message.content?.trim() || '';

    console.log('✅ AI 응답 받음:', aiContent.substring(0, 200) + '...');

    // 6. AI 응답 파싱 (JSON 형식)
    let parsedContent;
    try {
      // JSON 코드 블록 제거 (```json ... ``` 형식)
      let cleanedContent = aiContent.trim();
      
      // 마크다운 코드 블록 제거
      if (cleanedContent.startsWith('```')) {
        const jsonMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[1].trim();
        } else {
          // ``` 없이 시작하는 경우 첫 줄과 마지막 줄 제거 시도
          cleanedContent = cleanedContent.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
        }
      }
      
      parsedContent = JSON.parse(cleanedContent);
      
      // 파싱된 content 검증
      if (!parsedContent.content || typeof parsedContent.content !== 'string') {
        throw new Error('content 필드가 유효하지 않습니다.');
      }
      
      console.log('✅ JSON 파싱 성공:', {
        title: parsedContent.title?.substring(0, 50),
        contentLength: parsedContent.content.length,
        hasKeywords: !!parsedContent.seoKeywords
      });
      
    } catch (parseError) {
      console.warn('⚠️ JSON 파싱 실패, 직접 파싱 시도:', parseError);
      
      // JSON이 아니면 직접 파싱
      // AI가 마크다운 형식으로 직접 반환한 경우
      parsedContent = {
        title: extractTitle(aiContent),
        summary: extractSummary(aiContent),
        content: aiContent, // 마크다운 형식의 전체 내용
        seoKeywords: [],
        imagePoints: []
      };
      
      // content에서 JSON 구조 제거 시도
      if (parsedContent.content.includes('"title"') && parsedContent.content.includes('"content"')) {
        // JSON 구조가 포함된 경우 content 필드만 추출 시도
        try {
          // JSON 문자열에서 content 필드 추출 (이스케이프 처리 고려)
          const jsonMatch = parsedContent.content.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          if (jsonMatch) {
            parsedContent.content = jsonMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          } else {
            // 멀티라인 JSON 시도
            const multilineMatch = parsedContent.content.match(/"content"\s*:\s*"([\s\S]*?)"\s*[,}]/);
            if (multilineMatch) {
              parsedContent.content = multilineMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
          }
        } catch {}
      }
    }

    // 7. 블로그 포스트 생성
    // content 필드 검증 및 정리
    let finalContent = parsedContent.content || '';
    if (typeof finalContent !== 'string') {
      finalContent = String(finalContent);
    }

    // JSON 구조가 남아있는지 확인하고 제거
    if (finalContent.trim().startsWith('{') && finalContent.includes('"content"')) {
      console.warn('⚠️ content에 JSON 구조가 포함되어 있음, 정리 중...');
      try {
        // JSON 파싱 시도
        const parsed = JSON.parse(finalContent);
        if (parsed.content && typeof parsed.content === 'string') {
          finalContent = parsed.content;
          console.log('✅ JSON에서 content 필드 추출 성공');
        } else {
          // content 필드가 없으면 JSON 문자열에서 추출 시도
          const jsonMatch = finalContent.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          if (jsonMatch) {
            finalContent = jsonMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            console.log('✅ 정규식으로 content 필드 추출 성공');
          }
        }
      } catch (parseErr) {
        console.warn('⚠️ JSON 정리 실패, 원본 사용:', parseErr);
        // 파싱 실패 시 JSON 구조 제거 시도
        const jsonMatch = finalContent.match(/"content"\s*:\s*"([\s\S]*?)"\s*[,}]/);
        if (jsonMatch) {
          finalContent = jsonMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
    }

    // 최종 content 검증
    if (!finalContent || finalContent.trim().length === 0) {
      throw new Error('블로그 본문 내용이 없습니다.');
    }

    // 7.5. 스토리보드 이미지 자동 배치 (스토리보드 중심 또는 통합형인 경우)
    if ((finalBlogType === 'storyboard' || finalBlogType === 'integrated') && storyboardData?.images) {
      console.log('🖼️ 스토리보드 이미지 자동 배치 시작...');
      console.log(`📊 finalBlogType: ${finalBlogType}`);
      console.log(`📊 storyboardData.images 수: ${storyboardData.images.length}개`);
      
      // 이미지 URL 정규화 함수
      const normalizeImageUrl = (url: string | null | undefined): string | null => {
        if (!url) {
          console.warn('⚠️ 이미지 URL이 없습니다.');
          return null;
        }
        
        // 이미 전체 URL인 경우 그대로 반환
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        
        // Supabase Storage 경로인 경우 전체 URL로 변환
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
        
        // /storage/v1/object/public/로 시작하는 경우
        if (url.startsWith('/storage/')) {
          return `${supabaseUrl}${url}`;
        }
        
        // blog-images만 있으면 경로 구성
        if (url.includes('blog-images')) {
          const pathMatch = url.match(/blog-images\/(.+)/);
          if (pathMatch) {
            return `${supabaseUrl}/storage/v1/object/public/blog-images/${pathMatch[1]}`;
          }
          // blog-images/로 시작하는 경우
          if (url.startsWith('blog-images/')) {
            return `${supabaseUrl}/storage/v1/object/public/${url}`;
          }
        }
        
        // 상대 경로인 경우 경고
        console.warn('⚠️ 상대 경로 이미지 URL 발견:', url);
        return null; // 상대 경로는 사용하지 않음
      };
      
      // 장면별 대표 이미지 우선 선택
      const sceneImages: Record<number, any> = {};
      storyboardData.images.forEach((img: any) => {
        if (img.story_scene && img.story_scene >= 1 && img.story_scene <= 7) {
          // 이미지 URL 정규화
          const normalizedUrl = normalizeImageUrl(img.image_url);
          if (!normalizedUrl) {
            console.warn(`⚠️ 이미지 URL이 유효하지 않음:`, img.cdn_url || img.image_url);
            return; // 이 이미지는 건너뛰기
          }
          
          // 정규화된 URL로 업데이트
          const normalizedImg = { ...img, image_url: normalizedUrl };
          
          // 대표 이미지 우선
          if (img.is_scene_representative) {
            if (!sceneImages[img.story_scene]) {
              sceneImages[img.story_scene] = normalizedImg;
            }
          } else if (!sceneImages[img.story_scene]) {
            // 대표 이미지가 없으면 첫 번째 이미지
            sceneImages[img.story_scene] = normalizedImg;
          }
        }
      });
      
      console.log(`📊 장면별 이미지 선택 완료: ${Object.keys(sceneImages).length}개 장면`);
      
      // 장면 번호 순서대로 이미지 삽입
      const sortedScenes = Object.keys(sceneImages)
        .map(Number)
        .sort((a, b) => a - b);
      
      if (sortedScenes.length === 0) {
        console.warn('⚠️ 배치할 스토리보드 이미지가 없습니다.');
        console.warn('⚠️ 이미지 목록:', storyboardData.images.map((img: any) => ({
          id: img.id,
          scene: img.story_scene,
          filename: img.english_filename,
          url: (img.cdn_url || img.image_url)?.substring(0, 80) + '...',
          isValid: img.image_url?.startsWith('http')
        })));
      } else {
        console.log(`📋 배치할 장면: ${sortedScenes.join(', ')}`);
        // 이미지 삽입 위치를 역순으로 처리 (앞에서 삽입하면 인덱스가 변경되므로)
        const insertions: Array<{ position: number; markdown: string; sceneNum: number }> = [];
        
        for (const sceneNum of sortedScenes) {
          const img = sceneImages[sceneNum];
          const sceneName = STORYBRAND_7_STEPS[sceneNum as keyof typeof STORYBRAND_7_STEPS] || `장면 ${sceneNum}`;
          
          // 이미지 URL이 이미 정규화되어 있으므로 그대로 사용
          if (!img.image_url || (!img.image_url.startsWith('http://') && !img.image_url.startsWith('https://'))) {
            console.warn(`⚠️ 장면 ${sceneNum} 이미지 URL이 유효하지 않음:`, img.image_url);
            continue; // 이 이미지는 건너뛰기
          }
          
          const imageMarkdown = `\n\n![${img.alt_text || sceneName}](${img.image_url})\n\n`;
          
          // 장면 번호나 장면 이름이 포함된 부분 찾기 (더 넓은 범위로 검색)
          const sceneNameBase = sceneName.split('(')[0].trim();
          const sceneNameEscaped = sceneNameBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const sceneNameWithPlus = sceneNameBase.replace(/\+/g, '\\+');
          
          const scenePatterns = [
            // 마크다운 헤더 패턴 (##, ###)
            new RegExp(`(##?\\s*${sceneNameEscaped}[^\\n]*\\n)`, 'i'),
            new RegExp(`(##?\\s*${sceneNameWithPlus}[^\\n]*\\n)`, 'i'),
            new RegExp(`(##?\\s*[^\\n]*${sceneNameEscaped}[^\\n]*\\n)`, 'i'),
            // 장면 번호가 포함된 문단 (예: "장면 1", "1단계", "1.")
            new RegExp(`(장면\\s*${sceneNum}[^\\n]*\\n[^\\n]*)`, 'i'),
            new RegExp(`(${sceneNum}\\s*단계[^\\n]*\\n[^\\n]*)`, 'i'),
            new RegExp(`(${sceneNum}\\.\\s*[^\\n]*\\n[^\\n]*)`, 'i'),
            // 장면 이름이 포함된 문단 (이스케이프 처리)
            new RegExp(`(${sceneNameEscaped}[^\\n]*\\n[^\\n]*)`, 'i'),
            new RegExp(`(${sceneNameWithPlus}[^\\n]*\\n[^\\n]*)`, 'i'),
            // 스토리브랜드 단계 설명 (예: "행복한 주인공", "문제 발생")
            new RegExp(`(${sceneNameBase}[^\\n]*\\n[^\\n]*)`, 'i'),
            // 유사 표현 인식 (장면별)
            ...(sceneNum === 2 ? [
              new RegExp(`(행복.*불안.*전조|전조.*행복.*불안|불안.*전조|전조.*불안)[^\\n]*\\n[^\\n]*`, 'i'),
              new RegExp(`(변화.*조짐|조짐.*변화|미묘.*변화)[^\\n]*\\n[^\\n]*`, 'i')
            ] : []),
            ...(sceneNum === 3 ? [
              new RegExp(`(문제.*발생|발생.*문제|명확.*문제|문제.*명확)[^\\n]*\\n[^\\n]*`, 'i'),
              new RegExp(`(고민.*시작|시작.*고민|어려움.*시작)[^\\n]*\\n[^\\n]*`, 'i')
            ] : []),
            ...(sceneNum === 1 ? [
              new RegExp(`(행복.*주인공|주인공.*행복|평범.*일상|일상.*평범)[^\\n]*\\n[^\\n]*`, 'i')
            ] : []),
            ...(sceneNum === 4 ? [
              new RegExp(`(가이드.*만남|만남.*가이드|전문가.*만남|만남.*전문가)[^\\n]*\\n[^\\n]*`, 'i')
            ] : []),
            ...(sceneNum === 5 ? [
              new RegExp(`(가이드.*장소|장소.*가이드|피팅|맞춤)[^\\n]*\\n[^\\n]*`, 'i')
            ] : []),
            ...(sceneNum === 6 ? [
              new RegExp(`(성공.*회복|회복.*성공|문제.*해결|해결.*문제|성과.*달성)[^\\n]*\\n[^\\n]*`, 'i')
            ] : []),
            ...(sceneNum === 7 ? [
              new RegExp(`(여운.*정적|정적.*여운|만족|추천)[^\\n]*\\n[^\\n]*`, 'i')
            ] : [])
          ];
          
          let inserted = false;
          for (const pattern of scenePatterns) {
            const match = finalContent.match(pattern);
            if (match && match.index !== undefined) {
              // 문단 끝에 삽입
              const insertPos = match.index + match[0].length;
              insertions.push({ position: insertPos, markdown: imageMarkdown, sceneNum });
              inserted = true;
              console.log(`✅ 장면 ${sceneNum} 이미지 삽입 위치 찾음`);
              break;
            }
          }
          
          // 패턴을 찾지 못한 경우, 해당 장면 번호가 언급된 첫 번째 위치에 삽입
          if (!inserted) {
            const sceneNumPattern = new RegExp(`(장면\\s*${sceneNum}|${sceneNum}\\s*단계|${sceneNum}\\.|${sceneName.split('(')[0].trim()})`, 'i');
            const match = finalContent.match(sceneNumPattern);
            if (match && match.index !== undefined) {
              // 다음 문단 끝에 삽입
              let nextParagraph = finalContent.indexOf('\n\n', match.index);
              if (nextParagraph === -1) {
                // 문단 구분이 없으면 다음 줄 끝
                nextParagraph = finalContent.indexOf('\n', match.index);
                if (nextParagraph === -1) {
                  nextParagraph = match.index + match[0].length;
                }
              }
              insertions.push({ position: nextParagraph, markdown: imageMarkdown, sceneNum });
              console.log(`✅ 장면 ${sceneNum} 이미지 삽입 위치 찾음 (대체 위치)`);
            } else {
              // 장면 번호도 찾지 못한 경우, 해당 장면 순서에 맞게 본문 중간에 삽입
              // 전체 본문을 7등분하여 해당 장면 위치에 삽입
              const totalLength = finalContent.length;
              const sectionLength = Math.floor(totalLength / 7);
              const insertPos = sectionLength * (sceneNum - 1) + Math.floor(sectionLength / 2);
              insertions.push({ position: insertPos, markdown: imageMarkdown, sceneNum });
              console.log(`⚠️ 장면 ${sceneNum} 이미지 삽입 위치를 찾지 못해 본문 중간에 배치`);
            }
          }
        }
        
        // 역순으로 삽입 (뒤에서부터 삽입하면 인덱스가 변경되지 않음)
        insertions.sort((a, b) => b.position - a.position);
        console.log(`📝 삽입 전 content 길이: ${finalContent.length}`);
        console.log(`📝 삽입할 이미지 수: ${insertions.length}개`);
        
        for (const insertion of insertions) {
          finalContent = finalContent.slice(0, insertion.position) + insertion.markdown + finalContent.slice(insertion.position);
          console.log(`✅ 장면 ${insertion.sceneNum} 이미지 삽입 완료 (위치: ${insertion.position})`);
        }
        
        console.log(`📝 삽입 후 content 길이: ${finalContent.length}`);
        console.log(`✅ 총 ${insertions.length}개 이미지 배치 완료`);
      }
    } else {
      console.warn('⚠️ 이미지 배치 조건 미충족:', {
        finalBlogType,
        hasImages: !!storyboardData?.images,
        imageCount: storyboardData?.images?.length || 0
      });
    }

    console.log('📝 최종 content 길이:', finalContent.length);
    console.log('📝 content 미리보기:', finalContent.substring(0, 100) + '...');

    // 8. 새로운 customer_consultations 레코드 생성 (업데이트가 아닌)
    // 이름 익명화는 이미 displayName으로 처리됨
    const blogDraftTitle = parsedContent.title || `${displayName}님의 골프 여정`;
    const blogDraftSummary = parsedContent.summary || finalContent.substring(0, 200);
    
    // 원본 후기 내용 (없으면 빈 문자열)
    const originalContent = reviewContent || '';
    
    const { data: newConsultation, error: insertError } = await supabase
      .from('customer_consultations')
      .insert({
        customer_id: customerId,
        consultation_type: 'blog_draft',
        consultation_date: new Date().toISOString(),
        consultant_name: 'AI',
        topic: blogDraftTitle,
        content: originalContent, // 원본 후기 내용 (없으면 빈 문자열)
        is_blog_ready: true,
        blog_draft_content: finalContent, // 블로그 초안 내용
        blog_draft_title: blogDraftTitle, // 블로그 초안 제목
        blog_draft_summary: blogDraftSummary, // 블로그 초안 요약
        blog_draft_type: finalBlogType, // 'storyboard' | 'integrated' | 'review-only'
        blog_draft_created_at: new Date().toISOString(), // 초안 생성일
        review_images: reviewImages.length > 0 ? reviewImages : null,
        referenced_consultation_ids: referencedReviewIds.length > 0 ? referencedReviewIds : null,
        tags: [
          '블로그초안',
          finalBlogType === 'storyboard' ? '스토리보드' : 
          finalBlogType === 'integrated' ? '통합형' : '후기중심'
        ],
        follow_up_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`블로그 초안 저장 실패: ${insertError.message}`);
    }

    console.log('✅ 블로그 초안 저장 완료! (새로운 레코드 생성):', newConsultation.id);

    return res.status(200).json({
      success: true,
      consultationId: newConsultation.id,
      reviewId: reviewId || null, // 원본 후기 ID (있는 경우)
      blogDraft: {
        title: blogDraftTitle,
        summary: blogDraftSummary,
        content: finalContent,
        type: finalBlogType
      },
      referencedCount: referencedReviewIds.length,
      message: '블로그 초안이 성공적으로 생성되었습니다. 글 목록에서 확인하실 수 있습니다.'
    });

  } catch (error: any) {
    console.error('❌ 블로그 생성 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '블로그 생성 실패'
    });
  }
}

/**
 * 프롬프트 빌더
 */
function buildPrompt({
  customer,
  reviewContent,
  blogType,
  storyboardData,
  reviewImageMetadata,
  imageAnalyses,
  referencedContent
}: {
  customer: any;
  reviewContent: string;
  blogType: string;
  storyboardData: any;
  reviewImageMetadata: any[];
  imageAnalyses?: Record<number, { description: string; keywords: string[] }>;
  referencedContent?: string | null;
}) {
  if (blogType === 'storyboard') {
    // 스토리보드 중심: 장면 설명과 이미지만 사용
    const sceneDescriptions = storyboardData?.scenes?.map((s: any) => {
      const analysis = imageAnalyses?.[s.scene_number];
      let description = `장면 ${s.scene_number}: ${s.description || '설명 없음'}`;
      
      if (analysis) {
        description += `\n[이미지 분석] ${analysis.description}`;
        if (analysis.keywords && analysis.keywords.length > 0) {
          description += `\n주요 키워드: ${analysis.keywords.join(', ')}`;
        }
      }
      
      return description;
    }).join('\n\n') || '장면 설명 없음';

    const imageInfo = storyboardData?.images?.map((img: any) => {
      const isRep = img.is_scene_representative ? '⭐ 대표' : '';
      return `장면 ${img.story_scene}${isRep ? ' (대표)' : ''}: ${img.english_filename || img.original_filename}`;
    }).join('\n') || '이미지 없음';

    return `
스토리보드의 장면 설명과 이미지를 바탕으로 스토리브랜드 7단계 구조의 블로그 포스트를 작성해주세요.

**고객 정보:**
- 이름: ${customer.name}
- VIP 레벨: ${customer.vip_level || '일반'}

${referencedContent ? `**참조한 기존 글 내용:**\n${referencedContent}\n\n` : ''}

**스토리보드 장면 설명:**
${sceneDescriptions}

**스토리보드 이미지:**
${imageInfo}

**스토리브랜드 7단계 구조:**
1. 행복한 주인공: 고객의 평범한 일상 (골프를 즐기던 모습)
2. 행복+불안 전조: 문제의 조짐 (비거리 감소, 불만족 등)
3. 문제 발생: 명확한 문제 (구체적인 고민)
4. 가이드 만남: 마쓰구골프 전문가와의 만남
5. 가이드 장소: 맞춤 피팅, 제품 추천 과정
6. 성공 회복: 문제 해결, 성과 달성 (후기 내용 반영)
7. 여운 정적: 지속적인 만족, 추천 의사

**작성 규칙:**
1. 2000-3000자 분량
2. 스토리브랜드 7단계 구조를 자연스럽게 적용
3. 고객 후기 내용을 6단계(성공 회복)와 7단계(여운 정적)에 자연스럽게 통합
4. 3인칭 관점으로 작성 (이야기 형식)
5. 마쓰구골프 브랜드를 자연스럽게 언급
6. SEO 최적화 (키워드 자연스럽게 포함)
7. 전환 포인트 3곳에 CTA 삽입
8. 마크다운 형식으로 작성

**응답 형식 (JSON):**
{
  "title": "감동적인 블로그 제목",
  "summary": "블로그 요약 (100-150자)",
  "content": "마크다운 형식의 본문 내용",
  "seoKeywords": ["키워드1", "키워드2", "키워드3"],
  "imagePoints": ["이미지 삽입 포인트 설명1", "이미지 삽입 포인트 설명2"]
}

위 형식으로 JSON 응답해주세요.
    `.trim();
  } else if (blogType === 'integrated') {
    // 통합형: 스토리보드 + 후기
    const sceneDescriptions = storyboardData?.scenes?.map((s: any) => {
      const analysis = imageAnalyses?.[s.scene_number];
      let description = `장면 ${s.scene_number}: ${s.description || '설명 없음'}`;
      
      if (analysis) {
        description += `\n[이미지 분석] ${analysis.description}`;
        if (analysis.keywords && analysis.keywords.length > 0) {
          description += `\n주요 키워드: ${analysis.keywords.join(', ')}`;
        }
      }
      
      return description;
    }).join('\n\n') || '장면 설명 없음';

    const imageInfo = storyboardData?.images?.map((img: any) => {
      const isRep = img.is_scene_representative ? '⭐ 대표' : '';
      return `장면 ${img.story_scene}${isRep ? ' (대표)' : ''}: ${img.english_filename || img.original_filename}`;
    }).join('\n') || '이미지 없음';

    return `
고객 후기와 스토리보드를 통합하여 스토리브랜드 7단계 구조의 블로그 포스트를 작성해주세요.

**고객 정보:**
- 이름: ${customer.name}
- VIP 레벨: ${customer.vip_level || '일반'}

${reviewContent ? `**고객 후기:**\n${reviewContent}\n\n` : ''}
${referencedContent ? `**참조한 기존 글 내용:**\n${referencedContent}\n\n` : ''}

**스토리보드 장면 설명:**
${sceneDescriptions}

**스토리보드 이미지:**
${imageInfo}

**스토리브랜드 7단계 구조:**
1. 행복한 주인공: 고객의 평범한 일상 (골프를 즐기던 모습)
2. 행복+불안 전조: 문제의 조짐 (비거리 감소, 불만족 등)
3. 문제 발생: 명확한 문제 (구체적인 고민)
4. 가이드 만남: 마쓰구골프 전문가와의 만남
5. 가이드 장소: 맞춤 피팅, 제품 추천 과정
6. 성공 회복: 문제 해결, 성과 달성 (후기 내용 반영)
7. 여운 정적: 지속적인 만족, 추천 의사

**소제목 작성 규칙:**
각 장면의 소제목은 단순한 라벨이 아닌 독자의 마음을 사로잡는 문장으로 작성하세요.

**소제목 예시:**
- 장면 1: "골프장에서의 평범한 하루, 그리고 그 속에 숨겨진 변화의 조짐"
- 장면 2: "비거리가 줄어드는 순간, 골퍼의 마음속에 피어오른 불안의 그림자"
- 장면 3: "드라이버 샷이 점점 멀어지지 않는 이유를 찾아서"
- 장면 4: "전문가와의 만남, 변화의 첫 번째 발걸음"
- 장면 5: "맞춤 피팅의 순간, 골프 인생의 새로운 전환점"
- 장면 6: "문제 해결의 순간, 그리고 찾아온 성취감"
- 장면 7: "지속되는 만족, 그리고 골프 인생의 새로운 시작"

**소제목 작성 가이드:**
1. 감정적 연결: 독자의 경험과 공감할 수 있는 표현
2. 구체성: 추상적 표현보다는 구체적인 상황 묘사
3. 호기심 유발: "왜?", "어떻게?" 같은 질문을 유도
4. 변화의 신호: 문제나 해결의 전환점을 암시
5. 마크다운 헤더 형식: ## 또는 ### 사용

**작성 규칙:**
1. 2000-3000자 분량
2. 스토리브랜드 7단계 구조를 자연스럽게 적용
3. 고객 후기 내용을 6단계(성공 회복)와 7단계(여운 정적)에 자연스럽게 통합
4. 3인칭 관점으로 작성 (이야기 형식)
5. 마쓰구골프 브랜드를 자연스럽게 언급
6. SEO 최적화 (키워드 자연스럽게 포함)
7. 전환 포인트 3곳에 CTA 삽입
8. 마크다운 형식으로 작성
9. **각 장면의 소제목은 위 가이드를 따라 고급스럽고 후킹되는 문장으로 작성하세요**

**응답 형식 (JSON):**
{
  "title": "감동적인 블로그 제목",
  "summary": "블로그 요약 (100-150자)",
  "content": "마크다운 형식의 본문 내용",
  "seoKeywords": ["키워드1", "키워드2", "키워드3"],
  "imagePoints": ["이미지 삽입 포인트 설명1", "이미지 삽입 포인트 설명2"]
}

위 형식으로 JSON 응답해주세요.
    `.trim();
  } else {
    // 후기 중심형: 고객 관점
    return `
고객의 직접 경험을 중심으로 한 진솔한 후기 블로그를 작성해주세요.

**고객 정보:**
- 이름: ${customer.name}
- VIP 레벨: ${customer.vip_level || '일반'}

**고객 후기:**
${reviewContent}

**작성 규칙:**
1. 1500-2000자 분량
2. 1인칭 관점으로 작성 (고객의 직접 경험)
3. 고객의 감정과 경험을 생생하게 전달
4. 마쓰구골프와의 만남부터 변화까지의 여정을 시간순으로 서술
5. 구체적인 성과와 변화를 강조
6. SEO 최적화 (키워드 자연스럽게 포함)
7. 전환 포인트 2-3곳에 CTA 삽입
8. 마크다운 형식으로 작성

**응답 형식 (JSON):**
{
  "title": "고객 관점의 블로그 제목",
  "summary": "블로그 요약 (100-150자)",
  "content": "마크다운 형식의 본문 내용",
  "seoKeywords": ["키워드1", "키워드2", "키워드3"],
  "imagePoints": ["이미지 삽입 포인트 설명1", "이미지 삽입 포인트 설명2"]
}

위 형식으로 JSON 응답해주세요.
    `.trim();
  }
}

/**
 * 제목 추출 (JSON 파싱 실패 시)
 */
function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) return titleMatch[1];
  
  const firstLine = content.split('\n')[0];
  return firstLine.substring(0, 100);
}

/**
 * 요약 추출 (JSON 파싱 실패 시)
 */
function extractSummary(content: string): string {
  const summaryMatch = content.match(/##\s+요약[:\s]*(.+?)(?=\n##|\n#|$)/s);
  if (summaryMatch) return summaryMatch[1].trim().substring(0, 200);
  
  return content.substring(0, 200);
}
