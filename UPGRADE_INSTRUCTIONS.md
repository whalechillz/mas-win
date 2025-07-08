# 업그레이드 스크립트 실행 방법

## 1. 실행 권한 부여
```bash
chmod +x /Users/m2/MASLABS/win.masgolf.co.kr/scripts/upgrade-admin.sh
```

## 2. 스크립트 실행
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr
./scripts/upgrade-admin.sh
```

## 3. 로컬 테스트
```bash
npm run dev
# http://localhost:3000/admin 접속
```

## 4. 배포
```bash
git add .
git commit -m "feat: 세계 최고의 마케팅 세일즈 관리자 대시보드 구현"
git push
# Vercel 자동 배포 대기
```
