#!/bin/bash

# 동영상 캡처 스크립트
# 사용법: ./video-capture.sh <video-file> <time> <output-name>

VIDEO=$1
TIME=$2
OUTPUT=$3

if [ -z "$VIDEO" ] || [ -z "$TIME" ] || [ -z "$OUTPUT" ]; then
    echo "사용법: ./video-capture.sh <video-file> <time> <output-name>"
    echo "예시: ./video-capture.sh video.mp4 00:01:23 product-shot.jpg"
    exit 1
fi

# 캡처 실행
ffmpeg -i "$VIDEO" -ss "$TIME" -frames:v 1 -q:v 2 "$OUTPUT"

echo "캡처 완료: $OUTPUT"
