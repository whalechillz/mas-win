import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { useSession } from 'next-auth/react';

export default function ContentCalendarSimple() {
  const { data: session, status } = useSession();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchContents();
    }
  }, [session]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content-calendar?page=1&limit=50');
      if (response.ok) {
        const data = await response.json();
        setContents(data.contents || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">인증 확인 중...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>콘텐츠 캘린더 (심플) - 관리자</title>
      </Head>
      
      <AdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">콘텐츠 캘린더 (심플 버전)</h1>
          <p className="mt-2 text-gray-600">총 {contents.length}개 콘텐츠</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contents.map((content: any) => (
                  <tr key={content.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{content.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{content.content_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{content.content_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        content.status === 'published' ? 'bg-green-100 text-green-800' :
                        content.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {content.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

