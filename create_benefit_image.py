#!/usr/bin/env python3
"""
benefit-1-new2.png에 텍스트를 추가하는 스크립트
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_benefit_image():
    # 이미지 파일 경로
    input_path = "public/campaigns/2025-09-add/benefit-1-new.png"
    output_path = "public/campaigns/2025-09-add/benefit-1-new2.png"
    
    # 이미지 열기
    try:
        img = Image.open(input_path)
        print(f"이미지 로드 성공: {img.size}")
    except Exception as e:
        print(f"이미지 로드 실패: {e}")
        return
    
    # 이미지를 RGBA 모드로 변환 (투명도 지원)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 텍스트를 위한 새로운 레이어 생성
    text_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_layer)
    
    # 폰트 설정 (시스템 폰트 사용)
    try:
        # macOS에서 사용 가능한 한글 폰트
        font_large = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 24)
        font_small = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 20)
    except:
        try:
            # 대체 폰트
            font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        except:
            # 기본 폰트
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
    
    # 텍스트 내용
    text1 = "골프 클럽 점검"
    text2 = "서비스 제공"
    
    # 이미지 크기
    width, height = img.size
    
    # 텍스트 위치 계산 (하단 중앙)
    text1_bbox = draw.textbbox((0, 0), text1, font=font_large)
    text2_bbox = draw.textbbox((0, 0), text2, font=font_small)
    
    text1_width = text1_bbox[2] - text1_bbox[0]
    text2_width = text2_bbox[2] - text2_bbox[0]
    
    # 텍스트 위치
    x1 = (width - text1_width) // 2
    x2 = (width - text2_width) // 2
    y1 = height - 60  # 첫 번째 텍스트
    y2 = height - 30  # 두 번째 텍스트
    
    # 반원 배경 그리기
    bg_color = (139, 69, 19, 230)  # 갈색 반투명
    bg_width = max(text1_width, text2_width) + 40
    bg_height = 50
    bg_x = (width - bg_width) // 2
    bg_y = height - 55
    
    # 반원 모양의 배경 (상단만 둥글게)
    draw.rounded_rectangle(
        [bg_x, bg_y, bg_x + bg_width, bg_y + bg_height],
        radius=25,
        fill=bg_color
    )
    
    # 텍스트 그리기 (흰색)
    text_color = (255, 255, 255, 255)
    draw.text((x1, y1), text1, font=font_large, fill=text_color)
    draw.text((x2, y2), text2, font=font_small, fill=text_color)
    
    # 원본 이미지와 텍스트 레이어 합성
    result = Image.alpha_composite(img, text_layer)
    
    # 결과 저장
    result.save(output_path, 'PNG')
    print(f"이미지 저장 완료: {output_path}")

if __name__ == "__main__":
    create_benefit_image()
