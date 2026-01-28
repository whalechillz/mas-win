import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items = [], mode = 'preview', context = {} } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });

    // 컨텍스트 정보를 포함한 프롬프트 생성
    const contextInfo = context.title ? `\nBlog Title: ${context.title}\nExcerpt: ${context.excerpt || ''}\nCategory: ${context.category || ''}\nPrompt: ${context.prompt || ''}` : '';
    const prompts = items.map((it) => `Image file: ${it.name}\nCurrent ALT: ${it.alt_text||''}\nKeywords: ${(it.keywords||[]).join(', ')}\nCategory: ${it.category||''}${contextInfo}`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system', content: 'You generate concise SEO-friendly alt text (<=120 chars), short title, and meta description (<=160 chars) for images. Return JSON array of {alt,title,description} aligning with golf brand tone in Korean. If context is provided, use it to create more relevant metadata.' },
        { role: 'user', content: `Create entries for these images (count=${items.length}).\n${prompts.join('\n---\n')}` }
      ]
    });
    const text = response.choices?.[0]?.message?.content || '[]';
    let suggestions = [];
    try { suggestions = JSON.parse(text); } catch { suggestions = []; }
    suggestions = Array.isArray(suggestions) ? suggestions : [];

    if (mode === 'apply') {
      for (let i = 0; i < items.length; i++) {
        const s = suggestions[i] || {};
        // 프롬프트 기반 폴백 ALT 생성 (AI 실패 시)
        let fallbackAlt = '';
        if (!s.alt && context.prompt) {
          const keywords = context.prompt.toLowerCase().split(' ').slice(0, 5).join(' ');
          fallbackAlt = keywords ? `${keywords} image` : '';
        }
        
        // ⚠️ image_assets로 변경 (name 대신 cdn_url 또는 file_path 사용)
        // name으로는 조회할 수 없으므로 URL이나 file_path로 조회 필요
        await supabase.from('image_assets').upsert({
          // name은 image_assets에 없으므로 cdn_url 또는 file_path 사용
          alt_text: s.alt || fallbackAlt || items[i].alt_text || '',
          title: s.title || items[i].title || '',
          description: s.description || items[i].description || '',
          ai_tags: items[i].keywords || []
          // ⚠️ image_assets에는 name, category 필드가 없음
        }, { onConflict: 'cdn_url' }); // cdn_url 기준으로 upsert
      }
    }

    return res.status(200).json({ suggestions });
  } catch (e) {
    console.error('generate-alt-batch error', e);
    
    // OpenAI 크레딧 부족 오류 감지
    const errorCode = e.code || '';
    const errorMessage = e.message || '';
    
    const isCreditError = 
      errorCode === 'insufficient_quota' ||
      errorCode === 'billing_not_active' ||
      errorMessage.includes('insufficient_quota') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('credit') ||
      errorMessage.includes('payment') ||
      errorMessage.includes('quota');
    
    if (isCreditError) {
      console.error('💰 OpenAI 크레딧 부족 감지:', errorCode, errorMessage);
      return res.status(402).json({
        error: '💰 OpenAI 계정에 크레딧이 부족합니다',
        details: 'OpenAI 계정에 크레딧을 충전해주세요. https://platform.openai.com/settings/organization/billing/overview',
        type: 'insufficient_credit',
        code: errorCode
      });
    }
    
    return res.status(500).json({ error: 'Internal error' });
  }
}


