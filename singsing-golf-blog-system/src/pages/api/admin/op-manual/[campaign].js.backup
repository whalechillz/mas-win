export default function handler(req, res) {
  // 관리자 인증 확인
  const { admin_auth } = req.cookies;
  
  if (!admin_auth || admin_auth !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 캠페인 ID 확인
  const { campaign } = req.query;
  
  if (campaign !== '2025-07') {
    return res.status(404).json({ error: 'Manual not found' });
  }

  // OP 매뉴얼 HTML 반환
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAS GOLF 7월 썸머 스페셜 캠페인 OP 매뉴얼</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #1e3a8a;
            font-size: 2.5em;
            margin-bottom: 10px;
            text-align: center;
        }
        
        h2 {
            color: #2563eb;
            margin-top: 40px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        h3 {
            color: #3730a3;
            margin-top: 25px;
        }
        
        h4 {
            color: #4c1d95;
            margin-top: 20px;
        }
        
        .campaign-info {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #f3f4f6;
            font-weight: 600;
        }
        
        .alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .tip {
            background: #fefce8;
            border: 1px solid #fde047;
            color: #713f12;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .success {
            background: #f0fdf4;
            border: 1px solid #86efac;
            color: #166534;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .script-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-style: italic;
        }
        
        .product-card {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875em;
            font-weight: 600;
        }
        
        .badge-popular {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-vip {
            background: #e0e7ff;
            color: #3730a3;
        }
        
        .checklist {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .checklist-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        
        .checklist-item input[type="checkbox"] {
            margin-right: 10px;
            width: 18px;
            height: 18px;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        
        .print-break {
            page-break-after: always;
        }
        
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 MAS GOLF 7월 썸머 스페셜 캠페인 OP 매뉴얼 🚨</h1>
        
        <div class="campaign-info">
            <h2>📋 캠페인 개요</h2>
            <h3>캠페인명</h3>
            <p><strong>7월 한정 썸머 스페셜 - 뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비</strong></p>
            
            <h3>캠페인 기간</h3>
            <ul>
                <li><strong>2025년 7월 1일 ~ 7월 31일</strong></li>
                <li>선착순 인원: 20명 → 0명 (날짜별 자동 감소)</li>
            </ul>
            
            <h3>핵심 메시지</h3>
            <ul>
                <li>평균 <strong>25m 비거리 증가</strong></li>
                <li>50-60대 골퍼 맞춤 설계</li>
                <li>일본산 프리미엄 티타늄 사용</li>
            </ul>
        </div>
        
        <h2>🎁 사은품 정책</h2>
        
        <h3>1. 기본 사은품 (전원 증정)</h3>
        <div class="product-card">
            <h4>고급 스포츠 쿨링 세트</h4>
            <ul>
                <li><strong>구성:</strong> 쿨링 타올 + 쿨토시(팔토시)</li>
                <li><strong>대상:</strong> 전화 상담 또는 방문 상담 고객 전원</li>
                <li><strong>특징:</strong>
                    <ul>
                        <li>쿨링 타올: 여름철 땀 흡수, 얇고 가벼워 수납 용이</li>
                        <li>쿨토시: 체감온도 감소, 자외선 차단, 고탄력 원단</li>
                    </ul>
                </li>
            </ul>
        </div>
        
        <h3>2. 구매 사은품 (가격대별 차등)</h3>
        <table>
            <thead>
                <tr>
                    <th>제품명</th>
                    <th>가격</th>
                    <th>사은품</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>시크리트포스 V3</td>
                    <td>95만원</td>
                    <td>쿨링세트 + <strong>발베니 12년</strong></td>
                </tr>
                <tr>
                    <td>시크리트포스 PRO 3</td>
                    <td>115만원</td>
                    <td>쿨링세트 + <strong>발렌타인 21년</strong></td>
                </tr>
                <tr>
                    <td>시크리트웨폰 블랙</td>
                    <td>170만원</td>
                    <td>쿨링세트 + <strong>로얄 살루트 21년</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="alert">
            <strong>⚠️ 주의사항</strong>
            <ul>
                <li>위스키는 만 19세 이상 성인에게만 증정</li>
                <li>현장 직접 수령 또는 택배 발송 가능</li>
                <li>한정 수량으로 조기 소진 가능</li>
            </ul>
        </div>
        
        <div class="print-break"></div>
        
        <h2>🏌️ 제품 정보</h2>
        
        <div class="product-card">
            <h3>1. 시크리트포스 V3 (95만원)</h3>
            <ul>
                <li><strong>특징:</strong> 편안한 스윙감, 부드러운 파워</li>
                <li><strong>페이스:</strong> 2.4mm 초강력 페이스</li>
                <li><strong>반발계수:</strong> 0.87</li>
                <li><strong>추천 대상:</strong> 편안한 스윙을 원하는 골퍼</li>
            </ul>
        </div>
        
        <div class="product-card">
            <h3>2. 시크리트포스 PRO 3 (115만원) <span class="badge badge-popular">⭐인기</span></h3>
            <ul>
                <li><strong>특징:</strong> 안정적인 비거리 향상</li>
                <li><strong>페이스:</strong> 2.3mm 고반발 헤드</li>
                <li><strong>반발계수:</strong> 0.87</li>
                <li><strong>추천 대상:</strong> 일관된 스윙, 정확한 타구를 원하는 골퍼</li>
            </ul>
        </div>
        
        <div class="product-card">
            <h3>3. 시크리트웨폰 블랙 (170만원) <span class="badge badge-vip">👑VIP</span></h3>
            <ul>
                <li><strong>특징:</strong> 정확한 방향성, 저중심 설계</li>
                <li><strong>페이스:</strong> 2.2mm 고반발 페이스</li>
                <li><strong>반발계수:</strong> 0.86</li>
                <li><strong>추천 대상:</strong> 방향성과 비거리를 모두 원하는 골퍼</li>
            </ul>
        </div>
        
        <h3>공통 특징</h3>
        <ul>
            <li><strong>헤드 체적:</strong> 460cc</li>
            <li><strong>샤프트:</strong> NGS 전용 샤프트</li>
            <li><strong>보증:</strong> 샤프트 10년 무료 교체</li>
        </ul>
        
        <h2>📞 상담 스크립트</h2>
        
        <h3>인바운드 응대</h3>
        <div class="script-box">
            "안녕하세요, MAS GOLF입니다.<br>
            7월 썸머 스페셜 프로모션 진행 중입니다.<br>
            지금 상담만 받으셔도 고급 쿨링 세트를 무료로 드리고 있습니다.<br>
            어떤 도움을 드릴까요?"
        </div>
        
        <h3>쿨링 세트 안내</h3>
        <div class="script-box">
            "전화 주신 것만으로도 여름 라운딩 필수품인<br>
            쿨링 타올과 쿨토시 세트를 무료로 보내드립니다.<br>
            주소 확인해 드릴까요?"
        </div>
        
        <h3>비거리 증가 설명</h3>
        <div class="script-box">
            "MAS 드라이버는 2.2~2.4mm 초박형 페이스와<br>
            0.87의 높은 반발계수로 평균 25m 비거리 증가를<br>
            경험하실 수 있습니다.<br>
            현재 비거리가 어느 정도 되시나요?"
        </div>
        
        <div class="print-break"></div>
        
        <h2>💡 맞춤 클럽 추천 가이드</h2>
        
        <h3>퀴즈 기반 추천 로직</h3>
        
        <h4>Q1. 스윙 스타일</h4>
        <ul>
            <li><strong>안정형:</strong> 일관된 스윙, 정확한 타구</li>
            <li><strong>파워형:</strong> 강력한 임팩트, 긴 비거리</li>
            <li><strong>복합형:</strong> 균형잡힌 플레이</li>
        </ul>
        
        <h4>Q2. 중요 요소</h4>
        <ul>
            <li><strong>비거리:</strong> 더 멀리 보내기</li>
            <li><strong>방향성:</strong> 정확한 목표 지점</li>
            <li><strong>편안함:</strong> 부드러운 스윙감</li>
        </ul>
        
        <h4>Q3. 현재 비거리</h4>
        <p>고객의 현재 비거리 입력 → +25m 예상 비거리 제시</p>
        
        <h3>플렉스 추천 기준</h3>
        <table>
            <thead>
                <tr>
                    <th>현재 비거리</th>
                    <th>추천 플렉스</th>
                    <th>CPM</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>~180m</td>
                    <td>R2</td>
                    <td>202</td>
                </tr>
                <tr>
                    <td>180-200m</td>
                    <td>R1</td>
                    <td>212</td>
                </tr>
                <tr>
                    <td>200-220m</td>
                    <td>R</td>
                    <td>220</td>
                </tr>
                <tr>
                    <td>220-240m</td>
                    <td>SR</td>
                    <td>230</td>
                </tr>
                <tr>
                    <td>240m~</td>
                    <td>S</td>
                    <td>240</td>
                </tr>
            </tbody>
        </table>
        
        <h2>📋 예약 및 문의 처리</h2>
        
        <h3>시타 예약 필수 정보</h3>
        <ol>
            <li>고객명</li>
            <li>연락처</li>
            <li>희망 날짜</li>
            <li>희망 시간 (9시-17시)</li>
            <li>관심 클럽</li>
        </ol>
        
        <h3>문의 접수 필수 정보</h3>
        <ol>
            <li>고객명</li>
            <li>연락처</li>
            <li>통화 가능 시간대 (복수 선택 가능)</li>
        </ol>
        
        <h3>데이터베이스 저장 정보</h3>
        <p>기본 정보 + 퀴즈 답변 (스윙 스타일, 중요 요소, 현재 비거리, 추천 플렉스)</p>
        
        <div class="print-break"></div>
        
        <h2>⚠️ 주의사항</h2>
        
        <h3>선착순 관리</h3>
        <ul>
            <li>7월 7일: 20명</li>
            <li>7월 31일: 0명</li>
            <li>날짜별 비례 감소 (자동 계산)</li>
        </ul>
        
        <h3>위스키 증정 관련</h3>
        <ol>
            <li><strong>반드시 성인 확인</strong> (만 19세 이상)</li>
            <li>미성년자에게는 절대 제공 불가</li>
            <li>신분증 확인 필수</li>
        </ol>
        
        <h3>품질 보증</h3>
        <h4>헤드 보증</h4>
        <ul>
            <li>시크리트웨폰 블랙: 2년</li>
            <li>시크리트포스 PRO 3, V3: 1년</li>
        </ul>
        
        <h4>샤프트 보증</h4>
        <ul>
            <li><strong>시크리트웨폰 블랙:</strong> 10년 무료 교체 (기본 포함)</li>
            <li><strong>시크리트포스 PRO 3, V3:</strong> 10년 무료 교체 옵션 (15만원 추가)</li>
        </ul>
        
        <h2>📱 시스템 사용법</h2>
        
        <h3>플로팅 버튼</h3>
        <ul>
            <li>위치: 화면 우측 하단 (모바일: bottom 140px)</li>
            <li>기능:
                <ul>
                    <li>모바일: 즉시 전화 연결</li>
                    <li>데스크톱: 팝업 표시</li>
                </ul>
            </li>
        </ul>
        
        <h3>예약/문의 데이터</h3>
        <ul>
            <li>Supabase 자동 저장</li>
            <li>Slack 알림 자동 발송</li>
            <li>퀴즈 데이터 포함 저장</li>
        </ul>
        
        <h2>🚨 긴급 대응</h2>
        
        <h3>기술 문제 발생 시</h3>
        <ol>
            <li>수동으로 고객 정보 기록</li>
            <li>IT팀 즉시 연락</li>
            <li>고객에게 양해 구하고 대체 방법 안내</li>
        </ol>
        
        <h3>재고 소진 시</h3>
        <ol>
            <li>대체 사은품 안내</li>
            <li>다음 프로모션 우선 혜택 약속</li>
            <li>상급자 보고</li>
        </ol>
        
        <h2>🖥️ 관리자 페이지 사용법</h2>
        
        <h3>접속 정보</h3>
        <ul>
            <li><strong>URL:</strong> <code>https://win.masgolf.co.kr/admin</code></li>
            <li><strong>로그인:</strong> 별도 제공된 ID/PW 사용</li>
        </ul>
        
        <h3>주요 기능</h3>
        <ol>
            <li><strong>예약 관리</strong>
                <ul>
                    <li>시타 예약 내역 확인</li>
                    <li>고객 정보 및 퀴즈 답변 확인</li>
                    <li>우선순위 설정 가능</li>
                </ul>
            </li>
            <li><strong>문의 관리</strong>
                <ul>
                    <li>문의 접수 내역 확인</li>
                    <li>통화 가능 시간대 확인</li>
                    <li>처리 상태 업데이트</li>
                </ul>
            </li>
            <li><strong>통계 확인</strong>
                <ul>
                    <li>일별/주별/월별 통계</li>
                    <li>제품별 판매 현황</li>
                    <li>사은품 지급 현황</li>
                </ul>
            </li>
        </ol>
        
        <h3>데이터 확인 방법</h3>
        <ol>
            <li>관리자 페이지 로그인</li>
            <li>좌측 메뉴에서 원하는 항목 선택</li>
            <li>날짜 필터링으로 기간별 조회</li>
            <li>엑셀 다운로드 기능 활용</li>
        </ol>
        
        <h2>📊 일일 체크리스트</h2>
        
        <div class="checklist">
            <div class="checklist-item">
                <input type="checkbox" id="check1">
                <label for="check1">선착순 잔여 인원 확인</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check2">
                <label for="check2">사은품 재고 확인</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check3">
                <label for="check3">예약 현황 확인</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check4">
                <label for="check4">미처리 문의 확인</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check5">
                <label for="check5">Slack 알림 정상 작동 확인</label>
            </div>
        </div>
        
        <h2>🎯 판매 목표</h2>
        
        <div class="success">
            <ul>
                <li>일일 목표: 3건 이상</li>
                <li>주간 목표: 20건 이상</li>
                <li>월간 목표: 80건 이상</li>
            </ul>
            <p><strong>화이팅! 7월 최고의 실적을 만들어봅시다! 🔥</strong></p>
        </div>
    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
