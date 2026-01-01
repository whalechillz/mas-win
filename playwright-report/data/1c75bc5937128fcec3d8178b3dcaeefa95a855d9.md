# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "마쓰구골프" [level=1] [ref=e6]
      - heading "관리자 로그인" [level=2] [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e10]:
        - img [ref=e11]
        - generic [ref=e13]: 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: 아이디 또는 전화번호
          - textbox "아이디 또는 전화번호" [ref=e17]:
            - /placeholder: 아이디 또는 전화번호를 입력하세요
            - text: admin
        - generic [ref=e18]:
          - generic [ref=e19]: 비밀번호
          - generic [ref=e20]:
            - textbox "비밀번호" [ref=e21]:
              - /placeholder: 비밀번호를 입력하세요
              - text: password
            - button [ref=e22] [cursor=pointer]:
              - img [ref=e23]
      - button "로그인" [ref=e27] [cursor=pointer]
  - alert [ref=e28]
```