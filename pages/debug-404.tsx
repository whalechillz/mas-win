import { GetServerSideProps } from 'next';
import Head from 'next/head';

interface DebugProps {
  hostname: string;
  userAgent: string;
  url: string;
  headers: Record<string, string>;
  timestamp: string;
}

export default function Debug404({ hostname, userAgent, url, headers, timestamp }: DebugProps) {
  return (
    <>
      <Head>
        <title>404 디버깅 - MASGOLF</title>
        <meta name="description" content="404 오류 디버깅 정보" />
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-8">🔍 404 오류 디버깅 정보</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 요청 정보</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>호스트명:</strong> {hostname}</p>
                <p><strong>URL:</strong> {url}</p>
                <p><strong>타임스탬프:</strong> {timestamp}</p>
              </div>
              <div>
                <p><strong>User Agent:</strong></p>
                <p className="text-sm text-gray-600 break-all">{userAgent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 HTTP 헤더</h2>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(headers, null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔧 문제 진단</h2>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <h3 className="font-semibold">1. 도메인 확인</h3>
                <p>현재 호스트명: <code className="bg-gray-200 px-2 py-1 rounded">{hostname}</code></p>
                <p>예상 호스트명: <code className="bg-gray-200 px-2 py-1 rounded">www.masgolf.co.kr</code></p>
              </div>
              
              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                <h3 className="font-semibold">2. 라우팅 확인</h3>
                <p>현재 URL: <code className="bg-gray-200 px-2 py-1 rounded">{url}</code></p>
                <p>예상 라우팅: <code className="bg-gray-200 px-2 py-1 rounded">/ (루트)</code></p>
              </div>
              
              <div className="p-4 border-l-4 border-green-500 bg-green-50">
                <h3 className="font-semibold">3. 해결 방법</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Vercel 대시보드에서 도메인 설정 확인</li>
                  <li>Redirects 설정에서 루트 리다이렉트 규칙 확인</li>
                  <li>DNS 설정 확인</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🔗 테스트 링크</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <a 
                href="https://win.masgolf.co.kr" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                win.masgolf.co.kr 테스트
              </a>
              <a 
                href="https://www.masgolf.co.kr" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.masgolf.co.kr 테스트
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<DebugProps> = async (context) => {
  const { req } = context;
  
  return {
    props: {
      hostname: req.headers.host || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      url: req.url || 'unknown',
      headers: req.headers as Record<string, string>,
      timestamp: new Date().toISOString(),
    },
  };
};
