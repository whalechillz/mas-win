# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "마쓰구골프" [level=1] [ref=e6]
      - heading "관리자 로그인" [level=2] [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: 아이디 또는 전화번호
          - textbox "아이디 또는 전화번호" [ref=e12]:
            - /placeholder: 아이디 또는 전화번호를 입력하세요
        - generic [ref=e13]:
          - generic [ref=e14]: 비밀번호
          - generic [ref=e15]:
            - textbox "비밀번호" [ref=e16]:
              - /placeholder: 비밀번호를 입력하세요
            - button [ref=e17] [cursor=pointer]:
              - img [ref=e18]
      - button "로그인" [ref=e22] [cursor=pointer]
  - alert [ref=e23]: 관리자 로그인 - 마쓰구골프
```