import { createServerSupabase } from '../../../lib/supabase';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getPosts(req, res);
      case 'POST':
        return await createPost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPosts(req, res) {
  try {
    // 현재는 로컬 JSON 파일에서 데이터를 가져옴
    const postsDir = path.join(process.cwd(), 'mas9golf', 'migrated-posts');
    const files = fs.readdirSync(postsDir);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(postsDir, file);
        const postData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        posts.push({
          id: postData.id,
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          content: postData.content,
          featured_image: postData.featured_image,
          publishedAt: postData.publishedAt,
          category: postData.category,
          tags: postData.tags
        });
      }
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.error('게시물 로드 실패:', error);
    return res.status(500).json({ error: '게시물을 불러올 수 없습니다.' });
  }
}

async function createPost(req, res) {
  try {
    const { title, slug, excerpt, content, featured_image, publishedAt, category, tags } = req.body;

    // 새 게시물 ID 생성
    const newId = Date.now().toString();
    
    // 새 게시물 데이터
    const newPost = {
      id: newId,
      title,
      slug,
      excerpt,
      content,
      featured_image,
      publishedAt: publishedAt || new Date().toISOString(),
      category: category || '골프',
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // JSON 파일로 저장
    const postsDir = path.join(process.cwd(), 'mas9golf', 'migrated-posts');
    const fileName = `post-${newId}-${slug}.json`;
    const filePath = path.join(postsDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(newPost, null, 2), 'utf8');

    return res.status(201).json({ 
      message: '게시물이 생성되었습니다.',
      post: newPost 
    });
  } catch (error) {
    console.error('게시물 생성 실패:', error);
    return res.status(500).json({ error: '게시물을 생성할 수 없습니다.' });
  }
}
