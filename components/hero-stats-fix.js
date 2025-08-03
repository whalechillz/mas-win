// 영웅 섹션 스타일 수정 파일
// 이 코드를 funnel-2025-08-vacation-final.html의 해당 부분에 적용하세요

/* 모바일 대응 수정된 스타일 */
.hero-stats-container {
    background: rgba(255,255,255,0.15);
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 30px;
    backdrop-filter: blur(10px);
}

.hero-stats-grid {
    display: flex;
    justify-content: space-around;
    align-items: center;
    text-align: center;
    gap: 15px;
}

.hero-stat-item {
    flex: 1;
    min-width: 0; /* 중요: 텍스트가 줄바꿈되지 않도록 */
}

.hero-stat-number {
    font-size: 2.5rem;
    font-weight: 900;
    color: #FFEB3B;
    margin-bottom: 5px;
    white-space: nowrap;
    line-height: 1;
}

.hero-stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
    white-space: nowrap;
    line-height: 1.2;
}

/* 모바일에서 글자 크기 조정 */
@media (max-width: 480px) {
    .hero-stat-number {
        font-size: 2rem;
    }
    
    .hero-stat-label {
        font-size: 0.8rem;
    }
    
    .hero-stats-grid {
        gap: 10px;
    }
}

/* HTML 구조 예시 */
/*
<div class="hero-stats-container">
    <div class="hero-stats-grid">
        <div class="hero-stat-item">
            <div class="hero-stat-number">91%</div>
            <p class="hero-stat-label">고객 만족도</p>
        </div>
        <div class="hero-stat-item">
            <div class="hero-stat-number">+20m</div>
            <p class="hero-stat-label">평균 비거리</p>
        </div>
        <div class="hero-stat-item">
            <div class="hero-stat-number">4주</div>
            <p class="hero-stat-label">체감 기간</p>
        </div>
    </div>
</div>
*/

/* 인라인 스타일 버전 (바로 적용 가능) */
const inlineStyles = `
<div style="background: rgba(255,255,255,0.15); border-radius: 20px; padding: 25px; margin-bottom: 30px; backdrop-filter: blur(10px);">
    <div style="display: flex; justify-content: space-around; align-items: center; text-align: center; gap: 15px;">
        <div style="flex: 1; min-width: 0;">
            <div style="font-size: 2.2rem; font-weight: 900; color: #FFEB3B; margin-bottom: 5px; white-space: nowrap; line-height: 1;">91%</div>
            <p style="font-size: 0.85rem; opacity: 0.9; white-space: nowrap; line-height: 1.2; margin: 0;">고객 만족도</p>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-size: 2.2rem; font-weight: 900; color: #FFEB3B; margin-bottom: 5px; white-space: nowrap; line-height: 1;">+20m</div>
            <p style="font-size: 0.85rem; opacity: 0.9; white-space: nowrap; line-height: 1.2; margin: 0;">비거리 증가</p>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-size: 2.2rem; font-weight: 900; color: #FFEB3B; margin-bottom: 5px; white-space: nowrap; line-height: 1;">4주</div>
            <p style="font-size: 0.85rem; opacity: 0.9; white-space: nowrap; line-height: 1.2; margin: 0;">체감 기간</p>
        </div>
    </div>
</div>
`;
