/**
 * 대량 콘텐츠 일괄 처리 시스템
 * 여러 블로그를 한번에 처리하고 이미지 생성
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, batchData } = req.body;

    switch (action) {
      case 'create-batch':
        return await createBatch(batchData, res);
      
      case 'process-batch':
        return await processBatch(batchData.batchId, res);
      
      case 'get-batch-status':
        return await getBatchStatus(batchData.batchId, res);
      
      case 'get-batch-results':
        return await getBatchResults(batchData.batchId, res);
      
      case 'cancel-batch':
        return await cancelBatch(batchData.batchId, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('대량 처리 시스템 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 배치 작업 생성
async function createBatch(batchData, res) {
  try {
    const batch = {
      id: `batch_${Date.now()}`,
      name: batchData.name || '대량 처리 작업',
      description: batchData.description || '',
      urls: batchData.urls || [],
      settings: {
        contentType: batchData.contentType || 'auto',
        aiModel: batchData.aiModel || 'fal',
        imageCount: batchData.imageCount || 1,
        variationStrength: batchData.variationStrength || 0.7,
        brandStrategy: batchData.brandStrategy || {},
        preset: batchData.preset || null
      },
      status: 'created', // created, processing, completed, failed, cancelled
      progress: {
        total: batchData.urls?.length || 0,
        completed: 0,
        failed: 0,
        current: null
      },
      results: [],
      errors: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('batch_jobs')
      .insert(batch)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      batch: data,
      message: '배치 작업이 생성되었습니다.'
    });

  } catch (error) {
    throw error;
  }
}

// 배치 작업 처리
async function processBatch(batchId, res) {
  try {
    // 배치 정보 조회
    const { data: batch, error: fetchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchId)
      .single();

    if (fetchError) throw fetchError;

    if (batch.status !== 'created') {
      return res.status(400).json({
        success: false,
        error: '배치 작업이 이미 처리 중이거나 완료되었습니다.'
      });
    }

    // 상태를 처리 중으로 변경
    await supabase
      .from('batch_jobs')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    // 비동기 처리 시작 (응답 먼저 반환)
    processBatchAsync(batch);

    return res.status(200).json({
      success: true,
      message: '배치 처리가 시작되었습니다.',
      batchId: batchId
    });

  } catch (error) {
    throw error;
  }
}

// 배치 상태 조회
async function getBatchStatus(batchId, res) {
  try {
    const { data: batch, error } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      batch: batch
    });

  } catch (error) {
    throw error;
  }
}

// 배치 결과 조회
async function getBatchResults(batchId, res) {
  try {
    const { data: batch, error } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      results: batch.results || [],
      errors: batch.errors || [],
      progress: batch.progress || {}
    });

  } catch (error) {
    throw error;
  }
}

// 배치 취소
async function cancelBatch(batchId, res) {
  try {
    const { error } = await supabase
      .from('batch_jobs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '배치 작업이 취소되었습니다.'
    });

  } catch (error) {
    throw error;
  }
}

// 비동기 배치 처리
async function processBatchAsync(batch) {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  try {
    console.log(`🚀 배치 처리 시작: ${batch.id}`);

    for (let i = 0; i < batch.urls.length; i++) {
      const url = batch.urls[i];
      
      try {
        // 현재 처리 중인 URL 업데이트
        await supabase
          .from('batch_jobs')
          .update({ 
            'progress.current': url,
            updated_at: new Date().toISOString()
          })
          .eq('id', batch.id);

        console.log(`📝 처리 중: ${url} (${i + 1}/${batch.urls.length})`);

        // 블로그 스크래핑
        const scrapeResponse = await fetch(`${baseUrl}/api/scrape-blog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (!scrapeResponse.ok) {
          throw new Error(`스크래핑 실패: ${scrapeResponse.status}`);
        }

        const scrapedData = await scrapeResponse.json();

        // AI 콘텐츠 분석
        const analysisResponse = await fetch(`${baseUrl}/api/ai-content-analyzer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: scrapedData.title,
            excerpt: scrapedData.excerpt,
            content: scrapedData.content
          })
        });

        const analysisResult = await analysisResponse.json();
        const contentType = analysisResult.success ? analysisResult.analysis.category : 'general';

        // 이미지 생성
        const imageResponse = await fetch(`${baseUrl}/api/generate-blog-image-${batch.settings.aiModel}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: scrapedData.title,
            excerpt: scrapedData.excerpt,
            contentType: contentType,
            brandStrategy: batch.settings.brandStrategy,
            imageCount: batch.settings.imageCount
          })
        });

        const imageResult = await imageResponse.json();

        // 결과 저장
        const result = {
          url: url,
          title: scrapedData.title,
          contentType: contentType,
          images: imageResult.success ? imageResult.images : [],
          status: 'success',
          processed_at: new Date().toISOString()
        };

        // 배치 결과 업데이트
        const { data: currentBatch } = await supabase
          .from('batch_jobs')
          .select('results, progress')
          .eq('id', batch.id)
          .single();

        const updatedResults = [...(currentBatch.results || []), result];
        const updatedProgress = {
          ...currentBatch.progress,
          completed: (currentBatch.progress.completed || 0) + 1,
          current: null
        };

        await supabase
          .from('batch_jobs')
          .update({ 
            results: updatedResults,
            progress: updatedProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', batch.id);

        console.log(`✅ 완료: ${url}`);

      } catch (error) {
        console.error(`❌ 실패: ${url}`, error);

        // 에러 저장
        const errorResult = {
          url: url,
          error: error.message,
          status: 'failed',
          processed_at: new Date().toISOString()
        };

        const { data: currentBatch } = await supabase
          .from('batch_jobs')
          .select('errors, progress')
          .eq('id', batch.id)
          .single();

        const updatedErrors = [...(currentBatch.errors || []), errorResult];
        const updatedProgress = {
          ...currentBatch.progress,
          failed: (currentBatch.progress.failed || 0) + 1,
          current: null
        };

        await supabase
          .from('batch_jobs')
          .update({ 
            errors: updatedErrors,
            progress: updatedProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', batch.id);
      }
    }

    // 배치 완료
    await supabase
      .from('batch_jobs')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', batch.id);

    console.log(`🎉 배치 처리 완료: ${batch.id}`);

  } catch (error) {
    console.error(`💥 배치 처리 실패: ${batch.id}`, error);

    await supabase
      .from('batch_jobs')
      .update({ 
        status: 'failed',
        errors: [...(batch.errors || []), { error: error.message, timestamp: new Date().toISOString() }],
        updated_at: new Date().toISOString()
      })
      .eq('id', batch.id);
  }
}
