import { createServerSupabase } from '../../../../lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  try {
    switch (method) {
      case 'PUT':
        return await updatePost(req, res, id);
      case 'DELETE':
        return await deletePost(req, res, id);
      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updatePost(req, res, id) {
  try {
    const { 
      title, 
      slug, 
      excerpt, 
      content, 
      featured_image, 
      publishedAt, 
      category, 
      tags,
      status,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;

    const supabase = createServerSupabase();
    
    // 업데이트된 게시물 데이터
    const updatedData = {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      published_at: publishedAt,
      category: category || '골프',
      tags: tags || [],
      status: status || 'published',
      meta_title,
      meta_description,
      meta_keywords,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('게시물 수정 실패:', error);
      return res.status(500).json({ error: '게시물을 수정할 수 없습니다.' });
    }

    return res.status(200).json({ 
      message: '게시물이 수정되었습니다.',
      post: data 
    });
  } catch (error) {
    console.error('게시물 수정 실패:', error);
    return res.status(500).json({ error: '게시물을 수정할 수 없습니다.' });
  }
}

async function deletePost(req, res, id) {
  try {
    const supabase = createServerSupabase();
    
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('게시물 삭제 실패:', error);
      return res.status(500).json({ error: '게시물을 삭제할 수 없습니다.' });
    }

    return res.status(200).json({ 
      message: '게시물이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('게시물 삭제 실패:', error);
    return res.status(500).json({ error: '게시물을 삭제할 수 없습니다.' });
  }
}