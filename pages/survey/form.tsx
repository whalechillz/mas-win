import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

type FormStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const MODEL_OPTIONS = [
  {
    id: 'beryl-47g',
    name: '풀티타늄 베릴 47g(240cpm) S 대응',
    description: '40g대 X 대응 기술력, 가벼우면서도 강한 샤프트',
  },
  {
    id: 'beryl-42g',
    name: '풀티타늄 베릴 42g(230cpm) SR 대응',
    description: '40g대 X 대응 기술력, 가벼우면서도 강한 샤프트',
  },
  {
    id: 'sapphire-53g',
    name: '원플렉스 사파이어 53g (215cpm: 오토 R~S 대응)',
    description: '30g대 R 대응 기술력, 가벼우면서도 강한 샤프트',
  },
  {
    id: 'sapphire-44g',
    name: '원플렉스 사파이어 44g (200cpm: 오토 R2~R 대응)',
    description: '30g대 R 대응 기술력, 가벼우면서도 강한 샤프트',
  },
];

const IMPORTANT_FACTORS = [
  { id: 'distance', label: '비거리' },
  { id: 'direction', label: '방향성' },
  { id: 'feel', label: '타구감(음)' },
];

export default function SurveyForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    age_group: '',
    selected_model: '',
    important_factors: [] as string[],
    additional_feedback: '',
    address: '',
  });

  // 나이를 연령대 그룹으로 변환
  const convertAgeToAgeGroup = (age: string): string => {
    if (!age) return '';
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return '';
    if (ageNum < 20) return '10대';
    if (ageNum < 30) return '20대';
    if (ageNum < 40) return '30대';
    if (ageNum < 50) return '40대';
    if (ageNum < 60) return '50대';
    if (ageNum < 70) return '60대';
    if (ageNum < 80) return '70대';
    return '80대 이상';
  };

  // 나이 입력 시 연령대 자동 업데이트
  const handleAgeChange = (value: string) => {
    const ageGroup = convertAgeToAgeGroup(value);
    setFormData(prev => ({
      ...prev,
      age: value,
      age_group: ageGroup,
    }));
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // 중요 요소 토글
  const toggleImportantFactor = (factorId: string) => {
    setFormData(prev => {
      const current = prev.important_factors;
      const exists = current.includes(factorId);
      if (exists) {
        return { ...prev, important_factors: current.filter(f => f !== factorId) };
      } else {
        return { ...prev, important_factors: [...current, factorId] };
      }
    });
  };

  // 다음 단계로
  const handleNext = () => {
    // 현재 단계 검증
    if (currentStep === 1 && !formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (currentStep === 2 && !formData.phone.trim()) {
      setError('전화번호를 입력해주세요.');
      return;
    }
    if (currentStep === 3 && !formData.age.trim()) {
      setError('나이를 입력해주세요.');
      return;
    }
    if (currentStep === 4 && !formData.selected_model) {
      setError('모델을 선택해주세요.');
      return;
    }
    if (currentStep === 5 && formData.important_factors.length === 0) {
      setError('최소 1개 이상 선택해주세요.');
      return;
    }
    if (currentStep === 7 && !formData.address.trim()) {
      setError('주소를 입력해주세요.');
      return;
    }

    setError('');
    if (currentStep < 7) {
      setCurrentStep((currentStep + 1) as FormStep);
    } else {
      handleSubmit();
    }
  };

  // 이전 단계로
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
      setError('');
    }
  };

  // 제출
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          age: formData.age ? parseInt(formData.age) : null,
          selected_model: formData.selected_model,
          important_factors: formData.important_factors,
          additional_feedback: formData.additional_feedback || null,
          address: formData.address,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '설문 제출에 실패했습니다.');
      }

      // 성공 시 완료 페이지로 이동
      router.push('/survey/success');
    } catch (err: any) {
      setError(err.message || '설문 제출 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 진행률 계산
  const progress = (currentStep / 7) * 100;

  return (
    <>
      <Head>
        <title>설문 조사 - MASSGOO X MUZIIK | 마쓰구골프</title>
        <meta name="description" content="마쓰구 신모델 샤프트 선호도 조사에 참여하세요." />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 진행 바 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {currentStep} / 7
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 폼 카드 */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {/* Step 1: 이름 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">성함을 입력해주세요</h2>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: 전화번호 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">연락처를 입력해주세요</h2>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            )}

            {/* Step 3: 연령대 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">연령대를 입력해주세요</h2>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  placeholder="예: 65"
                  min="10"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                {formData.age_group && (
                  <p className="text-sm text-gray-500">
                    {formData.age_group}로 분류됩니다.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: 모델 선택 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">마쓰구 신모델을 선택해주세요</h2>
                <div className="space-y-3">
                  {MODEL_OPTIONS.map((model) => (
                    <label
                      key={model.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.selected_model === model.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={model.id}
                        checked={formData.selected_model === model.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, selected_model: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="font-semibold text-gray-900 mb-1">{model.name}</div>
                      <div className="text-sm text-gray-600">{model.description}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: 중요 요소 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">클럽 구매 시 중요 요소를 선택해주세요</h2>
                <p className="text-sm text-gray-600 mb-4">복수 선택 가능</p>
                <div className="space-y-3">
                  {IMPORTANT_FACTORS.map((factor) => (
                    <label
                      key={factor.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.important_factors.includes(factor.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.important_factors.includes(factor.id)}
                        onChange={() => toggleImportantFactor(factor.id)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-900 font-medium">{factor.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: 추가 의견 */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  고반발 드라이버 마쓰구에 원하시는 점이 있다면 적어주세요
                </h2>
                <textarea
                  value={formData.additional_feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_feedback: e.target.value }))}
                  placeholder="의견을 자유롭게 입력해주세요 (선택사항)"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            )}

            {/* Step 7: 주소 */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">모자 배송을 위해 주소를 입력해주세요</h2>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="주소를 입력해주세요"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <p className="text-sm text-gray-500">
                  모자 배송을 위해 정확한 주소를 입력해주세요.
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                이전
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '제출 중...' : currentStep === 7 ? '제출하기' : '다음'}
              </button>
            </div>
          </div>

          {/* 취소 링크 */}
          <div className="text-center mt-6">
            <Link href="/survey" className="text-gray-600 hover:text-gray-900 text-sm">
              설문 취소하고 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

