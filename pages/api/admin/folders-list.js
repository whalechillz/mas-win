// 폴더 목록 조회 API (Storage에서 직접 조회)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 폴더 목록 조회 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const folders = new Set<string>();
      
      // 재귀적으로 모든 폴더 조회
      const getAllFolders = async (prefix = '') => {
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list(prefix, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          console.error(`❌ 폴더 조회 에러 (${prefix}):`, error);
          return;
        }

        if (!files) return;

        for (const file of files) {
          if (!file.id) {
            // 폴더인 경우
            const folderPath = prefix ? `${prefix}/${file.name}` : file.name;
            folders.add(folderPath);
            // 재귀적으로 하위 폴더 조회
            await getAllFolders(folderPath);
          }
        }
      };

      await getAllFolders('');

      const folderList = Array.from(folders).sort();
      console.log('✅ 폴더 목록 조회 완료:', folderList.length, '개');

      return res.status(200).json({ 
        folders: folderList,
        count: folderList.length
      });
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('❌ 폴더 목록 조회 오류:', error);
    return res.status(500).json({ 
      error: '폴더 목록을 불러올 수 없습니다.', 
      details: error.message 
    });
  }
}

