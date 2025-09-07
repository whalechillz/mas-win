const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 블로그 스토리지 설정
async function setupSupabaseBlogStorage() {
  try {
    console.log('🗄️ Supabase 블로그 스토리지 설정 시작...');
    
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase 클라이언트 초기화 완료');
    
    // 1. 블로그 게시물 테이블 생성
    console.log('\n📝 블로그 게시물 테이블 생성 중...');
    
    const { data: blogPostsTable, error: blogPostsError } = await supabase.rpc('create_blog_posts_table');
    
    if (blogPostsError) {
      console.log('📝 블로그 게시물 테이블이 이미 존재하거나 생성 중 오류:', blogPostsError.message);
    } else {
      console.log('✅ 블로그 게시물 테이블 생성 완료');
    }
    
    // 2. 블로그 카테고리 테이블 생성
    console.log('\n📂 블로그 카테고리 테이블 생성 중...');
    
    const { data: categoriesTable, error: categoriesError } = await supabase.rpc('create_blog_categories_table');
    
    if (categoriesError) {
      console.log('📂 블로그 카테고리 테이블이 이미 존재하거나 생성 중 오류:', categoriesError.message);
    } else {
      console.log('✅ 블로그 카테고리 테이블 생성 완료');
    }
    
    // 3. 블로그 태그 테이블 생성
    console.log('\n🏷️ 블로그 태그 테이블 생성 중...');
    
    const { data: tagsTable, error: tagsError } = await supabase.rpc('create_blog_tags_table');
    
    if (tagsError) {
      console.log('🏷️ 블로그 태그 테이블이 이미 존재하거나 생성 중 오류:', tagsError.message);
    } else {
      console.log('✅ 블로그 태그 테이블 생성 완료');
    }
    
    // 4. 블로그 게시물-태그 연결 테이블 생성
    console.log('\n🔗 블로그 게시물-태그 연결 테이블 생성 중...');
    
    const { data: postTagsTable, error: postTagsError } = await supabase.rpc('create_blog_post_tags_table');
    
    if (postTagsError) {
      console.log('🔗 블로그 게시물-태그 연결 테이블이 이미 존재하거나 생성 중 오류:', postTagsError.message);
    } else {
      console.log('✅ 블로그 게시물-태그 연결 테이블 생성 완료');
    }
    
    // 5. 스토리지 버킷 생성
    console.log('\n🪣 스토리지 버킷 생성 중...');
    
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    });
    
    if (bucketError) {
      console.log('🪣 스토리지 버킷이 이미 존재하거나 생성 중 오류:', bucketError.message);
    } else {
      console.log('✅ 스토리지 버킷 생성 완료: blog-images');
    }
    
    // 6. 기존 게시물 데이터를 Supabase에 업로드
    console.log('\n📤 기존 게시물 데이터 업로드 중...');
    
    const path = require('path');
    
    // 게시물 데이터 읽기
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    // 게시물 데이터를 Supabase 형식으로 변환
    const supabasePostData = {
      id: postData.id,
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt,
      featured_image: postData.featured_image,
      category: postData.category,
      tags: postData.tags,
      meta_description: postData.meta_description,
      keywords: postData.keywords,
      published_at: postData.published_at,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      author: postData.author,
      read_time: postData.read_time,
      status: 'published'
    };
    
    // 게시물 삽입
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .upsert(supabasePostData, { onConflict: 'slug' });
    
    if (insertError) {
      console.log('❌ 게시물 삽입 오류:', insertError.message);
    } else {
      console.log('✅ 게시물 데이터 업로드 완료');
    }
    
    // 7. 이미지 파일들을 스토리지에 업로드
    console.log('\n🖼️ 이미지 파일들을 스토리지에 업로드 중...');
    
    const imagesDir = path.join(__dirname, '../public/mas9golf/blog/images');
    
    try {
      const imageFiles = await fs.readdir(imagesDir);
      console.log(`📊 발견된 이미지 파일: ${imageFiles.length}개`);
      
      for (const imageFile of imageFiles) {
        if (imageFile.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const imagePath = path.join(imagesDir, imageFile);
          const imageBuffer = await fs.readFile(imagePath);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(`posts/${imageFile}`, imageBuffer, {
              contentType: `image/${imageFile.split('.').pop()}`,
              upsert: true
            });
          
          if (uploadError) {
            console.log(`❌ 이미지 업로드 실패: ${imageFile} - ${uploadError.message}`);
          } else {
            console.log(`✅ 이미지 업로드 완료: ${imageFile}`);
          }
        }
      }
    } catch (error) {
      console.log('❌ 이미지 디렉토리 읽기 오류:', error.message);
    }
    
    // 8. 편집 가능한 콘텐츠 구조를 위한 API 엔드포인트 생성
    console.log('\n🔧 편집 가능한 콘텐츠 API 엔드포인트 생성 중...');
    
    // 관리자 API 엔드포인트 생성
    const adminApiContent = `// Blog Admin API endpoint
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // 게시물 목록 조회
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ posts });
    
  } else if (req.method === 'POST') {
    // 새 게시물 생성
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert([req.body])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ post });
    
  } else if (req.method === 'PUT') {
    // 게시물 수정
    const { id, ...updateData } = req.body;
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ post });
    
  } else if (req.method === 'DELETE') {
    // 게시물 삭제
    const { id } = req.body;
    
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ message: 'Post deleted successfully' });
    
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }
}`;
    
    await fs.writeFile(path.join(__dirname, '../pages/api/admin/blog.js'), adminApiContent, 'utf8');
    console.log('✅ 관리자 API 엔드포인트 생성 완료: /api/admin/blog');
    
    // 이미지 업로드 API 엔드포인트 생성
    const imageUploadApiContent = `// Blog Image Upload API endpoint
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image');
      }
    });
    
    const [fields, files] = await form.parse(req);
    const file = files.image?.[0];
    
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = \`\${Date.now()}-\${file.originalFilename}\`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(\`posts/\${fileName}\`, fileBuffer, {
        contentType: file.mimetype,
        upsert: true
      });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(\`posts/\${fileName}\`);
    
    // 임시 파일 삭제
    fs.unlinkSync(file.filepath);
    
    res.status(200).json({ 
      url: publicUrl,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}`;
    
    await fs.writeFile(path.join(__dirname, '../pages/api/admin/upload-image.js'), imageUploadApiContent, 'utf8');
    console.log('✅ 이미지 업로드 API 엔드포인트 생성 완료: /api/admin/upload-image');
    
    console.log('\n🎉 Supabase 블로그 스토리지 설정 완료!');
    console.log('📊 설정된 기능:');
    console.log(`  🗄️ 데이터베이스 테이블: blog_posts, blog_categories, blog_tags, blog_post_tags`);
    console.log(`  🪣 스토리지 버킷: blog-images`);
    console.log(`  📤 기존 게시물 데이터 업로드 완료`);
    console.log(`  🖼️ 이미지 파일 업로드 완료`);
    console.log(`  🔧 관리자 API: /api/admin/blog`);
    console.log(`  📷 이미지 업로드 API: /api/admin/upload-image`);
    
    return {
      success: true,
      tables: ['blog_posts', 'blog_categories', 'blog_tags', 'blog_post_tags'],
      storage: 'blog-images',
      apis: ['/api/admin/blog', '/api/admin/upload-image']
    };
    
  } catch (error) {
    console.error('❌ Supabase 설정 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  setupSupabaseBlogStorage()
    .then((result) => {
      console.log('\n🚀 Supabase 블로그 스토리지 설정 작업 완료!');
      console.log('📊 설정 결과:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { setupSupabaseBlogStorage };
