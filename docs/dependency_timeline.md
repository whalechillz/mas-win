# Dependency Introduction Timeline (sharp, openai)

- openai first present: commit b9bb58d (2025-09-07 16:37:28 +0900) - fix: OpenAI 패키지 설치
- sharp first present: commit c3c2547 (2025-09-09 10:21:45 +0900) - Fix: JavaScript syntax error in generate-enhanced-content.js and update brand name to MASSGOO
- later change touching sharp: a4adf5b (2025-10-05 22:33:25 +0900) - Integrate TipTap editor

## Evidence

### package.json at b9bb58d (shows openai)


### package.json at c3c2547 (shows sharp + openai)


### package.json at a4adf5b (shows sharp + openai, later deps)


## Conclusion
- openai was added on 2025-09-07 (b9bb58d).
- sharp was added on 2025-09-09 (c3c2547).
- Prior commits likely did not include these deps.
