# GTM API 자동화 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성/선택
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 API 활성화
1. API 및 서비스 > 라이브러리
2. "Tag Manager API" 검색
3. "사용" 버튼 클릭

### 1.3 서비스 계정 생성
1. API 및 서비스 > 사용자 인증 정보
2. "사용자 인증 정보 만들기" > "서비스 계정"
3. 서비스 계정 이름 입력 (예: gtm-automation)
4. 역할: "Tag Manager 편집자" 선택
5. 키 생성 > JSON 형식 선택
6. 다운로드된 JSON 파일을 안전한 곳에 보관

## 2. GTM에서 권한 부여

1. GTM 관리 > 사용자 관리
2. "+" 버튼 클릭
3. 서비스 계정 이메일 추가 (JSON 파일에서 확인)
4. 권한: "게시" 권한 부여

## 3. 실제 ID 확인

현재 GTM URL:
```
https://tagmanager.google.com/#/container/accounts/6241977234/containers/191131940/workspaces/8
```

- Account ID: 6241977234
- Container ID: 191131940
- Workspace ID: 8

## 4. 스크립트 수정

gtm_automation.py 파일에서:
```python
ACCOUNT_ID = '6241977234'
CONTAINER_ID = '191131940'  
WORKSPACE_ID = '8'
SERVICE_ACCOUNT_FILE = './gtm-service-account.json'
```

## 5. 실행

```bash
# Python 버전
python3 scripts/gtm_automation.py

# 또는 Node.js 버전
npm install googleapis
node scripts/gtm-automation.js
```

## 주의사항

- 서비스 계정 JSON 파일은 절대 Git에 커밋하지 마세요
- .gitignore에 추가: `*.json`, `service-account-*.json`
- 실행 전 GTM 백업 권장
- 테스트 workspace에서 먼저 실행 권장

## 장점

1. **시간 절약**: 수동 설정 30분 → 자동 설정 30초
2. **오류 방지**: 휴먼 에러 제거
3. **재사용성**: 다른 프로젝트에도 활용 가능
4. **버전 관리**: 설정을 코드로 관리

## 추가 기능 아이디어

- 기존 설정 백업
- 설정 비교 및 검증
- 여러 환경(dev/prod) 동시 설정
- 설정 템플릿화
