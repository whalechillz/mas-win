// BigQuery 할당량 자동 설정 스크립트
// Google Cloud Console 할당량 페이지에서 실행

console.log("🚀 BigQuery 할당량 자동 설정 시작...");

// 설정할 할당량 목록
const quotasToUpdate = [
    {
        name: "Extract bytes per day",
        currentValue: "54.976 TB",
        newValue: 1,
        unit: "GB",
        description: "BigQuery API - Extract bytes per day"
    },
    {
        name: "Cross cloud transferred bytes per day", 
        currentValue: "2.089 TB",
        newValue: 1,
        unit: "GB",
        description: "BigQuery API - Cross cloud transferred bytes per day"
    },
    {
        name: "AlloyDB federated query cross region bytes per day",
        currentValue: "1.1 TB", 
        newValue: 1,
        unit: "GB",
        description: "BigQuery API - AlloyDB federated query cross region bytes per day"
    },
    {
        name: "BigQuery Omni materialized query bytes per day",
        currentValue: "1.1 TB",
        newValue: 1, 
        unit: "GB",
        description: "BigQuery API - BigQuery Omni materialized query bytes per day"
    },
    {
        name: "Cloud SQL federated query cross region bytes per day",
        currentValue: "1.1 TB",
        newValue: 1,
        unit: "GB", 
        description: "BigQuery API - Cloud SQL federated query cross region bytes per day"
    },
    {
        name: "Extract jobs per day",
        currentValue: "100,000",
        newValue: 100,
        unit: "개",
        description: "BigQuery API - Extract jobs per day"
    }
];

// 할당량 설정 함수
function updateQuota(quotaName, newValue, unit) {
    console.log(`📝 ${quotaName} 할당량 설정 중...`);
    
    // 할당량 테이블에서 해당 행 찾기
    const rows = document.querySelectorAll('tr[data-testid="quota-row"]');
    
    for (let row of rows) {
        const quotaText = row.textContent;
        if (quotaText.includes(quotaName)) {
            console.log(`✅ ${quotaName} 행 발견`);
            
            // 체크박스 선택
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.click();
                console.log(`☑️ ${quotaName} 체크박스 선택`);
                
                // 편집 버튼 클릭
                setTimeout(() => {
                    const editButton = document.querySelector('button[data-testid="edit-quota-button"]');
                    if (editButton) {
                        editButton.click();
                        console.log(`✏️ ${quotaName} 편집 버튼 클릭`);
                        
                        // 새 값 입력
                        setTimeout(() => {
                            const valueInput = document.querySelector('input[data-testid="quota-value-input"]');
                            if (valueInput) {
                                valueInput.value = newValue;
                                valueInput.dispatchEvent(new Event('input', { bubbles: true }));
                                console.log(`📊 ${quotaName} 새 값 입력: ${newValue}`);
                                
                                // 단위 선택 (GB인 경우)
                                if (unit === "GB") {
                                    const unitDropdown = document.querySelector('select[data-testid="quota-unit-select"]');
                                    if (unitDropdown) {
                                        unitDropdown.value = "GB";
                                        unitDropdown.dispatchEvent(new Event('change', { bubbles: true }));
                                        console.log(`📏 ${quotaName} 단위 선택: GB`);
                                    }
                                }
                                
                                // 요청 제출 버튼 클릭
                                setTimeout(() => {
                                    const submitButton = document.querySelector('button[data-testid="submit-quota-request"]');
                                    if (submitButton) {
                                        submitButton.click();
                                        console.log(`🚀 ${quotaName} 요청 제출 완료`);
                                    }
                                }, 1000);
                            }
                        }, 1000);
                    }
                }, 1000);
            }
            break;
        }
    }
}

// 메인 실행 함수
function runQuotaUpdates() {
    console.log("🎯 BigQuery 할당량 자동 설정 시작");
    
    quotasToUpdate.forEach((quota, index) => {
        setTimeout(() => {
            updateQuota(quota.name, quota.newValue, quota.unit);
        }, index * 5000); // 5초 간격으로 실행
    });
    
    console.log("✅ 모든 할당량 설정 요청 완료");
}

// 스크립트 실행
runQuotaUpdates();

// 사용법 안내
console.log(`
📋 BigQuery 할당량 자동 설정 스크립트

🎯 설정할 할당량들:
${quotasToUpdate.map(q => `- ${q.description}: ${q.currentValue} → ${q.newValue} ${q.unit}`).join('\n')}

🚀 실행 방법:
1. Google Cloud Console 할당량 페이지에서 F12 개발자 도구 열기
2. Console 탭에서 이 스크립트 실행
3. 자동으로 할당량 설정 진행

⚠️ 주의사항:
- 각 할당량 설정 간 5초 대기
- 설정 완료까지 약 30초 소요
- 설정 중 페이지를 닫지 마세요
`);
