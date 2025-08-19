import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface HomeProps {
  hostname?: string;
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
              <div className="relative">
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-blue-600 flex flex-col items-center justify-center text-white">
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
                  <p className="text-lg italic text-gray-300">"경기용이 아닌, 즐거운 라운드를 위한 선택"</p>
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
              {/* 시크릿포스 GOLD 2 */}
              <div className="bg-white border-2 border-yellow-400 rounded-lg p-6 shadow-lg relative">
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-sm font-bold">BEST</div>
                <div className="text-center mb-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">GOLD</span>
                  </div>
                  <h3 className="text-xl font-bold">시크릿포스 GOLD 2</h3>
                  <p className="text-gray-600">프리미엄 드라이버</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">소재:</span>
                    <span className="font-semibold">DAT55G+ Grade 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">페이스:</span>
                    <span className="font-semibold">2.2mm 초박형</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">COR:</span>
                    <span className="font-semibold text-red-600">0.87</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-2">₩890,000</p>
                  <Link href="/25-08" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-6 py-2 rounded-lg font-semibold transition-colors">
                    무료 시타 신청
                  </Link>
                </div>
              </div>

              {/* 시크릿웨폰 블랙 */}
              <div className="bg-white border-2 border-gray-800 rounded-lg p-6 shadow-lg relative">
                <div className="absolute top-4 right-4 bg-gray-800 text-white px-2 py-1 rounded text-sm font-bold">LIMITED</div>
                <div className="text-center mb-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">BLACK</span>
                  </div>
                  <h3 className="text-xl font-bold">시크릿웨폰 블랙</h3>
                  <p className="text-gray-600">고반발 드라이버</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">소재:</span>
                    <span className="font-semibold">SP700 Grade 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">페이스:</span>
                    <span className="font-semibold">2.3mm 페이스</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">COR:</span>
                    <span className="font-semibold text-red-600">0.86</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-2">₩750,000</p>
                  <Link href="/25-08" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                    무료 시타 신청
                  </Link>
                </div>
              </div>

              {/* 시크릿포스 PRO 3 */}
              <div className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">PRO</span>
                  </div>
                  <h3 className="text-xl font-bold">시크릿포스 PRO 3</h3>
                  <p className="text-gray-600">투어 드라이버</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">소재:</span>
                    <span className="font-semibold">DAT55G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">페이스:</span>
                    <span className="font-semibold">2.4mm 페이스</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">COR:</span>
                    <span className="font-semibold text-red-600">0.85</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-2">₩650,000</p>
                  <Link href="/25-08" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                    무료 시타 신청
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/25-08" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
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
              <div className="relative">
                <div className="relative h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-2xl font-bold mb-4">아버지와 아들의 골프</h3>
                      <p className="text-xl italic mb-4">"아버지, 정말 멋지세요!"</p>
                      <p className="text-lg">- 아들의 한마디가 주는 행복</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-6">왜 시니어에게 고반발 드라이버가 필요한가?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">느려진 스윙 스피드 보완</h4>
                      <p className="text-gray-600">나이가 들면서 자연스럽게 느려지는 스윙 스피드를 고반발 페이스가 보완해줍니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">자존감 회복</h4>
                      <p className="text-gray-600">동반자들과 비슷한 비거리를 낼 수 있어 자신감 있는 라운드가 가능합니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">가족과의 즐거운 시간</h4>
                      <p className="text-gray-600">자녀들과 함께하는 라운드에서 멋진 모습을 보여줄 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 시니어 골퍼들의 생생한 후기 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">시니어 골퍼들의 생생한 후기</h2>
            <p className="text-center text-gray-600 mb-12">나이는 숫자에 불과, 비거리는 다시 돌아옵니다</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* 후기 1 */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">김</span>
                </div>
                <h3 className="font-bold text-lg mb-2">김성호 대표 (62세)</h3>
                <p className="text-blue-600 font-bold text-lg mb-4">+35m 비거리 증가</p>
                <p className="text-gray-600 italic">"10년 젊어진 기분입니다. 동반자들이 놀라워하는 표정이 정말 즐겁네요!"</p>
              </div>

              {/* 후기 2 */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">이</span>
                </div>
                <h3 className="font-bold text-lg mb-2">이재민 회장 (58세)</h3>
                <p className="text-green-600 font-bold text-lg mb-4">+28m 비거리 증가</p>
                <p className="text-gray-600 italic">"파5에서 2온으로 올라가는 게 이제 편안해졌어요. 동반자들이 깜짝 놀라더군요."</p>
              </div>

              {/* 후기 3 */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">박</span>
                </div>
                <h3 className="font-bold text-lg mb-2">박준영 원장 (65세)</h3>
                <p className="text-purple-600 font-bold text-lg mb-4">+32m 비거리 증가</p>
                <p className="text-gray-600 italic">"젊은 날의 비거리가 돌아왔어요. 골프가 다시 재미있어졌습니다!"</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-lg mb-6">지금 무료 시타를 신청하고 직접 경험해보세요</p>
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
                    <input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">이메일</label>
                    <input type="email" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">연락처*</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">현재 클럽 브랜드*</label>
                    <input type="text" placeholder="예: 타이틀리스트, 캘러웨이" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">로프트 각도*</label>
                    <input type="text" placeholder="예: 9.5°, 10.5°" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">샤프트 강도*</label>
                    <input type="text" placeholder="예: R, SR, S" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">현재 비거리*</label>
                    <input type="text" placeholder="예: 캐리 170m / 토탈 200m" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">연령대*</label>
                  <select className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" required>
                    <option value="">선택하세요</option>
                    <option value="40-50">40-50대</option>
                    <option value="50-60">50-60대</option>
                    <option value="60-70">60-70대</option>
                    <option value="70+">70대 이상</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">문의내용</label>
                  <textarea rows={4} className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white" placeholder="골프 클럽에 대한 궁금한 점이나 시타 신청 관련 문의사항을 자유롭게 작성해주세요."></textarea>
                </div>
                
                <div className="text-center">
                  <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                    문의 전송
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-800 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">MASGOLF®</h3>
                <p className="text-gray-300 mb-4">시니어 골퍼를 위한 특별한 선택</p>
                <p className="text-sm text-gray-400">
                  상호명: MASGOLF<br />
                  대표: 김성호<br />
                  사업자등록번호: 123-45-67890<br />
                  통신판매업신고: 2025-서울강남-1234<br />
                  상표등록: 2025년 1월 15일
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">시타 센터</h3>
                <p className="text-gray-300 mb-4">
                  주소: 경기도 수원시<br />
                  (광교 갤러리아에서 5분)
                </p>
                <p className="text-sm text-gray-400">
                  방문 예약: 010-1234-5678<br />
                  거리 상담: 1588-1234<br />
                  운영시간: 평일 09:00-18:00<br />
                  주말: 예약제
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">연락처</h3>
                <p className="text-gray-300 mb-4">
                  이메일: hello@masgolf.co.kr<br />
                  웹사이트: www.mas9golf.com<br />
                  공식사이트: www.masgolf.co.kr
                </p>
                <Link href="/25-08" className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  무료 시타 신청 +30m 비거리
                </Link>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-400">© 2025 MASGOLF All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      hostname: context.req.headers.host || '',
    },
  };
}
