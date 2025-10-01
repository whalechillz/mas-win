#!/bin/bash

# Claude Desktop MCP 서버 설정 스크립트

echo "🔧 Claude Desktop MCP 서버 설정 시작..."
echo ""

# 설정 파일 경로
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# 디렉토리 생성 (없는 경우)
if [ ! -d "$CONFIG_DIR" ]; then
    echo "📁 설정 디렉토리 생성 중..."
    mkdir -p "$CONFIG_DIR"
fi

# 백업 파일 생성 (기존 파일이 있는 경우)
if [ -f "$CONFIG_FILE" ]; then
    echo "💾 기존 설정 파일 백업 중..."
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 새 설정 파일 생성
echo "📝 새 설정 파일 작성 중..."
cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@smithery/mcp-server-filesystem", "/Users/m2/MASLABS/win.masgolf.co.kr"]
    },
    "mcp-playwright": {
      "command": "npx",
      "args": ["-y", "@smithery/mcp-server-playwright"]
    }
  }
}
EOF

echo "✅ 설정 파일이 생성되었습니다: $CONFIG_FILE"
echo ""
echo "📌 다음 단계:"
echo "1. Claude Desktop 앱을 완전히 종료하세요 (Cmd+Q)"
echo "2. Claude Desktop 앱을 다시 실행하세요"
echo "3. 설정 메뉴에서 MCP 서버 상태를 확인하세요"
echo ""
echo "⚠️  context7-mcp는 제거되었습니다 (연결 오류 해결)"