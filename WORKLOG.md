# WORKLOG

최신이 맨 위. 세션 끝에 한 항목 추가하고 커밋한다.

## 2026-09-27 — 하네스 구성 + 디시 이모지 규칙 확인

- `AGENTS.md`, `CLAUDE.md`, `docs/`(platform·architecture·decisions), `specs/backlog.md`, `WORKLOG.md` 신설
- 출처: 이전 세션 요약 + llm-wiki `projects/seaf-assistant/index.md`(2026-09-25 소스 직독판). 커밋·푸시되면 리포가 정본, wiki 노트는 요약으로 줄인다
- 로컬 `main`이 origin보다 1커밋 뒤(`39188d1` README 수정)
- 디시 이모지 필터 규칙 확인(2026-09-03 업데이트, `txtcon.js` 코드포인트 범위) → [docs/dcinside-platform.md](docs/dcinside-platform.md)
- `tags.js` 현재 이모지 🐜 🤖 🦑 🗺️ 💎 — 전부 허용 범위 안
- 작업 트리에 사용자 미커밋 변경 있음: `background.js`·`content.js` 디버그 로그, 자동완성 블록 `<p>` + 스타일 없는 `<a>` 방식, `tags.js` 이모지 교체, `styles.css`
- 막힘: SEAF-1 본문 규칙 확정은 **사용자의 테스트 글 저장**이 필요
- 다음: SEAF-1 테스트 결과 → docs 갱신 → 방향 승인 후 구현
