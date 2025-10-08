import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    console.log(`🔗 ${req.method} /api/admin/image-tag-relations`);

    if (req.method === 'GET') {
      const { image_url } = req.query;
      
      if (image_url) {
        // 특정 이미지의 태그 조회
        const { data, error } = await supabase
          .from('image_tag_relations')
          .select(`
            *,
            image_tags (
              id,
              name,
              slug
            )
          `)
          .eq('image_url', image_url);
        
        if (error) {
          console.error('❌ Supabase GET error:', error);
          throw error;
        }
        
        console.log('✅ Found', data?.length || 0, 'tag relations for image');
        return res.status(200).json({ relations: data || [] });
      } else {
        // 모든 태그 관계 조회
        const { data, error } = await supabase
          .from('image_tag_relations')
          .select(`
            *,
            image_tags (
              id,
              name,
              slug
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Supabase GET error:', error);
          throw error;
        }
        
        console.log('✅ Found', data?.length || 0, 'tag relations');
        return res.status(200).json({ relations: data || [] });
      }
    }

    if (req.method === 'POST') {
      const { image_url, tag_id, tag_type = 'manual' } = req.body || {};
      
      if (!image_url || !tag_id) {
        return res.status(400).json({ error: 'image_url and tag_id are required' });
      }

      // 중복 관계 확인
      const { data: existingRelation } = await supabase
        .from('image_tag_relations')
        .select('id')
        .eq('image_url', image_url)
        .eq('tag_id', tag_id)
        .single();

      if (existingRelation) {
        return res.status(409).json({ error: 'Tag relation already exists' });
      }

      const { data, error } = await supabase
        .from('image_tag_relations')
        .insert([{ image_url, tag_id, tag_type }])
        .select(`
          *,
          image_tags (
            id,
            name,
            slug
          )
        `);
      
      if (error) {
        console.error('❌ Supabase INSERT error:', error);
        throw error;
      }
      
      console.log('✅ Created tag relation:', data?.[0]?.id);
      return res.status(201).json({ relation: data?.[0] });
    }

    if (req.method === 'DELETE') {
      const { id, image_url, tag_id } = req.query;
      
      if (id) {
        // ID로 삭제
        const { error } = await supabase
          .from('image_tag_relations')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('❌ Supabase DELETE error:', error);
          throw error;
        }
        
        console.log('✅ Deleted tag relation ID:', id);
        return res.status(204).end();
      } else if (image_url && tag_id) {
        // 이미지 URL과 태그 ID로 삭제
        const { error } = await supabase
          .from('image_tag_relations')
          .delete()
          .eq('image_url', image_url)
          .eq('tag_id', tag_id);
        
        if (error) {
          console.error('❌ Supabase DELETE error:', error);
          throw error;
        }
        
        console.log('✅ Deleted tag relation for image and tag');
        return res.status(204).end();
      } else {
        return res.status(400).json({ error: 'id or (image_url and tag_id) is required' });
      }
    }

    if (req.method === 'PUT') {
      const { id, tag_type } = req.body || {};
      
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const { data, error } = await supabase
        .from('image_tag_relations')
        .update({ tag_type })
        .eq('id', id)
        .select(`
          *,
          image_tags (
            id,
            name,
            slug
          )
        `);
      
      if (error) {
        console.error('❌ Supabase UPDATE error:', error);
        throw error;
      }
      
      console.log('✅ Updated tag relation:', data?.[0]?.id);
      return res.status(200).json({ relation: data?.[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('❌ image-tag-relations error:', e);
    return res.status(500).json({ 
      error: 'Internal error', 
      details: e.message,
      code: e.code 
    });
  }
}
