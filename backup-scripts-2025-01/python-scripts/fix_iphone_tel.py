#!/usr/bin/env python3
import re
import sys

def fix_phone_links(file_path):
    """아이폰에서 전화번호 클릭이 작동하도록 수정"""
    
    try:
        # 파일 읽기
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 백업 파일 생성
        backup_path = file_path + '.backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 백업 파일 생성: {backup_path}")
        
        # 수정 사항
        original_content = content
        
        # 1. 모든 전화번호 링크에서 onclick 이벤트 제거
        content = re.sub(r'onclick="handlePhoneClick\(event\)"', '', content)
        content = re.sub(r'onclick="handleFloatingButtonClick\(event\)"', '', content)
        content = re.sub(r'onclick="handleBookingClick\(event\)"', '', content)
        
        # 2. handlePhoneClick 함수를 완전히 비활성화
        content = re.sub(
            r'function handlePhoneClick\(event\)\s*{[^}]*}',
            '''function handlePhoneClick(event) {
            // DISABLED: 아이폰 전화 링크 수정을 위해 비활성화
            return true;
        }''',
            content,
            flags=re.MULTILINE | re.DOTALL
        )
        
        # 3. handleFloatingButtonClick 함수를 완전히 비활성화
        content = re.sub(
            r'function handleFloatingButtonClick\(event\)\s*{[^}]*}',
            '''function handleFloatingButtonClick(event) {
            // DISABLED: 아이폰 전화 링크 수정을 위해 비활성화
            return true;
        }''',
            content,
            flags=re.MULTILINE | re.DOTALL
        )
        
        # 4. handleBookingClick 함수 수정 - 모바일에서 전화 연결만
        content = re.sub(
            r'function handleBookingClick\(event\)\s*{[^}]*}',
            '''function handleBookingClick(event) {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                // 모바일에서는 바로 전화 연결
                event.preventDefault();
                window.location.href = 'tel:080-028-8888';
            } else {
                // 데스크톱에서는 예약 모달 표시
                event.preventDefault();
                showBookingModal();
            }
        }''',
            content,
            flags=re.MULTILINE | re.DOTALL
        )
        
        # 5. 추가 스크립트 삽입 - 페이지 로드 후 모든 onclick 제거
        cleanup_script = '''
<!-- 아이폰 전화 링크 수정 스크립트 -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 모든 전화 링크에서 onclick 이벤트 제거
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    telLinks.forEach(link => {
        // onclick 속성 제거
        link.removeAttribute('onclick');
        
        // 이벤트 리스너 제거를 위해 요소 복제 및 교체
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    console.log('✅ 아이폰 전화 링크 수정 완료 - ' + telLinks.length + '개 링크 처리');
});
</script>
</body>'''
        
        # </body> 태그 앞에 스크립트 삽입
        content = content.replace('</body>', cleanup_script)
        
        # 변경 사항이 있는지 확인
        if content != original_content:
            # 파일 저장
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 변경 사항 통계
            onclick_removed = original_content.count('onclick="handle') - content.count('onclick="handle')
            print(f"✅ 수정 완료!")
            print(f"📊 변경 사항:")
            print(f"   - onclick 이벤트 제거: {onclick_removed}개")
            print(f"   - 전화번호 링크 총 개수: {content.count('href=\"tel:080-028-8888\"')}개")
            
            # 남아있는 onclick 확인
            remaining_onclick = re.findall(r'onclick="handle[^"]*"', content)
            if remaining_onclick:
                print(f"⚠️  아직 남아있는 onclick: {len(remaining_onclick)}개")
                for onclick in remaining_onclick[:5]:  # 처음 5개만 표시
                    print(f"   - {onclick}")
            else:
                print("✅ 모든 onclick 이벤트가 제거되었습니다!")
                
        else:
            print("ℹ️  변경 사항이 없습니다.")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = "public/versions/funnel-2025-07-complete.html"
    fix_phone_links(file_path)
    
    print("\n📱 다음 단계:")
    print("1. Git 커밋 & 푸시")
    print("   git add .")
    print("   git commit -m 'fix: 아이폰 전화 링크 완전 수정'")
    print("   git push")
    print("\n2. Vercel 배포 확인")
    print("\n3. 아이폰 Safari 캐시 삭제")
    print("   설정 > Safari > 방문 기록 및 웹 사이트 데이터 지우기")
