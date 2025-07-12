import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function Manual() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // 노션 페이지 정보
  const NOTION_PAGE_URL = "https://www.notion.so/22aaa1258b818081bdf4f2fe4d119dab";

  const tabs = [
    { id: 'overview', label: '시작하기', icon: '🚀' },
    { id: 'login', label: '로그인', icon: '🔐' },
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'campaign', label: '캠페인 관리', icon: '📈' },
    { id: 'booking', label: '예약 관리', icon: '📅' },
    { id: 'contact', label: '상담 관리', icon: '📞' },
    { id: 'team', label: '팀 기능', icon: '👥' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">🎯 MASGOLF 시스템 개요</h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">시스템 소개</h3>
              <p className="text-gray-700 mb-4">
                MASGOLF는 골프 여행 비즈니스를 위한 통합 마케팅 & 운영 플랫폼입니다.
                실시간 데이터 분석, 캠페인 관리, 예약 시스템, 고객 관리까지 모든 것을 한 곳에서!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-bold text-purple-800 mb-2">🏢 관리자 기능</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 전체 시스템 관리</li>
                  <li>• 실시간 대시보드</li>
                  <li>• 캠페인 분석</li>
                  <li>• 재무 관리</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2">👥 팀 멤버 기능</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 콘텐츠 작성</li>
                  <li>• 리드 관리</li>
                  <li>• 개인 성과 확인</li>
                  <li>• 협업 도구</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-yellow-800">
                💡 <strong>팁:</strong> 각 탭을 클릭하여 상세한 사용법을 확인하세요!
              </p>
            </div>
          </div>
        );

      case 'login':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">🔐 로그인 가이드</h2>
            
            <div className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-purple-800 mb-4">관리자 로그인</h3>
                <div className="space-y-3">
                  <div>
                    <strong>접속 URL:</strong> 
                    <code className="ml-2 bg-purple-200 px-2 py-1 rounded">/admin</code>
                  </div>
                  <div>
                    <strong>계정 정보:</strong>
                    <span className="ml-2 text-gray-600">환경변수에 설정된 ID/PW</span>
                  </div>
                  <div className="bg-purple-100 p-3 rounded">
                    <p className="text-sm">⚠️ 관리자 계정은 보안상 절대 외부에 공개하지 마세요!</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-blue-800 mb-4">팀 멤버 로그인</h3>
                <div className="space-y-3">
                  <div>
                    <strong>접속 URL:</strong>
                    <code className="ml-2 bg-blue-200 px-2 py-1 rounded">/team-login</code>
                  </div>
                  <div>
                    <strong>초기 비밀번호:</strong>
                    <code className="ml-2 bg-blue-200 px-2 py-1 rounded">1234</code>
                  </div>
                  <table className="w-full mt-4 text-sm">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-2 text-left">이름</th>
                        <th className="p-2 text-left">이메일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">제이</td>
                        <td className="p-2">mas9golf7@gmail.com</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">스테피</td>
                        <td className="p-2">mas9golf3@gmail.com</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">나부장</td>
                        <td className="p-2">singingstour@gmail.com</td>
                      </tr>
                      <tr>
                        <td className="p-2">허상원</td>
                        <td className="p-2">koolsangwon@gmail.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 대시보드 사용법</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">메인 대시보드 구성</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-purple-600 mb-2">📈 실시간 지표</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 오늘의 예약 건수</li>
                      <li>• 전환율 및 매출</li>
                      <li>• 캠페인 성과</li>
                      <li>• 팀원별 성과</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-600 mb-2">📊 분석 도구</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 전환 퍼널 분석</li>
                      <li>• 고객 스타일 분석</li>
                      <li>• ROI 계산기</li>
                      <li>• 트렌드 예측</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">💡 사용 팁</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 매일 아침 대시보드를 확인하여 전날 성과를 파악하세요</li>
                  <li>• 실시간 알림을 설정하여 중요한 변화를 놓치지 마세요</li>
                  <li>• 필터를 사용하여 원하는 기간의 데이터를 분석하세요</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'campaign':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📈 캠페인 관리</h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-green-800 mb-4">캠페인 생성하기</h3>
                <ol className="space-y-2">
                  <li className="flex">
                    <span className="font-bold mr-2">1.</span>
                    <div>
                      <strong>캠페인 타입 선택</strong>
                      <p className="text-sm text-gray-600">구글, 네이버, 페이스북 중 선택</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="font-bold mr-2">2.</span>
                    <div>
                      <strong>타겟 설정</strong>
                      <p className="text-sm text-gray-600">연령, 지역, 관심사 등 설정</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="font-bold mr-2">3.</span>
                    <div>
                      <strong>예산 및 일정</strong>
                      <p className="text-sm text-gray-600">일일 예산과 캠페인 기간 설정</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="font-bold mr-2">4.</span>
                    <div>
                      <strong>광고 소재 업로드</strong>
                      <p className="text-sm text-gray-600">이미지, 텍스트, CTA 버튼 설정</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">📊 성과 분석</h4>
                <p className="text-sm">캠페인 실행 후 최소 3일 이상의 데이터를 수집한 후 분석하세요.</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• CTR (클릭률): 3% 이상 목표</li>
                  <li>• CPA (획득당 비용): 5만원 이하 목표</li>
                  <li>• ROAS (광고 수익률): 300% 이상 목표</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'booking':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📅 예약 관리</h2>
            
            <div className="space-y-4">
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-indigo-800 mb-4">예약 처리 프로세스</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                    <div>
                      <strong>신규 예약 확인</strong>
                      <p className="text-sm text-gray-600">대시보드에서 실시간 알림 확인</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                    <div>
                      <strong>고객 정보 검증</strong>
                      <p className="text-sm text-gray-600">연락처, 일정, 인원 확인</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                    <div>
                      <strong>예약 확정</strong>
                      <p className="text-sm text-gray-600">골프장 및 숙소 예약 진행</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
                    <div>
                      <strong>확인 메시지 발송</strong>
                      <p className="text-sm text-gray-600">카톡 또는 문자로 예약 확정 안내</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-bold text-red-800 mb-2">⚠️ 주의사항</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 예약 변경/취소는 출발 7일 전까지만 가능</li>
                  <li>• VIP 고객은 별도 표시되므로 우선 처리</li>
                  <li>• 피크 시즌에는 예약 확정 전 재고 확인 필수</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📞 상담 관리</h2>
            
            <div className="space-y-4">
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-teal-800 mb-4">상담 응대 가이드</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-2">📱 전화 상담</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 인사: "안녕하세요, MASGOLF입니다"</li>
                      <li>• 고객 정보 확인 (이름, 연락처)</li>
                      <li>• 니즈 파악 (일정, 인원, 예산)</li>
                      <li>• 맞춤 상품 제안</li>
                      <li>• 상담 내용 CRM에 기록</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-2">💬 카톡 상담</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 30분 이내 응답 원칙</li>
                      <li>• 친근하고 전문적인 톤 유지</li>
                      <li>• 이미지/자료 적극 활용</li>
                      <li>• 상담 이력 저장</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-bold text-orange-800 mb-2">🎯 상담 팁</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 고객의 이름을 자주 부르며 친밀감 형성</li>
                  <li>• Yes 대신 "네, 맞습니다" 사용</li>
                  <li>• 가격보다 가치를 먼저 설명</li>
                  <li>• 마무리는 항상 다음 액션 제시</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">👥 팀 멤버 기능</h2>
            
            <div className="space-y-4">
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-pink-800 mb-4">콘텐츠 작성</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold mb-2">📝 블로그 포스트</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 주 2회 이상 포스팅</li>
                      <li>• SEO 키워드 포함 필수</li>
                      <li>• 이미지 3장 이상 삽입</li>
                      <li>• 1,500자 이상 작성</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-2">📸 SNS 콘텐츠</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 인스타그램: 일 1회</li>
                      <li>• 페이스북: 주 3회</li>
                      <li>• 해시태그 10개 이상</li>
                      <li>• 스토리 활용</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">📊 개인 성과 관리</h4>
                <p className="text-sm mb-2">매월 평가 항목:</p>
                <ul className="space-y-1 text-sm">
                  <li>• 콘텐츠 작성 수</li>
                  <li>• 리드 생성 수</li>
                  <li>• 전환율</li>
                  <li>• 고객 만족도</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">❓ 자주 묻는 질문</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Q: 비밀번호를 잊어버렸어요</h4>
                <p className="text-sm text-gray-600">A: 관리자에게 문의하여 초기화 요청하세요. 팀 멤버는 초기 비밀번호 1234로 재설정됩니다.</p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Q: 예약 취소는 어떻게 하나요?</h4>
                <p className="text-sm text-gray-600">A: 예약 관리 → 해당 예약 선택 → 취소 버튼 클릭. 출발 7일 전까지만 가능합니다.</p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Q: 캠페인 예산은 어떻게 설정하나요?</h4>
                <p className="text-sm text-gray-600">A: 일일 예산은 최소 5만원, 월 예산의 1/30로 설정하세요. 초기에는 적게 시작해서 성과를 보고 증액하는 것을 추천합니다.</p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Q: 실시간 데이터가 안 보여요</h4>
                <p className="text-sm text-gray-600">A: 브라우저 새로고침(F5)을 하거나, 캐시를 삭제해보세요. 그래도 안 되면 다른 브라우저로 시도해보세요.</p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Q: 모바일에서도 사용 가능한가요?</h4>
                <p className="text-sm text-gray-600">A: 네, 반응형으로 제작되어 모바일에서도 모든 기능을 사용할 수 있습니다.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto p-8">
        <div className="text-center text-white mb-8">
          <h1 className="text-5xl font-bold mb-4">📚 MASGOLF 종합 매뉴얼</h1>
          <p className="text-xl opacity-90">세계 최고의 마케팅 팀을 위한 완벽한 가이드</p>
        </div>

        {/* 상단 버튼들 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => window.open(NOTION_PAGE_URL, '_blank')}
            className="bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all"
          >
            📝 노션에서 보기
          </button>
          <button
            onClick={() => router.push('/manual/interactive')}
            className="bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all"
          >
            🎯 인터랙티브 투어
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all"
          >
            🖨️ 인쇄하기
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
          {/* 탭 네비게이션 */}
          <div className="bg-white/5 p-4">
            <div className="flex flex-wrap justify-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-900 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-8">
            <div className="bg-white rounded-xl p-8 max-h-[600px] overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center text-white/60 mt-8 text-sm">
          <p>💡 Tip: 더 자세한 내용은 노션 매뉴얼에서 확인하세요</p>
          <p className="mt-2">최종 업데이트: 2025.07 | Version 1.0</p>
        </div>
      </div>
    </div>
  );
}