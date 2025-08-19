import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

interface HomeProps {
  hostname: string;
}

export default function Home({ hostname }: HomeProps) {
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
              <div className="text-2xl font-bold text-gray-900">MASGOLF</div>
              <nav className="hidden md:flex space-x-8">
                <Link href="#drivers" className="text-gray-700 hover:text-gray-900">드라이버</Link>
                <Link href="#technology" className="text-gray-700 hover:text-gray-900">기술력</Link>
                <Link href="#reviews" className="text-gray-700 hover:text-gray-900">고객후기</Link>
                <Link href="#contact" className="text-gray-700 hover:text-gray-900">문의하기</Link>
                <Link href="/25-08" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  무료 시타
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <div className="text-sm text-yellow-400 mb-4">MASGOLF Summer Campaign</div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                시니어 골퍼를 위한 특별한 선택
              </h1>
              <h2 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-4">
                나이가 들수록 비거리는<br />
                더 멀리 나가야 합니다
              </h2>
              <p className="text-xl mb-8">
                스윙 스피드가 느려져도 괜찮습니다<br />
                초박형 2.2mm 페이스가 젊은 날의 비거리를 돌려드립니다
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link href="/25-08" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  무료 시타 신청하기
                </Link>
                <Link href="#products" className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors">
                  제품 둘러보기
                </Link>
              </div>
            </div>
            <p className="text-center text-lg">
              50대, 60대, 70대... 나이는 숫자에 불과합니다
            </p>
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
              <div className="text-center">
                <div className="relative inline-block">
                  <Image
                    src="/main/products/driver-black.jpg"
                    alt="MASGOLF 드라이버"
                    width={400}
                    height={300}
                    className="rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-lg p-4">
                      <div className="text-6xl font-bold text-blue-600">2.2mm</div>
                      <div className="text-lg text-gray-700">티타늄 페이스</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6">티타늄 소재의 차이</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✓</div>
                    <div>
                      <h4 className="font-semibold">DAT55G+ Grade 5 (시크릿포스 GOLD 2)</h4>
                      <p className="text-gray-600">최고급 항공우주 티타늄으로 최적의 탄성과 내구성, 2.2mm 초박형 페이스 구현</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✓</div>
                    <div>
                      <h4 className="font-semibold">SP700 Grade 5 (시크릿웨폰 블랙)</h4>
                      <p className="text-gray-600">특수 가공 티타늄에 블랙 PVD 코팅으로 프리미엄 비주얼과 성능</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✓</div>
                    <div>
                      <h4 className="font-semibold">DAT55G (시크릿포스 PRO 3, V3)</h4>
                      <p className="text-gray-600">고강도 티타늄으로 일반 골퍼에게 최적화된 안정적인 성능과 내구성</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <p className="text-center text-blue-800 font-semibold">
                    "한 번의 시타로 30m 비거리 증가를 직접 체험하세요"
                  </p>
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
              <div>
                <h3 className="text-2xl font-bold mb-6">COR이 높으면 왜 비거리가 늘어날까?</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold mb-3">에너지 전달 효율</h4>
                    <p className="text-gray-300">COR 0.87은 공에 87%의 에너지를 전달합니다. 일반 드라이버(0.83)보다 4% 더 많은 에너지 전달로 비거리 증가</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-3">실제 비거리 증가</h4>
                    <p className="text-gray-300">COR 0.01 증가당 약 7-8m 비거리 증가. 0.83에서 0.87로의 변화는 약 30m 비거리 증가</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-3">R&A 비공인 이유</h4>
                    <p className="text-gray-300">R&A는 0.83을 한계로 설정하여 MASGOLF의 0.87은 "비공인" 고반발 드라이버</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="relative inline-block">
                  <Image
                    src="/main/hero/golfer-swing.jpg"
                    alt="골퍼 스윙"
                    width={500}
                    height={400}
                    className="rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-yellow-400 text-gray-900 rounded-lg p-4">
                      <div className="text-4xl font-bold">0.87</div>
                      <div className="text-sm">반발 계수 (COR)</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <p className="text-center text-gray-300">
                    "경기용이 아닌, 즐거운 라운드를 위한 선택"
                  </p>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">BEST</div>
                  <Image
                    src="/main/products/secretforce-gold2.jpg"
                    alt="시크릿포스 GOLD 2"
                    width={200}
                    height={150}
                    className="mx-auto rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">시크릿포스 GOLD 2</h3>
                <p className="text-gray-600 text-center mb-4">프리미엄 드라이버</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• DAT55G+ Grade 5 티타늄</p>
                  <p>• 2.2mm 초박형 페이스</p>
                  <p>• COR 0.87</p>
                </div>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold text-red-600">₩1,980,000</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">LIMITED</div>
                  <Image
                    src="/main/products/secretweapon-black.jpg"
                    alt="시크릿웨폰 블랙"
                    width={200}
                    height={150}
                    className="mx-auto rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">시크릿웨폰 블랙</h3>
                <p className="text-gray-600 text-center mb-4">고반발 드라이버</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• SP700 Grade 5 티타늄</p>
                  <p>• 2.3mm 페이스</p>
                  <p>• 블랙 PVD 코팅</p>
                </div>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold text-red-600">₩1,680,000</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <Image
                    src="/main/products/secretforce-pro3.jpg"
                    alt="시크릿포스 PRO 3"
                    width={200}
                    height={150}
                    className="mx-auto rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">시크릿포스 PRO 3</h3>
                <p className="text-gray-600 text-center mb-4">투어 드라이버</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• DAT55G 티타늄</p>
                  <p>• 2.4mm 페이스</p>
                  <p>• 안정적인 성능</p>
                </div>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold text-red-600">₩1,380,000</p>
                </div>
              </div>
            </div>
            <div className="text-center mt-12">
              <Link href="/25-08" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                무료 시타 신청하기
              </Link>
            </div>
          </div>
        </section>

        {/* 가족과 함께하는 골프의 의미 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">가족과 함께하는 골프의 의미</h2>
            <p className="text-center text-gray-600 mb-12">나이가 들수록 소중해지는 것들</p>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center">
                <Image
                  src="/main/hero/family-golf.jpg"
                  alt="아버지와 아들의 골프"
                  width={500}
                  height={400}
                  className="rounded-lg shadow-lg"
                />
                <div className="mt-6">
                  <h3 className="text-2xl font-bold mb-2">아버지와 아들의 골프</h3>
                  <p className="text-xl text-blue-600 mb-2">"아버지, 정말 멋지세요!"</p>
                  <p className="text-gray-600">- 아들의 한마디가 주는 행복</p>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6">왜 시니어에게 고반발 드라이버가 필요한가?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✓</div>
                    <div>
                      <h4 className="font-semibold">느려진 스윙 스피드 보완</h4>
                      <p className="text-gray-600">나이가 들면서 자연스럽게 느려지는 스윙 스피드를 고반발 페이스가 보완해줍니다</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✓</div>
                    <div>
                      <h4 className="font-semibold">자존감 회복</h4>
                      <p className="text-gray-600">동반자들과 비슷한 비거리를 낼 수 있어 더 자신감 있는 라운드가 가능합니다</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✓</div>
                    <div>
                      <h4 className="font-semibold">가족과의 즐거운 시간</h4>
                      <p className="text-gray-600">자녀들과의 라운드에서 멋진 모습을 보여줄 수 있는 기회를 제공합니다</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 시니어 골퍼들의 생생한 후기 */}
        <section id="reviews" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">시니어 골퍼들의 생생한 후기</h2>
            <p className="text-center text-gray-600 mb-12">나이는 숫자에 불과, 비거리는 다시 돌아옵니다</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Image
                  src="/main/testimonials/senior1.jpg"
                  alt="김성호 대표"
                  width={120}
                  height={120}
                  className="rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-bold mb-2">김성호 대표 (62세)</h3>
                <p className="text-blue-600 font-semibold mb-4">+35m 비거리 증가</p>
                <p className="text-gray-600 italic">
                  "10년 젊어진 기분입니다. 이제 파5 홀에서도 2타 온을 노릴 수 있어요!"
                </p>
              </div>
              <div className="text-center">
                <Image
                  src="/main/testimonials/senior2.jpg"
                  alt="이재민 회장"
                  width={120}
                  height={120}
                  className="rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-bold mb-2">이재민 회장 (58세)</h3>
                <p className="text-blue-600 font-semibold mb-4">+28m 비거리 증가</p>
                <p className="text-gray-600 italic">
                  "동반자들이 깜짝 놀랐어요. 이제 편하게 파5 홀 2타 온이 가능합니다."
                </p>
              </div>
              <div className="text-center">
                <Image
                  src="/main/testimonials/senior3.jpg"
                  alt="박준영 원장"
                  width={120}
                  height={120}
                  className="rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-bold mb-2">박준영 원장 (65세)</h3>
                <p className="text-blue-600 font-semibold mb-4">+32m 비거리 증가</p>
                <p className="text-gray-600 italic">
                  "젊은 날의 비거리가 돌아왔어요. 골프가 다시 재미있어졌습니다!"
                </p>
              </div>
            </div>
            <div className="text-center mt-12">
              <p className="text-lg text-gray-700 mb-6">지금 무료 시타를 신청하고 직접 경험해보세요</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link href="/25-08" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  무료 시타 신청하기
                </Link>
                <Link href="#contact" className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  문의하기
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 문의하기 */}
        <section id="contact" className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">문의하기</h2>
            <p className="text-center text-gray-300 mb-12">MASGOLF 전문가가 답변해 드립니다</p>
            <div className="max-w-2xl mx-auto">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">이름*</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">이메일</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                      placeholder="hong@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">연락처*</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">현재 클럽 브랜드*</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                    placeholder="예: 타이틀리스트, 캘러웨이"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">로프트 각도*</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                      placeholder="예: 9.5°, 10.5°"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">샤프트 강도*</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                      placeholder="예: R, SR, S"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">현재 비거리*</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                      placeholder="예: 캐리 170m / 토탈 200m"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">연령대*</label>
                  <select className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500">
                    <option value="">선택하세요</option>
                    <option value="40-50">40-50대</option>
                    <option value="50-60">50-60대</option>
                    <option value="60-70">60-70대</option>
                    <option value="70+">70대 이상</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">문의내용</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                    placeholder="골프 클럽에 대한 궁금한 점을 자유롭게 작성해주세요."
                  ></textarea>
                </div>
                <div className="text-center">
                  <button
                    type="submit"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
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
                    <Link href="/25-08" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block">
                      무료 시타 신청 +30m 비거리
                    </Link>
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

export const getServerSideProps: GetServerSideProps<HomeProps> = async (context) => {
  const { req } = context;
  const hostname = req.headers.host;

  // 모든 도메인에서 새로운 홈페이지 표시 (리다이렉트 제거)
  return {
    props: {
      hostname: hostname || '',
    },
  };
};
