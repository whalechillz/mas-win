# Git Commit Scripts 사용법

두 가지 Git 커밋 스크립트를 제공합니다:

## 1. git-commit.sh (상세 모드)
이모지와 커밋 타입을 선택할 수 있는 대화형 스크립트

## 2. quick-commit.sh (빠른 모드) 
간단하게 커밋 메시지만 입력하는 스크립트

---

## 🚀 초기 설정

### 1. 실행 권한 부여
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr/scripts
chmod +x git-commit.sh
chmod +x quick-commit.sh
```

### 2. 별칭(Alias) 설정 (선택사항)
터미널 설정 파일에 추가 (~/.zshrc 또는 ~/.bashrc):

```bash
# Git 커밋 단축 명령어
alias gc='/Users/m2/MASLABS/win.masgolf.co.kr/scripts/git-commit.sh'
alias qc='/Users/m2/MASLABS/win.masgolf.co.kr/scripts/quick-commit.sh'
```

설정 후 터미널 재시작 또는:
```bash
source ~/.zshrc  # 또는 source ~/.bashrc
```

---

## 📝 사용 방법

### git-commit.sh (상세 모드)
```bash
# 프로젝트 폴더에서
../scripts/git-commit.sh

# 또는 alias 설정했다면
gc
```

특징:
- 커밋 타입 선택 (feat, fix, docs 등)
- 이모지 자동 추가
- 파일 추가 선택
- Push 옵션

### quick-commit.sh (빠른 모드)
```bash
# 방법 1: 대화형
../scripts/quick-commit.sh

# 방법 2: 한 줄로
../scripts/quick-commit.sh 비디오 플레이어 추가

# alias 설정했다면
qc 비디오 플레이어 추가
```

특징:
- 모든 파일 자동 추가 (git add .)
- 간단한 커밋 메시지
- 빠른 Push 옵션

---

## 🎯 추천 사용 시나리오

### 큰 기능 추가/버그 수정
→ `git-commit.sh` 사용 (타입과 이모지 선택)

### 작은 수정/빠른 커밋
→ `quick-commit.sh` 사용

---

## ⚡️ Pro Tip

프로젝트 루트에 심볼릭 링크 생성:
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr/mas-win
ln -s ../scripts/git-commit.sh gc.sh
ln -s ../scripts/quick-commit.sh qc.sh
```

그러면 프로젝트 폴더에서 바로 사용 가능:
```bash
./gc.sh
./qc.sh "커밋 메시지"
```
