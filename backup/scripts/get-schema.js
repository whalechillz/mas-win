export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Supabase REST API를 통한 테이블 정보 조회
    const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';
    
    // 테이블 컬럼 정보 조회
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    
    const tables = await response.json();
    
    // 또는 직접 SQL로 스키마 조회
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'bookings' });
    
    if (error) {
      // 대체 방법: information_schema 조회
      const { data, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'bookings');
      
      return res.status(200).json({ columns: data });
    }
    
    return res.status(200).json({ columns });
    
  } catch (error) {
    console.error('Schema fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
