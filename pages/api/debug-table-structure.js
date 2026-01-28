import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. cc_content_calendar 테이블 구조 확인
    const { data: calendarColumns, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .limit(1);

    if (calendarError) {
      console.error('cc_content_calendar 테이블 오류:', calendarError);
    }

    // 2. blog_posts 테이블 구조 확인
    const { data: blogColumns, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);

    if (blogError) {
      console.error('blog_posts 테이블 오류:', blogError);
    }

    // 3. image_metadata 테이블 구조 확인
    const { data: imageColumns, error: imageError } = await supabase
        .from('image_assets')
      .select('*')
      .limit(1);

    if (imageError) {
      console.error('image_metadata 테이블 오류:', imageError);
    }

    // 4. 테이블별 컬럼 정보 추출
    const getColumns = (data) => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]);
    };

    const tableStructures = {
      cc_content_calendar: {
        columns: getColumns(calendarColumns),
        sampleData: calendarColumns?.[0] || null,
        error: calendarError?.message || null
      },
      blog_posts: {
        columns: getColumns(blogColumns),
        sampleData: blogColumns?.[0] || null,
        error: blogError?.message || null
      },
      image_metadata: {
        columns: getColumns(imageColumns),
        sampleData: imageColumns?.[0] || null,
        error: imageError?.message || null
      }
    };

    // 5. 인덱스 생성 가능 여부 확인
    const indexRecommendations = {
      cc_content_calendar: {
        recommended: ['content_date', 'status', 'blog_post_id', 'content_type', 'parent_content_id'],
        existing: tableStructures.cc_content_calendar.columns,
        missing: []
      },
      blog_posts: {
        recommended: ['published_at', 'status'],
        existing: tableStructures.blog_posts.columns,
        missing: []
      },
      image_metadata: {
        recommended: ['created_at', 'category_id', 'status', 'usage_count'],
        existing: tableStructures.image_metadata.columns,
        missing: []
      }
    };

    // 누락된 컬럼 확인
    Object.keys(indexRecommendations).forEach(table => {
      const rec = indexRecommendations[table];
      rec.missing = rec.recommended.filter(col => !rec.existing.includes(col));
    });

    res.status(200).json({
      success: true,
      tableStructures,
      indexRecommendations,
      summary: {
        totalTables: Object.keys(tableStructures).length,
        tablesWithErrors: Object.values(tableStructures).filter(t => t.error).length,
        missingColumns: Object.values(indexRecommendations).reduce((acc, rec) => acc + rec.missing.length, 0)
      }
    });

  } catch (error) {
    console.error('테이블 구조 확인 오류:', error);
    res.status(500).json({ 
      error: '테이블 구조 확인 실패', 
      details: error.message 
    });
  }
}
