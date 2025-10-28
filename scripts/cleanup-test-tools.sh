#!/bin/bash

# 테스트 도구 자동 정리 스크립트
# 사용법: ./scripts/cleanup-test-tools.sh [옵션]

echo "🧹 테스트 도구 정리 시작..."

# 옵션 처리
CLEAN_TEMP=false
CLEAN_DEBUG=false
CLEAN_ALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --temp)
      CLEAN_TEMP=true
      shift
      ;;
    --debug)
      CLEAN_DEBUG=true
      shift
      ;;
    --all)
      CLEAN_ALL=true
      shift
      ;;
    --help)
      echo "사용법: $0 [옵션]"
      echo "옵션:"
      echo "  --temp     임시 파일 정리 (7일 이상)"
      echo "  --debug    사용하지 않는 디버깅 도구 정리 (30일 이상)"
      echo "  --all      모든 정리 실행"
      echo "  --help     도움말 표시"
      exit 0
      ;;
    *)
      echo "알 수 없는 옵션: $1"
      echo "도움말을 보려면 --help를 사용하세요"
      exit 1
      ;;
  esac
done

# 기본값: 모든 정리 실행
if [ "$CLEAN_TEMP" = false ] && [ "$CLEAN_DEBUG" = false ] && [ "$CLEAN_ALL" = false ]; then
  CLEAN_ALL=true
fi

# 임시 파일 정리
if [ "$CLEAN_TEMP" = true ] || [ "$CLEAN_ALL" = true ]; then
  echo "🗑️  임시 파일 정리 중..."
  find tools/temp/ -type f -mtime +7 -delete 2>/dev/null
  echo "✅ 7일 이상 된 임시 파일 정리 완료"
fi

# 사용하지 않는 디버깅 도구 정리
if [ "$CLEAN_DEBUG" = true ] || [ "$CLEAN_ALL" = true ]; then
  echo "🔍 사용하지 않는 디버깅 도구 정리 중..."
  find tools/debug/ -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null
  echo "✅ 30일 이상 사용하지 않은 디버깅 도구 정리 완료"
fi

# 정리 결과 보고
echo ""
echo "📊 정리 결과:"
echo "  임시 파일: $(find tools/temp/ -type f | wc -l)개"
echo "  디버깅 도구: $(find tools/debug/ -type d | wc -l)개"
echo "  영구 테스트 도구: $(find tools/test/ -type d | wc -l)개"

echo "🎉 테스트 도구 정리 완료!"
