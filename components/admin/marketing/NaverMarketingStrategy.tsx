import React, { useState } from 'react';

// 네이버 마케팅 전략 대시보드
export const NaverMarketingStrategy = ({ supabase }) => {
  const [activeTab, setActiveTab] = useState('keywords');

  // 키워드 전략 데이터
  const keywordStrategy = {
    tier1: {
      title: "1순위: 브랜드 구축",
      keywords: [
        { keyword: "마스골프", difficulty: "하", volume: "낮음", priority: "높음" },
        { keyword: "MASGOLF", difficulty: "하", volume: "낮음", priority: "높음" },
        { keyword: "마스골프 드라이버", difficulty: "하", volume: "낮음", priority: "높음" }
      ]
    },
    tier2: {
      title: "2순위: 문제 해결",
      keywords: [
        { keyword: "60대 골프 비거리", difficulty: "중", volume: "중간", priority: "높음" },
        { keyword: "시니어 드라이버 추천", difficulty: "중", volume: "높음", priority: "높음" },
        { keyword: "70대 골프채", difficulty: "하", volume: "중간", priority: "중간" }
      ]
    },
    tier3: {
      title: "3순위: 일반 경쟁",
      keywords: [
        { keyword: "고반발 드라이버", difficulty: "상", volume: "높음", priority: "낮음" },
        { keyword: "비거리 드라이버", difficulty: "상", volume: "높음", priority: "낮음" }
      ]
    }
  };

  // 콘텐츠 템플릿
  const contentTemplates = [
    {
      type: "고객 후기",
      title: "[실제 후기] {나이}대 {이름}님이 MASGOLF로 {효과}",
      structure: "문제 상황 → 제품 선택 이유 → 사용 후 변화 → 추천 멘트",
      keywords: ["시니어 골프", "MASGOLF 후기", "비거리 증가"]
    },
    {
      type: "교육 콘텐츠",
      title: "시니어 골퍼가 꼭 알아야 할 {주제} {숫자}가지",
      structure: "도입 → 문제 제기 → 해결 방법 → MASGOLF 연결",
      keywords: ["시니어 골프 팁", "골프 레슨", "드라이버 선택법"]
    },
    {
      type: "비교 분석",
      title: "{브랜드} vs MASGOLF, 시니어에게 맞는 선택은?",
      structure: "비교 기준 설정 → 장단점 분석 → 시니어 특화 포인트 → 결론",
      keywords: ["드라이버 비교", "시니어 골프채", "MASGOLF 장점"]
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">네이버 마케팅 전략 센터</h2>
        <p className="text-gray-600">데이터 기반 콘텐츠 전략으로 검색 순위를 높이세요</p>
      </div>

      {/* 경고 메시지 */}
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">⚠️ 중복 콘텐츠 경고</h3>
        <p className="text-sm text-red-800">
          동일한 글을 여러 계정에 발행하면 모든 계정이 저품질로 분류됩니다.
          각 계정마다 다른 관점의 콘텐츠를 작성하세요.
        </p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('keywords')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'keywords' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          키워드 전략
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'templates' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          콘텐츠 템플릿
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'calendar' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          발행 캘린더
        </button>
      </div>

      {/* 키워드 전략 탭 */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          {Object.entries(keywordStrategy).map(([tier, data]) => (
            <div key={tier} className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">{data.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">키워드</th>
                      <th className="text-left py-2">난이도</th>
                      <th className="text-left py-2">검색량</th>
                      <th className="text-left py-2">우선순위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keywords.map((kw, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 font-medium">{kw.keyword}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            kw.difficulty === '하' ? 'bg-green-100 text-green-700' :
                            kw.difficulty === '중' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {kw.difficulty}
                          </span>
                        </td>
                        <td className="py-2">{kw.volume}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            kw.priority === '높음' ? 'bg-blue-100 text-blue-700' :
                            kw.priority === '중간' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {kw.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 콘텐츠 템플릿 탭 */}
      {activeTab === 'templates' && (
        <div className="grid gap-4">
          {contentTemplates.map((template, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    {template.type}
                  </span>
                  <h3 className="text-lg font-semibold mt-2">{template.title}</h3>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  템플릿 사용
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">구조</h4>
                <p className="text-sm text-gray-600">{template.structure}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">추천 키워드</h4>
                <div className="flex gap-2 flex-wrap">
                  {template.keywords.map((kw, kidx) => (
                    <span key={kidx} className="px-2 py-1 bg-gray-100 text-sm rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 발행 캘린더 탭 */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">주간 발행 계획 (권장)</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">월요일</h4>
                <span className="text-sm text-green-600">mas9golf</span>
              </div>
              <p className="text-sm text-gray-600">
                주제: 주말 라운딩 후기 / 고객 체험담
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">수요일</h4>
                <span className="text-sm text-blue-600">massgoogolf</span>
              </div>
              <p className="text-sm text-gray-600">
                주제: 골프 팁 / 교육 콘텐츠
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">금요일</h4>
                <span className="text-sm text-purple-600">massgoogolfkorea</span>
              </div>
              <p className="text-sm text-gray-600">
                주제: 이벤트 / 프로모션 안내
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 프로 팁</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 각 계정마다 다른 톤앤매너 유지</li>
              <li>• 발행 시간: 오전 9-11시, 오후 2-4시</li>
              <li>• 주 3회 이상 꾸준한 발행이 중요</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};