import Head from 'next/head';
import Link from 'next/link';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminAI() {
  return (
    <>
      <AdminNav />
      <Head>
        <title>AI 관리 - MAS Golf</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🤖 AI 관리</h1>
              <p className="text-sm text-gray-600 mt-1">프롬프트, 이미지 생성/개선 히스토리, AI 분석/SEO 도구</p>
            </div>
            <Link href="/admin/blog" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">📝 블로그 관리로</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="#" className="block bg-white border rounded-lg p-6 hover:shadow">
              <h2 className="font-semibold text-gray-900">프롬프트 보관함</h2>
              <p className="text-sm text-gray-600 mt-2">템플릿과 최근 사용 프롬프트 관리</p>
            </Link>
            <Link href="#" className="block bg-white border rounded-lg p-6 hover:shadow">
              <h2 className="font-semibold text-gray-900">이미지 생성/개선 히스토리</h2>
              <p className="text-sm text-gray-600 mt-2">기록에서 재사용/비교/정리</p>
            </Link>
            <Link href="#" className="block bg-white border rounded-lg p-6 hover:shadow">
              <h2 className="font-semibold text-gray-900">AI 분석 · SEO 도구</h2>
              <p className="text-sm text-gray-600 mt-2">본문 개선, 키워드, 메타 자동화</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}


