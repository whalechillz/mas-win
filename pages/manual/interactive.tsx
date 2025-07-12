import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function InteractiveGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const steps = [
    {
      title: "MASGOLF에 오신 것을 환영합니다! 🎉",
      content: "세계 최고의 마케팅 팀을 위한 통합 관리 시스템입니다.",
      image: "🏌️",
      action: "시작하기"
    },
    {
      title: "두 가지 계정 시스템 📊",
      content: (
        <div className="space-y-4">
          <div className="bg-purple-100 p-4 rounded-lg">
            <h4 className="font-bold text-purple-800">🏢 관리자</h4>
            <p>전체 시스템 관리 권한</p>
            <code className="text-sm bg-purple-200 px-2 py-1 rounded">/admin</code>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800">👥 팀 멤버</h4>
            <p>콘텐츠 작성 및 리드 관리</p>
            <code className="text-sm bg-blue-200 px-2 py-1 rounded">/team-login</code>
          </div>
        </div>
      ),
      action: "다음"
    },
    {
      title: "대시보드 둘러보기 📈",
      content: (
        <div className="space-y-3">
          <p>로그인 후 볼 수 있는 주요 기능:</p>
          <ul className="space-y-2">
            <li className="flex items-center"><span className="mr-2">📊</span> 실시간 성과 지표</li>
            <li className="flex items-center"><span className="mr-2">📅</span> 예약 관리</li>
            <li className="flex items-center"><span className="mr-2">📞</span> 상담 현황</li>
            <li className="flex items-center"><span className="mr-2">📈</span> 캠페인 분석</li>
          </ul>
        </div>
      ),
      action: "다음"
    },
    {
      title: "첫 로그인 하기 🔐",
      content: (
        <div className="space-y-4">
          <p className="font-semibold">팀 멤버 초기 비밀번호: <code className="bg-gray-200 px-2 py-1 rounded">1234</code></p>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">⚠️ 첫 로그인 시 반드시 비밀번호를 변경하세요!</p>
          </div>
          <p className="text-sm text-gray-600">관리자는 환경변수에 설정된 계정을 사용합니다.</p>
        </div>
      ),
      action: "다음"
    },
    {
      title: "더 자세한 내용은? 📚",
      content: (
        <div className="space-y-4 text-center">
          <p className="text-lg">노션에서 계속 업데이트되는 상세 매뉴얼을 확인하세요!</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.open('https://www.notion.so/22aaa1258b818081bdf4f2fe4d119dab', '_blank')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              노션 매뉴얼 보기 📖
            </button>
            <button 
              onClick={() => router.push('/admin')}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              관리자 로그인 →
            </button>
            <button 
              onClick={() => router.push('/team-login')}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              팀 멤버 로그인 →
            </button>
          </div>
        </div>
      ),
      action: "완료"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 mx-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <p className="text-white/60 text-center mt-2 text-sm">
            {currentStep + 1} / {steps.length}
          </p>
        </div>

        {/* 콘텐츠 카드 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            {steps[currentStep].image && (
              <div className="text-6xl mb-4">{steps[currentStep].image}</div>
            )}
            <h2 className="text-3xl font-bold text-white mb-4">
              {steps[currentStep].title}
            </h2>
          </div>

          <div className="text-white/90 mb-8">
            {typeof steps[currentStep].content === 'string' ? (
              <p className="text-lg text-center">{steps[currentStep].content}</p>
            ) : (
              steps[currentStep].content
            )}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'invisible'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              이전
            </button>

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              {steps[currentStep].action}
            </button>
          </div>
        </div>

        {/* 스킵 옵션 */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-white/60 hover:text-white/80 text-sm underline"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}