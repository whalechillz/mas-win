import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';

type FormStep = 1 | 2 | 3;

const determineClubPlaceholder = (ageGroup: string) => {
  switch (ageGroup) {
    case '20대':
    case '30대':
    case '40대':
      return '예: 타이틀리스트 9.5° S, 핑 430 9° SR';
    case '50대':
    case '60대':
    case '70대':
    case '80대 이상':
      return '예: 마제스티 10.5° R, 혼마 10.5° SR, MASGOO';
    default:
      return '예: 타이틀리스트 9.5° S, 마제스티 10.5° R';
  }
};

const determineDistancePlaceholder = (ageGroup: string) => {
  switch (ageGroup) {
    case '20대':
    case '30대':
    case '40대':
      return '예: 200 (대략적인 수치로 괜찮아요)';
    case '50대':
    case '60대':
    case '70대':
    case '80대 이상':
      return '예: 180 (대략적인 수치로 괜찮아요)';
    default:
      return '예: 190 (대략적인 수치로 괜찮아요)';
  }
};

export default function BookingForm() {
  const router = useRouter();
  const { date, time, service } = router.query;
  
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [clubPlaceholder, setClubPlaceholder] = useState(determineClubPlaceholder(''));
  const [distancePlaceholder, setDistancePlaceholder] = useState(determineDistancePlaceholder(''));

  const [formData, setFormData] = useState({
    // Phase 1: 필수 정보
    name: '',
    phone: '',
    email: '',
    age: '',
    age_group: '',
    // Phase 2: 골프 정보
    club_brand: '',
    club_loft: '',
    club_shaft: '',
    current_distance: '',
    trajectory: '',
    shot_shape: '',
    // Phase 3: 개인화
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [showEmailField, setShowEmailField] = useState(false);
  
  const selectedShotShapes = useMemo(
    () => (formData.shot_shape ? formData.shot_shape.split(',').filter(Boolean) : []),
    [formData.shot_shape]
  );

  const selectedTrajectories = useMemo(
    () => (formData.trajectory ? formData.trajectory.split(',').filter(Boolean) : []),
    [formData.trajectory]
  );

  const toggleShotShape = (value: string) => {
    setFormData((prev) => {
      const current = prev.shot_shape ? prev.shot_shape.split(',').filter(Boolean) : [];
      const exists = current.includes(value);
      let updated: string[];
      
      if (exists) {
        updated = current.filter((item) => item !== value);
      } else {
        // 최대 2개까지만 선택
        if (current.length >= 2) {
          return prev;
        }
        updated = [...current, value];
      }
      return { ...prev, shot_shape: updated.join(',') };
    });
  };

  const toggleTrajectory = (value: string) => {
    setFormData((prev) => {
      const current = prev.trajectory ? prev.trajectory.split(',').filter(Boolean) : [];
      const exists = current.includes(value);
      let updated: string[];
      
      if (exists) {
        updated = current.filter((item) => item !== value);
      } else {
        // 최대 2개까지만 선택
        if (current.length >= 2) {
          return prev;
        }
        updated = [...current, value];
      }
      return { ...prev, trajectory: updated.join(',') };
    });
  };

  const isShotShapeSelected = (value: string) => selectedShotShapes.includes(value);
  const isTrajectorySelected = (value: string) => selectedTrajectories.includes(value);

  // 탄도 조합 표기
  const getTrajectoryDisplay = (trajectory: string) => {
    if (!trajectory) return '';
    const selected = trajectory.split(',').filter(Boolean);
    if (selected.length === 1) {
      const map: { [key: string]: string } = { low: '저탄도', mid: '중탄도', high: '고탄도' };
      return map[selected[0]] || '';
    }
    if (selected.length === 2) {
      const sorted = selected.sort();
      if (sorted.includes('low') && sorted.includes('mid')) return '중저탄도';
      if (sorted.includes('mid') && sorted.includes('high')) return '중고탄도';
      if (sorted.includes('low') && sorted.includes('high')) return '저고탄도';
    }
    return selected.map(s => {
      if (s === 'low') return '저탄도';
      if (s === 'mid') return '중탄도';
      return '고탄도';
    }).join(', ');
  };

  // 구질 한글 표기
  const getShotShapeDisplay = (shotShape: string) => {
    if (!shotShape) return '';
    const selected = shotShape.split(',').filter(Boolean);
    const map: { [key: string]: string } = {
      hook: '훅',
      draw: '드로우',
      straight: '스트레이트',
      fade: '페이드',
      slice: '슬라이스',
    };
    return selected.map(s => map[s] || s).join(', ');
  };

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
      age_group: ageGroup
    }));
    // 연령대에 따른 placeholder 업데이트
    if (ageGroup) {
      setClubPlaceholder(determineClubPlaceholder(ageGroup));
      setDistancePlaceholder(determineDistancePlaceholder(ageGroup));
    }
  };

  // 브랜드 자동완성
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const normalizePhoneNumber = (value: string) => value.replace(/[^0-9]/g, '');

  // 전화번호로 고객 정보 자동 조회
  useEffect(() => {
    const normalized = normalizePhoneNumber(formData.phone);
    if (normalized.length >= 10) {
      fetchCustomerInfo(normalized);
    } else {
      setCustomerInfo(null);
    }
  }, [formData.phone]);

  // 이메일이 자동으로 채워졌다면 필드 표시
  useEffect(() => {
    if (formData.email) {
      setShowEmailField(true);
    }
  }, [formData.email]);

  // 브랜드 자동완성
  useEffect(() => {
    if (formData.club_brand && formData.club_brand.length >= 1) {
      fetchBrandSuggestions(formData.club_brand);
    } else {
      setBrandSuggestions([]);
      setShowBrandSuggestions(false);
    }
  }, [formData.club_brand]);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        brandInputRef.current &&
        !brandInputRef.current.contains(event.target as Node)
      ) {
        setShowBrandSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomerInfo = async (phone: string) => {
    try {
      const response = await fetch(`/api/bookings/customer/${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setCustomerInfo(data.customer);
          // 고객 정보가 있으면 자동 입력
          setFormData(prev => ({
            ...prev,
            name: data.customer.name || prev.name,
            phone: data.customer.phone ? formatPhoneNumber(data.customer.phone) : prev.phone,
            email: data.customer.email || prev.email,
            current_distance: data.customer.avg_distance?.toString() || prev.current_distance,
            trajectory: data.customer.preferred_trajectory || prev.trajectory,
            shot_shape: data.customer.typical_shot_shape || prev.shot_shape
          }));
          if (data.customer.email) {
            setShowEmailField(true);
          }
        }
      }
    } catch (err) {
      console.log('Customer info not found');
    }
  };

  const fetchBrandSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/bookings/club-brands?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setBrandSuggestions(data.brands || []);
        setShowBrandSuggestions(true);
      }
    } catch (err) {
      console.error('Error fetching brand suggestions:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
      return;
    }
    if (name === 'age_group') {
      setFormData(prev => ({
        ...prev,
        age_group: value
      }));
      setClubPlaceholder(determineClubPlaceholder(value));
      setDistancePlaceholder(determineDistancePlaceholder(value));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBrandSelect = (brand: string) => {
    setFormData(prev => ({ ...prev, club_brand: brand }));
    setShowBrandSuggestions(false);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Phase 1 검증: 이름, 전화번호 필수
      if (!formData.name || !formData.phone) {
        setError('이름과 전화번호는 필수 입력 항목입니다.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    let total = 0;

    // Phase 1
    total += 2;
    if (formData.name) completed++;
    if (formData.phone) completed++;

    // Phase 2 (선택적)
    if (formData.club_brand || formData.current_distance || formData.trajectory || formData.shot_shape) {
      total += 4;
      if (formData.club_brand) completed++;
      if (formData.current_distance) completed++;
      if (formData.trajectory) completed++;
      if (formData.shot_shape) completed++;
    }

    // Phase 3 (선택적)
    if (formData.notes) {
      total += 1;
      completed++;
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!date || !time) {
      setError('날짜와 시간 정보가 없습니다. 다시 예약을 시작해주세요.');
      setLoading(false);
      return;
    }

     const normalizedPhone = normalizePhoneNumber(formData.phone);
     if (normalizedPhone.length < 10) {
       setError('전화번호를 정확하게 입력해주세요.');
       setLoading(false);
       return;
     }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: normalizedPhone,
          date,
          time,
          service_type: service === 'check-distance' 
            ? '만족스런 비거리를 점검해 보세요'
            : '마쓰구 드라이버 시타서비스',
          duration: 60,
          location: 'Massgoo Studio',
          age: formData.age ? parseInt(formData.age) : null,
          current_distance: formData.current_distance ? parseInt(formData.current_distance) : null,
          club_loft: formData.club_loft ? parseFloat(formData.club_loft) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예약에 실패했습니다.');
      }

      const booking = await response.json();
      
      // 예약 완료 페이지로 이동
      router.push({
        pathname: '/booking/success',
        query: {
          id: booking.id,
          date: booking.date,
          time: booking.time
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  if (!date || !time) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">날짜와 시간 정보가 없습니다.</p>
          <Link href="/booking" className="text-blue-600 hover:text-blue-700">
            예약 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <>
      <Head>
        <title>시타 예약 - 고객 정보 입력 | 마쓰구골프</title>
        <meta name="description" content="시타 예약을 위한 고객 정보를 입력해주세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="relative h-8 w-auto max-w-[140px]">
                  <Image
                    src="/main/logo/massgoo_logo_black.png"
                    alt="MASSGOO 로고"
                    width={140}
                    height={32}
                    priority
                    className="h-8 w-auto object-contain max-w-full"
                  />
                </div>
              </Link>
              <Link href="/booking" className="text-gray-700 hover:text-gray-900">
                ← 돌아가기
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">예약 정보 입력</h1>
              <p className="text-gray-600">
                예약 날짜: {date} {time}
              </p>
            </div>

            {/* 진행률 바 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">골프 프로필 완성도</span>
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {progress < 50 && (
                <p className="text-xs text-gray-500 mt-1">
                  상세 정보를 입력하시면 더 정확한 피팅이 가능합니다
                </p>
              )}
            </div>

            {/* 진행 단계 표시 */}
            <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span className={`text-xs sm:text-sm ${currentStep >= 1 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
                  기본 정보
                </span>
              </div>
              <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <span className={`text-xs sm:text-sm ${currentStep >= 2 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
                  골프 정보
                </span>
              </div>
              <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <span className={`text-xs sm:text-sm ${currentStep >= 3 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
                  개인화
                </span>
              </div>
            </div>

            {/* 고객 정보 자동 조회 알림 */}
            {customerInfo && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  ✅ 기존 고객 정보를 찾았습니다
                </p>
                <div className="mt-2 text-xs text-blue-700 space-y-1">
                  {customerInfo.visit_count > 0 && (
                    <p>• 방문 횟수: {customerInfo.visit_count}회</p>
                  )}
                  {customerInfo.last_visit_date && (
                    <p>• 최근 방문일: {customerInfo.last_visit_date}</p>
                  )}
                  {customerInfo.customer_grade && customerInfo.customer_grade !== 'NONE' && (
                    <p>• VIP 등급: {customerInfo.customer_grade}</p>
                  )}
                </div>
                <p className="mt-3 text-xs text-blue-600">
                  입력란을 자동으로 채워드렸습니다. 필요 시 내용을 수정해주세요.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phase 1: 필수 정보 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">기본 정보</h2>
                    <p className="text-sm text-gray-600 mb-6">예약에 필요한 기본 정보를 입력해주세요.</p>
                  </div>

                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-blue-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호 <span className="text-blue-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="010-1234-5678"
                      inputMode="tel"
                      pattern="[0-9-]*"
                      maxLength={13}
                      autoComplete="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                  </div>

                  {/* 이메일 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        이메일 (선택)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (showEmailField && !formData.email) {
                            setShowEmailField(false);
                          } else {
                            setShowEmailField(true);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        {showEmailField || formData.email
                          ? '숨기기'
                          : '이메일도 입력할게요'}
                      </button>
                    </div>
                    {showEmailField && (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="선택 입력"
                      />
                    )}
                  </div>

                </div>
              )}

              {/* Phase 2: 골프 정보 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">골프 정보</h2>
                    <p className="text-sm text-gray-600 mb-6">더 정확한 피팅을 위해 골프 정보를 입력해주세요. (선택사항)</p>
                  </div>

                  {/* 클럽 브랜드 */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      현재 사용 클럽 (브랜드 / 로프트 / 샤프트)
                    </label>
                    <input
                      ref={brandInputRef}
                      type="text"
                      name="club_brand"
                      value={formData.club_brand}
                      onChange={handleChange}
                      onFocus={() => {
                        if (brandSuggestions.length > 0) {
                          setShowBrandSuggestions(true);
                        }
                      }}
                      placeholder={clubPlaceholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {showBrandSuggestions && brandSuggestions.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                      >
                        {brandSuggestions.map((brand, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleBrandSelect(brand)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 로프트 각도 */}
                  {formData.club_brand && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          로프트 각도
                        </label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {['8.5', '9.0', '9.5', '10.0', '10.5', '11.0', '11.5', '12.0'].map((loft) => (
                              <button
                                key={loft}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, club_loft: prev.club_loft === loft ? '' : loft }))}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                  formData.club_loft === loft
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-700 hover:border-blue-300'
                                }`}
                              >
                                {loft}°
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, club_loft: '' }))}
                            className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                              !formData.club_loft
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-300 text-gray-500 hover:border-blue-300'
                            }`}
                          >
                            선택 안 함
                          </button>
                        </div>
                      </div>

                      {/* 샤프트 강도 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          샤프트 강도
                        </label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-7 gap-2">
                            {['L', 'R2', 'R1', 'R', 'SR', 'S', 'X'].map((shaft) => (
                              <button
                                key={shaft}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, club_shaft: prev.club_shaft === shaft ? '' : shaft }))}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                  formData.club_shaft === shaft
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-700 hover:border-blue-300'
                                }`}
                              >
                                {shaft}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, club_shaft: '' }))}
                            className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                              !formData.club_shaft
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-300 text-gray-500 hover:border-blue-300'
                            }`}
                          >
                            선택 안 함
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 현재 비거리 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      현재 비거리 (m)
                    </label>
                    <input
                      type="number"
                      name="current_distance"
                      value={formData.current_distance}
                      onChange={handleChange}
                      placeholder={distancePlaceholder}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* 탄도 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      탄도
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'low', label: '▽', helper: '저탄도' },
                        { value: 'mid', label: '△', helper: '중탄도' },
                        { value: 'high', label: '▲', helper: '고탄도' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleTrajectory(option.value)}
                          className={`px-4 py-3 rounded-xl border-2 font-medium transition-all flex flex-col items-center gap-1 ${
                            isTrajectorySelected(option.value)
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                              : 'border-gray-300 text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-lg">{option.label}</span>
                          <span className="text-[11px] text-gray-500">{option.helper}</span>
                        </button>
                      ))}
                    </div>
                    {formData.trajectory && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        선택: {getTrajectoryDisplay(formData.trajectory)}
                        {selectedTrajectories.length >= 2 && <span className="text-blue-600 ml-1">(최대 2개)</span>}
                      </p>
                    )}
                  </div>

                  {/* 구질 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      구질
                    </label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleShotShape('straight')}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                          isShotShapeSelected('straight')
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-xl">⬆️</span>
                        <span>스트레이트</span>
                        <span className="text-[11px] text-gray-500">정면</span>
                      </button>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'hook', label: '⬅️', main: '훅', helper: '왼쪽 크게' },
                          { value: 'draw', label: '↖️', main: '드로우', helper: '왼쪽 살짝' },
                          { value: 'fade', label: '↗️', main: '페이드', helper: '오른쪽 살짝' },
                          { value: 'slice', label: '➡️', main: '슬라이스', helper: '오른쪽 크게' },
                        ].map((shape) => (
                          <button
                            key={shape.value}
                            type="button"
                            onClick={() => toggleShotShape(shape.value)}
                            className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                              isShotShapeSelected(shape.value)
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-gray-300 text-gray-700 hover:border-blue-300'
                            }`}
                          >
                            <span className="text-xl">{shape.label}</span>
                            <span className="text-xs font-medium">{shape.main}</span>
                            <span className="text-[10px] text-gray-500">{shape.helper}</span>
                          </button>
                        ))}
                      </div>
                      {formData.shot_shape && (
                        <p className="text-xs text-gray-500 text-center">
                          선택: {getShotShapeDisplay(formData.shot_shape)}
                          {selectedShotShapes.length >= 2 && <span className="text-blue-600 ml-1">(최대 2개)</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 연령대 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연령대
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      placeholder="예: 65"
                      min="10"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.age_group && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.age_group}로 분류됩니다. 예시 값이 자동으로 조정됩니다.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Phase 3: 개인화 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">개인화</h2>
                    <p className="text-sm text-gray-600 mb-6">추가 정보를 입력하시면 더 나은 서비스를 제공할 수 있습니다.</p>
                  </div>

                  {/* 추가 메모 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      어떤 부분을 개선하고 싶으신가요?
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="예: 비거리, 정확도, 탄도 등 개선하고 싶은 부분을 알려주세요. 특별히 관심 있는 클럽이 있으시면 함께 적어주세요."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* 네비게이션 버튼 */}
              <div className="flex justify-between pt-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    이전
                  </button>
                ) : (
                  <Link
                    href="/booking"
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </Link>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? '예약 중...' : '예약 완료'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
