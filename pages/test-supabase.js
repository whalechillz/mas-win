// Supabase 직접 테스트 페이지
export default function TestSupabase() {
  const testDirectInsert = async () => {
    const SUPABASE_URL = 'https://yyytjudftrvpmcnppaymw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: '직접테스트',
          phone: '010-0000-0001',
          date: '2025-07-05',
          time: '16:00',
          club: '퍼터',
          status: 'pending'
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>Supabase 직접 테스트</h1>
      <button 
        onClick={testDirectInsert}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        DB에 직접 INSERT 테스트
      </button>
    </div>
  );
}