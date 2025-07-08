#!/usr/bin/env python3

import re

print("Q2 문제 수정 시작...")

# HTML 파일 읽기
html_path = "/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 백업 생성
import shutil
from datetime import datetime
backup_name = f"{html_path}.backup-q2-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
shutil.copy(html_path, backup_name)
print(f"백업 생성: {backup_name}")

# 1. selectAnswer 함수 호출 부분 수정 - 한글 텍스트 추가
replacements = [
    # Q1 스윙 스타일
    ('onclick="selectAnswer(1, \'stability\')"', 'onclick="selectAnswer(1, \'stability\', \'안정형\')"'),
    ('onclick="selectAnswer(1, \'power\')"', 'onclick="selectAnswer(1, \'power\', \'파워형\')"'),
    ('onclick="selectAnswer(1, \'hybrid\')"', 'onclick="selectAnswer(1, \'hybrid\', \'복합형\')"'),
    
    # Q2 중요 요소
    ('onclick="selectAnswer(2, \'distance\')"', 'onclick="selectAnswer(2, \'distance\', \'비거리\')"'),
    ('onclick="selectAnswer(2, \'direction\')"', 'onclick="selectAnswer(2, \'direction\', \'방향성\')"'),
    ('onclick="selectAnswer(2, \'comfort\')"', 'onclick="selectAnswer(2, \'comfort\', \'편안함\')"'),
]

for old, new in replacements:
    content = content.replace(old, new)

# 2. selectAnswer 함수 정의 수정
# 기존 함수를 찾아서 수정
old_function = """function selectAnswer(step, value) {
            // 이전 선택 제거
            document.querySelectorAll(`#step${step} .quiz-option`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 새 선택 추가
            const selectedOption = event.target.closest('.quiz-option');
            selectedOption.classList.add('selected');
            
            // 데이터 저장
            if (step === 1) {
                quizData.style = value;
                // 한글 텍스트 저장
                const styleTexts = {
                    'stability': '안정형',
                    'power': '파워형',
                    'hybrid': '복합형'
                };
                quizData.styleText = styleTexts[value];
            }
            if (step === 2) {
                quizData.priority = value;
                // 한글 텍스트 저장
                const priorityTexts = {
                    'distance': '비거리',
                    'direction': '방향성',
                    'comfort': '편안함'
                };
                quizData.priorityText = priorityTexts[value];
            }"""

new_function = """function selectAnswer(step, value, koreanText) {
            // 이전 선택 제거
            document.querySelectorAll(`#step${step} .quiz-option`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 새 선택 추가
            const selectedOption = event.target.closest('.quiz-option');
            selectedOption.classList.add('selected');
            
            // 데이터 저장
            if (step === 1) {
                quizData.style = value;
                quizData.styleText = koreanText || value;
            }
            if (step === 2) {
                quizData.priority = value;
                quizData.priorityText = koreanText || value;
            }"""

content = content.replace(old_function, new_function)

# 3. 폼 제출 시 한글 데이터도 전송하도록 수정
# bookingForm submit 부분 찾기
booking_submit_pattern = r'priority: quizData\.priority \|\| null,  // Q2 답변 저장'
booking_submit_replacement = '''priority: quizData.priorityText || quizData.priority || null,  // Q2 답변 저장 (한글)'''

content = re.sub(booking_submit_pattern, booking_submit_replacement, content)

# contactForm submit 부분도 수정
contact_submit_pattern = r'priority: quizData\.priority \|\| null,  // Q2 답변 저장'
contact_submit_replacement = '''priority: quizData.priorityText || quizData.priority || null,  // Q2 답변 저장 (한글)'''

content = re.sub(contact_submit_pattern, contact_submit_replacement, content)

# 슬랙 알림 데이터 부분도 수정
slack_pattern = r"swing_style: quizData\.styleText \|\| null,\s*priority: quizData\.priorityText \|\| null,"
slack_replacement = """swing_style: quizData.styleText || null,
                                    priority: quizData.priorityText || null,"""

content = re.sub(slack_pattern, slack_replacement, content, flags=re.MULTILINE)

# 파일 저장
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML 파일 수정 완료!")

# DB 업데이트 SQL 생성
sql_content = """-- 기존 영어 데이터를 한글로 변환하는 SQL
-- bookings 테이블
UPDATE bookings
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

UPDATE bookings
SET swing_style = CASE
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- contacts 테이블
UPDATE contacts
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

UPDATE contacts
SET swing_style = CASE
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- 변경된 데이터 확인
SELECT name, phone, swing_style, priority, current_distance
FROM bookings
ORDER BY created_at DESC
LIMIT 10;
"""

sql_path = "/Users/m2/MASLABS/win.masgolf.co.kr/update-korean-data.sql"
with open(sql_path, 'w', encoding='utf-8') as f:
    f.write(sql_content)

print(f"SQL 파일 생성: {sql_path}")
print("\n완료! 다음 단계:")
print("1. Vercel 재배포: vercel --prod")
print("2. Supabase SQL Editor에서 update-korean-data.sql 실행")
print("3. 브라우저 캐시 삭제 후 테스트")
