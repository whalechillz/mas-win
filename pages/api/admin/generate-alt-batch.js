import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items = [], mode = 'preview' } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });

    const prompts = items.map((it) => `Image file: ${it.name}\nCurrent ALT: ${it.alt_text||''}\nKeywords: ${(it.keywords||[]).join(', ')}\nCategory: ${it.category||''}`);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system', content: 'You generate concise SEO-friendly alt text (<=120 chars), short title, and meta description (<=160 chars) for images. Return JSON array of {alt,title,description} aligning with golf brand tone in Korean.' },
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
        await supabase.from('image_metadata').upsert({
          name: items[i].name,
          alt_text: s.alt || items[i].alt_text || '',
          title: s.title || items[i].title || '',
          description: s.description || items[i].description || ''
        }, { onConflict: 'name' });
      }
    }

    return res.status(200).json({ suggestions });
  } catch (e) {
    console.error('generate-alt-batch error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


