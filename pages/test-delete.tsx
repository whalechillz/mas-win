import { useState } from 'react';

export default function TestDelete() {
  const [rlsResult, setRlsResult] = useState('');
  const [deleteResult, setDeleteResult] = useState('');

  const testRLS = async () => {
    setRlsResult('RLS 정책 확인 중...');
    
    try {
      const response = await fetch('/api/test-delete-permissions');
      const data = await response.json();
      
      setRlsResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setRlsResult(`오류 발생: ${error.message}`);
    }
  };

  const testDelete = async () => {
    setDeleteResult('삭제 권한 테스트 중...');
    
    try {
      const response = await fetch('/api/test-delete-permissions');
      const data = await response.json();
      
      setDeleteResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setDeleteResult(`오류 발생: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">삭제 권한 테스트</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. RLS 정책 테스트</h2>
          <button 
            onClick={testRLS}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            RLS 정책 확인
          </button>
          {rlsResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">{rlsResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. 삭제 기능 테스트</h2>
          <button 
            onClick={testDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            삭제 권한 테스트
          </button>
          {deleteResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">{deleteResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">3. 관리자 페이지 링크</h2>
          <a 
            href="/admin" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
          >
            관리자 페이지로 이동
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">4. RLS 정책 수정 안내</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              삭제가 안되는 경우, Supabase 대시보드에서 RLS 정책을 수정해야 합니다:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Supabase 대시보드 접속</li>
              <li>SQL Editor 열기</li>
              <li>다음 SQL 실행:</li>
            </ol>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-sm overflow-auto">
{`-- 예약관리 삭제 기능을 위한 RLS 정책 수정

-- 1. 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "allow_anonymous_delete_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anonymous_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anonymous_delete_contacts" ON public.contacts;
DROP POLICY IF EXISTS "allow_anonymous_update_contacts" ON public.contacts;

-- 2. bookings 테이블 RLS 정책 추가
CREATE POLICY "allow_anonymous_delete_bookings" ON public.bookings
FOR DELETE TO anon USING (true);

CREATE POLICY "allow_anonymous_update_bookings" ON public.bookings
FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 3. contacts 테이블 RLS 정책 추가
CREATE POLICY "allow_anonymous_delete_contacts" ON public.contacts
FOR DELETE TO anon USING (true);

CREATE POLICY "allow_anonymous_update_contacts" ON public.contacts
FOR UPDATE TO anon USING (true) WITH CHECK (true);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 