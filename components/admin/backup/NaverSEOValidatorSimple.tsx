'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface SEOCheckItem {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const NaverSEOValidatorSimple: React.FC = () => {
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<SEOCheckItem[]>([]);

  const handleCheck = () => {
    if (!url) return;

    setChecking(true);
    // 시뮬레이션
    setTimeout(() => {
      setResults([
        {
          name: '메타 타이틀',
          status: 'pass',
          message: '적절한 길이 (55자)'
        },
        {
          name: '메타 설명',
          status: 'warning',
          message: '조금 짧음 (80자 권장, 현재 45자)'
        },
        {
          name: 'Open Graph 태그',
          status: 'pass',
          message: '모든 필수 태그 존재'
        },
        {
          name: '네이버 웹마스터 태그',
          status: 'fail',
          message: 'naver-site-verification 태그 없음'
        },
        {
          name: '모바일 최적화',
          status: 'pass',
          message: '반응형 디자인 확인됨'
        },
        {
          name: '이미지 alt 텍스트',
          status: 'warning',
          message: '일부 이미지에 alt 텍스트 누락'
        },
        {
          name: '페이지 로딩 속도',
          status: 'pass',
          message: '2.3초 (양호)'
        },
        {
          name: '구조화된 데이터',
          status: 'fail',
          message: 'Schema.org 마크업 없음'
        }
      ]);
      setChecking(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getScore = () => {
    if (results.length === 0) return 0;
    const passCount = results.filter(r => r.status === 'pass').length;
    return Math.round((passCount / results.length) * 100);
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Search className="w-5 h-5" />
          네이버 SEO 검증
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          네이버 검색 최적화를 위한 SEO 검사를 수행합니다.
        </p>
      </div>

      {/* URL 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          검사할 URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleCheck}
            disabled={!url || checking}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              checking || !url
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {checking ? '검사 중...' : '검사 시작'}
          </button>
        </div>
      </div>

      {/* 검사 결과 */}
      {results.length > 0 && (
        <div>
          {/* 점수 표시 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg text-center">
            <div className="text-4xl font-bold mb-2">
              <span className={
                getScore() >= 80 ? 'text-green-600' :
                getScore() >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }>
                {getScore()}점
              </span>
              <span className="text-gray-400 text-2xl">/100</span>
            </div>
            <p className="text-gray-600">
              {getScore() >= 80 ? '우수' :
               getScore() >= 60 ? '양호' :
               '개선 필요'}
            </p>
          </div>

          {/* 세부 결과 */}
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h4 className="font-medium">{result.name}</h4>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>

          {/* 개선 제안 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">개선 제안</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 네이버 웹마스터 도구에 사이트 등록</li>
              <li>• 구조화된 데이터 마크업 추가</li>
              <li>• 모든 이미지에 설명적인 alt 텍스트 추가</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NaverSEOValidatorSimple;