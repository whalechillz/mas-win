from PIL import Image, ImageEnhance, ImageFilter
import os

def enhance_background_image():
    """배경 이미지를 고해상도로 향상시키는 함수"""
    
    # 입력 및 출력 경로
    input_path = 'public/campaigns/2025-09-add/background3.png'
    output_path = 'public/campaigns/2025-09-add/background3-enhanced.png'
    
    try:
        # 원본 이미지 로드
        print("원본 이미지 로딩 중...")
        original = Image.open(input_path)
        
        print(f"원본 해상도: {original.size}")
        print(f"원본 모드: {original.mode}")
        
        # 이미지 향상
        print("이미지 향상 중...")
        
        # 1. 해상도 2배 증가 (5760x3240 → 11520x6480)
        enhanced = original.resize((11520, 6480), Image.Resampling.LANCZOS)
        
        # 2. 선명도 향상
        enhanced = enhanced.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        
        # 3. 대비 향상
        contrast_enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = contrast_enhancer.enhance(1.2)
        
        # 4. 밝기 조정
        brightness_enhancer = ImageEnhance.Brightness(enhanced)
        enhanced = brightness_enhancer.enhance(1.05)
        
        # 5. 채도 향상
        color_enhancer = ImageEnhance.Color(enhanced)
        enhanced = color_enhancer.enhance(1.1)
        
        print(f"향상된 해상도: {enhanced.size}")
        
        # 고품질로 저장
        enhanced.save(output_path, 'PNG', optimize=True, quality=95)
        
        print(f"✅ 고해상도 이미지 저장 완료: {output_path}")
        
        # 파일 크기 확인
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        enhanced_size = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"원본 크기: {original_size:.1f} MB")
        print(f"향상된 크기: {enhanced_size:.1f} MB")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

if __name__ == "__main__":
    print("🚀 배경 이미지 고해상도 향상 시작...")
    success = enhance_background_image()
    
    if success:
        print("🎉 모든 작업이 완료되었습니다!")
    else:
        print("💥 작업 중 오류가 발생했습니다.")
