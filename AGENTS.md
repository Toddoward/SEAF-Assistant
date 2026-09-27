# SEAF Assistant — 에이전트 진입점

디시 헬다이버즈 시리즈 갤러리(`id=helldiversseries`)의 망호(멀티 모집글)를 실시간 감지하고
Steam 로비(`steam://joinlobby/553850/…`)에 원클릭 참여시키는 Chrome MV3 확장.
사용자 맥락·설계 철학은 llm-wiki `projects/seaf-assistant/index.md`에 있다. 여기는 이 리포에서만 참인 것.

## 콜드스타트

1. [WORKLOG.md](WORKLOG.md) 상위 항목 — 직전 세션이 어디까지 했나
2. [specs/backlog.md](specs/backlog.md) — 열린 이슈와 우선순위
3. [docs/decisions.md](docs/decisions.md) — 기각된 대안·반박당한 진단. 제안 전에 반드시
4. 작업 대상에 따라:
   - 디시 페이지 구조·저장 필터·이모지 → [docs/dcinside-platform.md](docs/dcinside-platform.md)
   - 메시지 타입·storage 키·흐름·함정 → [docs/architecture.md](docs/architecture.md)

## 하드 룰

- **문제 정의 → 방향 확인 → 구현.** 한 단계씩. 수정한 파일만 개별 제시
- **사용자가 직접 고친 코드가 최우선.** 덮어쓰기 전에 `git diff`로 사용자 변경을 확인한다
- 원인을 추측으로 나열하지 않는다. 확인 가능한 근거가 없으면 확인 방법을 제시한다
- 경고창·강제 제한·다단계 인터랙션으로 문제를 사용자에게 떠넘기지 않는다
- CSS 클래스는 전부 `seaf-` 접두사. 디시 스타일 오버라이드는 `!important`
- `background.js`에서 `SEAF_TAGS` 참조 금지 (service worker에 `tags.js`가 로드되지 않음)
- 디시 글쓰기 에디터에 넣는 HTML은 인라인 스타일만 (확장 CSS 미적용). 저장 시 새니타이즈됨 → [docs/dcinside-platform.md](docs/dcinside-platform.md)
- 파일 이름·경로 변경 금지 (`tags.js`는 루트, `config.js` 이름 금지, `styles.css` 단일 파일)

## 검증

빌드·테스트 도구 없음. 변경 후:

1. `chrome://extensions` → 압축해제 로드한 SEAF Assistant **새로고침**
2. service worker 콘솔(`[SEAF]` 로그)과 디시 탭 콘솔 확인
3. 디시 저장 동작에 의존하는 변경은 **실제 글 저장 후 저장된 HTML로 확인**한다. 에디터 화면은 근거가 아니다

## 디렉터리

| 경로 | 무엇 |
|---|---|
| `scripts/` | `background.js`(service worker), `content.js` |
| `popup/` | `popup.html`, `settings.html`, `popup.js` (`../tags.js`, `../styles.css` 참조) |
| `docs/` | 확정 사실. 현재 상태 |
| `specs/` | 앞으로 할 것의 계약. 백로그 ID `SEAF-*` |
| `builds/` | 릴리스 산출물. gitignore |
| `WORKLOG.md` | 세션 재개점. 최신이 맨 위 |

## 버전

SemVer. `0.9.x` 베타, `1.0.0` 웹스토어 정식. 버전 원천은 `manifest.json`.
