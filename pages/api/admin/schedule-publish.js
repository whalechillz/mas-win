import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabase();
    
    // 현재 시간보다 이전에 예약된 포스트들을 찾아서 발행
    const now = new Date().toISOString();
    
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_scheduled', true)
      .eq('status', 'draft')
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('Scheduled posts fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch scheduled posts' });
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return res.status(200).json({ 
        message: 'No posts to publish',
        published: 0
      });
    }

    // 예약된 포스트들을 발행 상태로 업데이트
    const postIds = scheduledPosts.map(post => post.id);
    
    const { data: updatedPosts, error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'published',
        is_scheduled: false,
        scheduled_at: null,
        published_at: now,
        updated_at: now
      })
      .in('id', postIds)
      .select();

    if (updateError) {
      console.error('Scheduled posts update error:', updateError);
      return res.status(500).json({ error: 'Failed to publish scheduled posts' });
    }

    console.log(`Published ${updatedPosts.length} scheduled posts:`, updatedPosts.map(p => p.title));

    return res.status(200).json({ 
      message: `Successfully published ${updatedPosts.length} posts`,
      published: updatedPosts.length,
      posts: updatedPosts.map(p => ({ id: p.id, title: p.title }))
    });

  } catch (error) {
    console.error('Schedule publish error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
