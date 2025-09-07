// Blog posts API endpoint
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  try {
    // Read posts from JSON files
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
          publishedAt: postData.publishedAt || postData.published_at,
          category: postData.category,
          tags: postData.tags,
          meta_title: postData.meta_title,
          meta_description: postData.meta_description,
          meta_keywords: postData.meta_keywords,
          status: postData.status || 'published'
        });
      }
    }

    // Sort by published date (newest first)
    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    res.status(200).json({
      posts: paginatedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(posts.length / limit),
        totalPosts: posts.length,
        hasNext: endIndex < posts.length,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Error reading blog posts:', error);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
}