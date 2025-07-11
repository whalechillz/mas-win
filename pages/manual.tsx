import React from 'react';
import { useRouter } from 'next/router';

export default function Manual() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto p-8">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">📚 MASGOLF 매뉴얼</h1>
          <p className="text-xl opacity-90">원하는 방식으로 매뉴얼을 확인하세요</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* 노션 매뉴얼 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white hover:transform hover:scale-105 transition-all cursor-pointer"
               onClick={() => window.open('https://notion.so/YOUR_WORKSPACE', '_blank')}>
            <div className="text-6xl mb-4 text-center">📝</div>
            <h2 className="text-2xl font-bold mb-4 text-center">노션 매뉴얼</h2>
            <p className="text-center opacity-80">실시간 업데이트되는 협업 매뉴얼</p>
            <div className="mt-6 text-center">
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm">팀 협업 가능</span>
            </div>
          </div>

          {/* 내장 매뉴얼 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white hover:transform hover:scale-105 transition-all cursor-pointer"
               onClick={() => router.push('/manual/interactive')}>
            <div className="text-6xl mb-4 text-center">🎯</div>
            <h2 className="text-2xl font-bold mb-4 text-center">인터랙티브 가이드</h2>
            <p className="text-center opacity-80">시스템 내장 단계별 가이드</p>
            <div className="mt-6 text-center">
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm">초보자 추천</span>
            </div>
          </div>

          {/* PDF 다운로드 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white hover:transform hover:scale-105 transition-all cursor-pointer"
               onClick={() => window.location.href = '/docs/manual/MASGOLF_Manual_v1.pdf'}>
            <div className="text-6xl mb-4 text-center">📄</div>
            <h2 className="text-2xl font-bold mb-4 text-center">PDF 다운로드</h2>
            <p className="text-center opacity-80">오프라인에서도 확인 가능</p>
            <div className="mt-6 text-center">
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm">인쇄 가능</span>
            </div>
          </div>
        </div>

        {/* 노션 임베드 섹션 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">📖 빠른 매뉴얼 보기</h3>
          <div className="bg-white rounded-xl overflow-hidden" style={{ height: '600px' }}>
            <iframe 
              src="https://v2-embednotion.com/YOUR_NOTION_PAGE_ID"
              style={{ width: '100%', height: '100%', border: 'none' }}
              loading="lazy"
            />
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">⚡ 자주 찾는 항목</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <a href="#" className="bg-white/20 hover:bg-white/30 transition-all rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">🔐</div>
              <div>로그인 방법</div>
            </a>
            <a href="#" className="bg-white/20 hover:bg-white/30 transition-all rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">📊</div>
              <div>대시보드 사용법</div>
            </a>
            <a href="#" className="bg-white/20 hover:bg-white/30 transition-all rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">📈</div>
              <div>캠페인 생성</div>
            </a>
            <a href="#" className="bg-white/20 hover:bg-white/30 transition-all rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">❓</div>
              <div>FAQ</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}