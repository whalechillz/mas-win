import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home({ hostname }) {
  const router = useRouter();

  // 모든 도메인에서 새로운 홈페이지 표시
  return (
    <>
      <Head>
        <title>MASGOLF - 프리미엄 골프 클럽의 새로운 기준</title>
        <meta name="description" content="시니어 골퍼를 위한 특별한 선택, 2.2mm 초박형 페이스로 젊은 날의 비거리를 돌려드립니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {/* 헤더 네비게이션 */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">MASSGOO</Link>
              <nav className="hidden md:flex space-x-8 items-center">
                <a href="https://www.masgolf.co.kr/" className="text-gray-700 hover:text-gray-900">드라이버</a>
                <Link href="#technology" className="text-gray-700 hover:text-gray-900">기술력</Link>
                <Link href="#reviews" className="text-gray-700 hover:text-gray-900">고객후기</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900">브랜드 스토리</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900">시타매장</Link>
                <a href="https://www.mas9golf.com/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  무료 시타
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/main/brand/hero-titanium_02.webp"
                alt="티타늄 드라이버 클로즈업"
                fill
                className="object-cover opacity-60"
                priority
                quality={90}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="mb-6">
              <span className="inline-block bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold mb-4">NEW</span>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300 mb-4">
                <span className="font-bold">美</span>
                <span className="text-gray-500">압도적인</span>
                <span className="text-gray-500">|</span>
                <span className="font-bold">輝</span>
                <span className="text-gray-500">광채의</span>
                <span className="text-gray-500">|</span>
                <span className="font-bold">若</span>
                <span className="text-gray-500">젊음</span>
              </div>
            </div>
            
            <div className="text-blue-400 text-lg font-medium mb-4">
              MASSGOO X MUZIIK
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
              MASSGOO
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
              우아한 엔지니어링. 폭발적인 파워. 세대를 뛰어넘는 퍼포먼스.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="https://www.mas9golf.com/try-a-massgoo" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                무료 시타 신청하기
              </a>
              <Link href="#products" className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors">
                제품 둘러보기
              </Link>
            </div>
          </div>
        </section>

        {/* MASGOLF의 차별점 */}
        <section id="technology" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">MASGOLF의 차별점</h2>
            <p className="text-center text-gray-600 mb-12">혁신적인 기술과 품질로 만드는 특별한 경험</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">R&A 공식 비공인</h3>
                <p className="text-gray-600">영국 왕립 골프협회가 경계할 정도로 강력한 반발력</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💪</div>
                <h3 className="text-xl font-semibold mb-2">시니어 최적화 설계</h3>
                <p className="text-gray-600">느려진 스윙에도 최대 반발력을 내는 2.2mm 초박형 페이스</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">즉각적인 비거리 회복</h3>
                <p className="text-gray-600">첫 시타부터 체감하는 30m 이상의 비거리 증가</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold mb-2">일본 장인정신</h3>
                <p className="text-gray-600">40년 전통 골프스튜디오에서 한정 제작</p>
              </div>
            </div>
          </div>
        </section>

        {/* 페이스 두께의 비밀 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">페이스 두께의 비밀</h2>
            <p className="text-center text-gray-600 mb-12">일반 드라이버보다 33.33% 얇은 2.2mm 티타늄 페이스</p>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src="/main/products/titanium_club_face_1200x800.jpg"
                    alt="2.2mm 티타늄 클럽 페이스"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl font-bold mb-4">2.2mm</div>
                      <div className="text-xl">티타늄 페이스</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-6">티타늄 소재의 차이</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">DAT55G+ Grade 5 (시크릿포스 GOLD 2)</h4>
                      <p className="text-gray-600">최고급 항공우주용 티타늄. 최상의 탄성과 내구성으로 2.2mm 초박형 페이스 구현 가능</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">SP700 Grade 5 (시크릿웨폰 블랙)</h4>
                      <p className="text-gray-600">특수 가공 티타늄. 블랙 PVD 코팅과 결합하여 프리미엄 비주얼과 성능 제공</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">DAT55G (시크릿포스 PRO 3, V3)</h4>
                      <p className="text-gray-600">고강도 티타늄. 안정적인 성능과 내구성으로 일반 골퍼에게 최적</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-lg italic text-gray-700 mb-4">"한 번의 시타로 30m 비거리 증가를 직접 체험하세요"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COR 0.87의 비밀 */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">COR 0.87의 비밀</h2>
            <p className="text-center text-gray-300 mb-12">영국 왕립 골프협회(R&A)가 경계하는 수치</p>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative h-96 bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src="/main/products/driver_impact_1200x800.jpg"
                    alt="드라이버 임팩트 이미지 - COR 0.87"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                    <div className="text-8xl font-bold text-yellow-400 mb-2">0.87</div>
                    <div className="text-xl text-gray-200 mb-4">반발 계수 (COR)</div>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md px-4">
                      <div className="bg-blue-800/90 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-200 mb-1">일반 드라이버</div>
                        <div className="text-2xl font-bold">0.83</div>
                      </div>
                      <div className="bg-orange-600/90 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-200 mb-1">MASGOLF 고반발</div>
                        <div className="text-2xl font-bold">0.87</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-6">COR이 높으면 왜 비거리가 늘어날까?</h3>
                <div className="space-y-6">
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h4 className="font-semibold mb-2">에너지 전달 효율</h4>
                    <p className="text-gray-300">COR 0.87은 임팩트 시 87%의 에너지가 볼에 전달됩니다. 일반 드라이버(0.83)보다 4% 더 많은 에너지가 전달되어 비거리가 증가합니다.</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h4 className="font-semibold mb-2">실제 비거리 증가</h4>
                    <p className="text-gray-300">COR 0.01 증가 시 약 7-8m의 비거리 증가 효과. 0.83 → 0.87은 약 30m의 비거리 증가를 의미합니다.</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h4 className="font-semibold mb-2">R&A 비공인 이유</h4>
                    <p className="text-gray-300">R&A는 COR 0.83을 상한선으로 규정. MASGOLF의 0.87은 이를 초과하는 '비공인' 고반발 드라이버입니다.</p>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-lg italic text-orange-400">"경기용이 아닌, 즐거운 라운드를 위한 선택"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 고반발 드라이버 컬렉션 */}
        <section id="products" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">고반발 드라이버 컬렉션</h2>
            <p className="text-center text-gray-600 mb-12">엄격한 품질관리로 한정 생산되는 프리미엄 드라이버</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {/* 시크릿포스 GOLD 2 */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-yellow-400">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-force-gold-2.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-force-gold-2.jpg"
                      alt="시크릿포스 GOLD 2"
                      fill
                      className="object-cover"
                      priority
                    />
                  </picture>
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-sm font-bold">BEST</div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">시크릿포스 GOLD 2</h3>
                  <p className="text-sm text-gray-600 mb-2">프리미엄 드라이버</p>
                  <p className="text-xl font-bold text-red-600 mb-3">1,700,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• DAT55G+ Grade 5 티타늄</li>
                    <li>• 2.2mm 초박형 페이스</li>
                    <li>• COR 0.87</li>
                  </ul>
                </div>
              </div>

              {/* 시크릿포스 PRO 3 */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-force-pro3.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-force-pro3.jpg"
                      alt="시크릿포스 PRO 3"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">시크릿포스 PRO 3</h3>
                  <p className="text-sm text-gray-600 mb-2">고반발 드라이버</p>
                  <p className="text-xl font-bold text-red-600 mb-3">1,150,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• DAT55G 티타늄</li>
                    <li>• 2.3mm 페이스</li>
                    <li>• COR 0.86</li>
                  </ul>
                </div>
              </div>

              {/* 시크릿포스 V3 */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-force-v3.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-force-v3.jpg"
                      alt="시크릿포스 V3"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">시크릿포스 V3</h3>
                  <p className="text-sm text-gray-600 mb-2">투어 드라이버</p>
                  <p className="text-xl font-bold text-red-600 mb-3">950,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• DAT55G 티타늄</li>
                    <li>• 2.4mm 페이스</li>
                    <li>• COR 0.85</li>
                  </ul>
                </div>
              </div>

              {/* 시크릿웨폰 블랙 */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-400">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-weapon-black.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-weapon-black.jpg"
                      alt="시크릿웨폰 블랙"
                      fill
                      className="object-cover"
                    />
                  </picture>
                  <div className="absolute top-2 left-2 bg-purple-400 text-white px-2 py-1 rounded text-sm font-bold">LIMITED</div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">시크릿웨폰 블랙</h3>
                  <p className="text-sm text-gray-600 mb-2">프리미엄 리미티드</p>
                  <p className="text-xl font-bold text-red-600 mb-3">1,700,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SP700 Grade 5 티타늄</li>
                    <li>• 2.2mm 초박형 페이스</li>
                    <li>• COR 0.87</li>
                  </ul>
                </div>
              </div>

              {/* 시크릿웨폰 4.1 */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-weapon-4-1.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-weapon-4-1.jpg"
                      alt="시크릿웨폰 4.1"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">시크릿웨폰 4.1</h3>
                  <p className="text-sm text-gray-600 mb-2">프리미엄 드라이버</p>
                  <p className="text-xl font-bold text-red-600 mb-3">1,700,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SP700 Grade 5 티타늄</li>
                    <li>• 2.2mm 초박형 페이스</li>
                    <li>• COR 0.87</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <a href="https://www.mas9golf.com/try-a-massgoo" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                무료 시타 신청하기
              </a>
            </div>
          </div>
        </section>

        {/* 가족과 함께하는 골프의 의미 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">가족과 함께하는 골프의 의미</h2>
            <p className="text-center text-gray-600 mb-12">나이가 들수록 소중해지는 것들</p>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src="/campaigns-rare/2025-05-가정의달/캠페인-가정의달/hero_father_son_golf_1080x1920.jpg"
                    alt="가정의달 아버지와 아들의 골프"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-6">왜 시니어에게 고반발 드라이버가 필요한가?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">느려진 스윙 스피드 보완</h4>
                      <p className="text-gray-600">나이가 들면서 자연스럽게 느려지는 스윙 스피드를 고반발 페이스가 보완해줍니다</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">자존감 회복</h4>
                      <p className="text-gray-600">동반자들과 비슷한 비거리로 자신감 있는 라운드가 가능합니다</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">가족과의 즐거운 시간</h4>
                      <p className="text-gray-600">자녀들과 함께하는 라운드에서 멋진 모습을 보여줄 수 있습니다</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <div className="bg-yellow-400 text-black px-8 py-4 rounded-lg inline-block">
                <p className="text-xl font-bold">30년의 골프 경력, 이제는 장비가 당신을 도와드릴 차례입니다</p>
              </div>
            </div>
          </div>
        </section>

        {/* 고객 후기 */}
        <section id="reviews" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">시니어 골퍼들의 생생한 후기</h2>
            <p className="text-center text-gray-600 mb-12">나이는 숫자에 불과, 비거리는 다시 돌아옵니다</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <picture>
                    <source srcSet="/main/testimonials/golfer_avatar_01.webp" type="image/webp" />
                    <Image
                      src="/main/testimonials/golfer_avatar_512x512_01.jpg"
                      alt="김성호 대표"
                      fill
                      className="rounded-full object-cover"
                    />
                  </picture>
                </div>
                <h3 className="text-xl font-semibold mb-2">김성호 대표 (62세)</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">+35m 비거리 증가</p>
                <p className="text-gray-600">"나이 들면서 비거리가 계속 줄어 고민이었는데, 이제 젊은 후배들과 비거리 차이가 거의 안 납니다. 드라이버 하나로 10년은 젊어진 느낌이에요."</p>
              </div>
              
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <picture>
                    <source srcSet="/main/testimonials/golfer_avatar_02.webp" type="image/webp" />
                    <Image
                      src="/main/testimonials/golfer_avatar_512x512_02.jpg"
                      alt="이재민 회장"
                      fill
                      className="rounded-full object-cover"
                    />
                  </picture>
                </div>
                <h3 className="text-xl font-semibold mb-2">이재민 회장 (58세)</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">+28m 비거리 증가</p>
                <p className="text-gray-600">"예전엔 파5홀에서 3온이 힘들었는데, 지금은 편하게 2온 합니다. 동반자들이 다들 비거리 늘었다고 놀라더군요."</p>
              </div>
              
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <picture>
                    <source srcSet="/main/testimonials/golfer_avatar_03.webp" type="image/webp" />
                    <Image
                      src="/main/testimonials/golfer_avatar_512x512_03.jpg"
                      alt="박준영 원장"
                      fill
                      className="rounded-full object-cover"
                    />
                  </picture>
                </div>
                <h3 className="text-xl font-semibold mb-2">박준영 원장 (65세)</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">+32m 비거리 증가</p>
                <p className="text-gray-600">"스윙 스피드가 예전 같지 않아 포기하고 있었는데, 고반발 드라이버로 바꾸니 젊은 시절 비거리가 다시 나옵니다. 골프가 다시 재미있어졌어요."</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-lg mb-4">지금 무료 시타를 신청하고 직접 경험해보세요</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <a href="https://www.mas9golf.com/try-a-massgoo" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  무료 시타 신청하기
                </a>
                <a href="https://www.mas9golf.com/contact" className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  시타매장
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 문의 폼 */}
        <section id="contact" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">문의하기</h2>
              <p className="text-center text-gray-600 mb-8">MASGOLF 전문가가 답변해 드립니다</p>
              
              <form id="contact-form" className="bg-white rounded-lg shadow-lg p-8" onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const payload = Object.fromEntries(formData.entries());
                try {
                  const res = await fetch('/api/slack-contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) {
                    alert('전송에 실패했습니다. 필수 항목을 확인해주세요.');
                    return;
                  }
                  alert('문의가 접수되었습니다. 빠르게 연락드리겠습니다.');
                  form.reset();
                } catch (err) {
                  alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                }
              }}>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름*</label>
                    <input name="name" required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <input name="email" type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처*</label>
                  <input name="phone" required type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 클럽 브랜드*</label>
                    <input name="clubBrand" required type="text" placeholder="예: 타이틀리스트, 캘러웨이" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">로프트 각도*</label>
                    <input name="loft" required type="text" placeholder="예: 9.5°, 10.5°" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">샤프트 강도*</label>
                    <input name="shaft" required type="text" placeholder="예: R, SR, S" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 비거리*</label>
                    <input name="distance" required type="text" placeholder="예: 캐리 170m / 토탈 200m" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">연령대*</label>
                    <select name="ageGroup" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">선택하세요</option>
                      <option value="40대">40대</option>
                      <option value="50대">50대</option>
                      <option value="60대">60대</option>
                      <option value="70대">70대</option>
                      <option value="80대 이상">80대 이상</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">문의내용</label>
                  <textarea name="message" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
                </div>
                <div className="text-center">
                  <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                    문의 전송
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12 mb-12">
              {/* MASGOLF 브랜드 정보 */}
              <div>
                <h3 className="text-2xl font-bold mb-6">MASGOLF®</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  MASGOLF는 2003년부터 당신의 골프 여정에 함께해 왔습니다. 
                  20년 전통의 기술력으로 만든 고반발 드라이버 전문 브랜드로, 
                  시니어 골퍼를 위한 특별한 골프 클럽을 제공합니다.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>사업자명: MASGOLF® | 대표자명: 김탁수</p>
                  <p>사업자등록번호: 877-07-00641</p>
                  <p>통신판매업신고번호: 제 2017-수원영통-0623호</p>
                  <p>상표권 등록일: 2003-07-31</p>
                </div>
              </div>

              {/* 시타 센터 정보 */}
              <div>
                <h4 className="text-xl font-semibold mb-6">시타 센터</h4>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <p className="font-medium mb-2">주소</p>
                    <p className="text-sm">수원시 영통구 법조로 149번길 200</p>
                    <p className="text-sm text-yellow-400">(광교 갤러리아에서 차량 5분)</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">연락처</p>
                    <p className="text-sm">방문 상담 예약: 031-215-0013</p>
                    <p className="text-sm">비거리 상담: 080-028-8888 (무료)</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">영업시간</p>
                    <p className="text-sm">월-금 09:00 - 18:00</p>
                    <p className="text-sm text-yellow-400">주말은 예약제로 운영합니다</p>
                  </div>
                  
                </div>
              </div>

              {/* 연락처 및 링크 */}
              <div>
                <h4 className="text-xl font-semibold mb-6">연락처</h4>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <p className="font-medium mb-2">이메일</p>
                    <p className="text-sm">hello@masgolf.co.kr</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">웹사이트</p>
                    <div className="space-y-1">
                      <a href="https://www.mas9golf.com" className="text-yellow-400 hover:text-yellow-300 text-sm block">www.mas9golf.com</a>
                      <a href="https://www.masgolf.co.kr" className="text-yellow-400 hover:text-yellow-300 text-sm block">www.masgolf.co.kr</a>
                    </div>
                  </div>
                  <div className="mt-6">
                    <a href="https://www.mas9golf.com/try-a-massgoo" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block">
                      무료 시타 신청 +30m 비거리
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 구분선 및 저작권 */}
            <div className="border-t border-gray-800 pt-8">
              <div className="text-center">
                <div className="text-gray-400 text-sm">
                  <p>© 2025 MASGOLF All Rights Reserved.</p>
                </div>
              </div>
            </div>
    </div>
        </footer>
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { req } = context;
  const hostname = req.headers.host;

  // muziik.masgolf.co.kr 루트 접근은 콜라보 사이트로 강제 이동
  if (hostname === 'muziik.masgolf.co.kr') {
    return {
      redirect: {
        destination: '/muziik',
        permanent: false,
      },
    };
  }

  // win.masgolf.co.kr만 /25-09로 301 리다이렉트 (SEO 최적화)
  if (hostname === 'win.masgolf.co.kr') {
    return {
      redirect: {
        destination: '/25-09',
        permanent: true, // 301 리다이렉트로 변경
      },
    };
  }

  // 다른 도메인들은 새로운 홈페이지 표시
  return {
    props: {
      hostname: hostname || '',
    },
  };
}
