# Vercel 배포 시 Node.js 16 사용 설정

## vercel.json 파일 생성이 필요합니다:

{
  "functions": {
    "pages/api/*.js": {
      "runtime": "nodejs16.x"
    }
  }
}

## 또는 package.json에 추가:

"engines": {
  "node": "16.x"
}

## 배포 후에는 정상적으로 API가 작동할 것입니다.