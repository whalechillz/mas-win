import re
import datetime

# 백업 생성
backup_time = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
original_file = '/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html'
backup_file = f'/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html.backup-iphone-fix-{backup_time}'

# 파일 읽기
with open(original_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 백업 저장
with open(backup_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"백업 파일 생성: {backup_file}")

# 수정 전 onclick 이벤트 수 확인
onclick_count_before = content.count('onclick="handlePhoneClick(event)"')
floating_onclick_count_before = content.count('onclick="handleFloatingButtonClick(event)"')

print(f"\n수정 전:")
print(f"- handlePhoneClick 이벤트: {onclick_count_before}개")
print(f"- handleFloatingButtonClick 이벤트: {floating_onclick_count_before}개")

# 1. 모든 전화번호 링크에서 onclick 이벤트 제거
content = re.sub(r'<a([^>]*href="tel:080-028-8888"[^>]*)\s*onclick="handlePhoneClick\(event\)"([^>]*)>', 
                 r'<a\1\2>', content)
content = re.sub(r'<a([^>]*)\s*onclick="handlePhoneClick\(event\)"([^>]*href="tel:080-028-8888"[^>]*)>', 
                 r'<a\1\2>', content)

# 2. 플로팅 버튼 찾기 및 수정
# 패턴 1: 플로팅 버튼 전체 구조 찾기
floating_button_pattern = r'<!-- 플로팅 버튼 -->\s*<a href="tel:080-028-8888" class="floating-button" onclick="handleFloatingButtonClick\(event\)">(.*?)</a>'
if re.search(floating_button_pattern, content, re.DOTALL):
    content = re.sub(floating_button_pattern, 
                     r'<!-- 플로팅 버튼 -->\n    <a href="tel:080-028-8888" class="floating-button">\1</a>', 
                     content, flags=re.DOTALL)
    print("\n플로팅 버튼 수정 완료 (패턴 1)")

# 패턴 2: div로 된 플로팅 버튼
floating_button_pattern2 = r'<div class="floating-button" onclick="handleFloatingButtonClick\(event\)">(.*?)</div>(\s*</body>)'
if re.search(floating_button_pattern2, content, re.DOTALL):
    replacement = r'<a href="tel:080-028-8888" class="floating-button">\1</a>\2'
    content = re.sub(floating_button_pattern2, replacement, content, flags=re.DOTALL)
    print("\n플로팅 버튼 수정 완료 (패턴 2 - div to a)")

# 3. 모든 onclick 속성 제거 (전화번호 관련)
content = content.replace(' onclick="handlePhoneClick(event)"', '')
content = content.replace(' onclick="handleFloatingButtonClick(event)"', '')

# 4. CSS 확인 및 수정
# a.floating-button 스타일이 없으면 추가
if 'a.floating-button' not in content and '.floating-button {' in content:
    # .floating-button 스타일 찾기
    floating_style_start = content.find('.floating-button {')
    if floating_style_start != -1:
        # 스타일 시작 부분에 a 태그 스타일 추가
        insert_position = floating_style_start
        additional_style = '''/* 아이폰 전화번호 클릭 수정 */
        a.floating-button {
            display: flex;
            text-decoration: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: default;
        }
        
        '''
        content = content[:insert_position] + additional_style + content[insert_position:]
        print("\nCSS 스타일 추가 완료")

# 5. 수정 후 확인
onclick_count_after = content.count('onclick="handlePhoneClick(event)"')
floating_onclick_count_after = content.count('onclick="handleFloatingButtonClick(event)"')

print(f"\n수정 후:")
print(f"- handlePhoneClick 이벤트: {onclick_count_after}개")
print(f"- handleFloatingButtonClick 이벤트: {floating_onclick_count_after}개")

# 전화번호 링크 수 확인
tel_links = re.findall(r'<a[^>]*href="tel:080-028-8888"[^>]*>', content)
print(f"\n전화번호 링크 총 개수: {len(tel_links)}개")

# 파일 저장
with open(original_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n수정 완료!")
print(f"원본 파일: {original_file}")
print(f"백업 파일: {backup_file}")

# 샘플 출력
print("\n수정된 플로팅 버튼 샘플:")
floating_sample = re.search(r'<!-- 플로팅 버튼 -->.*?</a>', content, re.DOTALL)
if floating_sample:
    print(floating_sample.group(0)[:200] + "...")
