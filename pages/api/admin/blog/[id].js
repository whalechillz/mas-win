import fs from 'fs';
import path from 'path';

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
    const { title, slug, excerpt, content, featured_image, publishedAt, category, tags } = req.body;

    // 기존 게시물 찾기
    const postsDir = path.join(process.cwd(), 'mas9golf', 'migrated-posts');
    const files = fs.readdirSync(postsDir);
    let postFile = null;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(postsDir, file);
        const postData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (postData.id === id) {
          postFile = file;
          break;
        }
      }
    }

    if (!postFile) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 업데이트된 게시물 데이터
    const updatedPost = {
      id,
      title,
      slug,
      excerpt,
      content,
      featured_image,
      publishedAt: publishedAt || new Date().toISOString(),
      category: category || '골프',
      tags: tags || [],
      updatedAt: new Date().toISOString()
    };

    // 파일 업데이트
    const filePath = path.join(postsDir, postFile);
    fs.writeFileSync(filePath, JSON.stringify(updatedPost, null, 2), 'utf8');

    return res.status(200).json({ 
      message: '게시물이 수정되었습니다.',
      post: updatedPost 
    });
  } catch (error) {
    console.error('게시물 수정 실패:', error);
    return res.status(500).json({ error: '게시물을 수정할 수 없습니다.' });
  }
}

async function deletePost(req, res, id) {
  try {
    // 기존 게시물 찾기
    const postsDir = path.join(process.cwd(), 'mas9golf', 'migrated-posts');
    const files = fs.readdirSync(postsDir);
    let postFile = null;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(postsDir, file);
        const postData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (postData.id === id) {
          postFile = file;
          break;
        }
      }
    }

    if (!postFile) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 파일 삭제
    const filePath = path.join(postsDir, postFile);
    fs.unlinkSync(filePath);

    return res.status(200).json({ 
      message: '게시물이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('게시물 삭제 실패:', error);
    return res.status(500).json({ error: '게시물을 삭제할 수 없습니다.' });
  }
}
