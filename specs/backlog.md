# 백로그

ID로 지칭한다. 완료는 체크리스트 실행 결과를 적어야 완료다.
**미승인** = 제안만 있고 사용자가 방향을 승인하지 않음. 코드 금지.
줄번호는 `39188d1` 기준 — 작업 트리 변경으로 밀릴 수 있다.

## SEAF-1 [최우선] 본문 로비 버튼 — 디시 새니타이즈 대응

- 결정: 에디터 버튼 방식 포기. 조회 페이지 `convertLobbyLinks`로 버튼 제공
- 목표: 확장 미사용자도 쓸 수 있는 형태 탐색 (디시가 보존하는 링크 형태, 이미지 링크 등)
- 알려진 버그: `convertLobbyLinks`(`content.js:116-125`)가 `innerHTML` replace로 `href` 속성 안 URL까지 치환 → 중첩·깨진 마크업
- `4dfc617`: 자동완성 블록이 `<p>` + 스타일 없는 `<a>` + 안내 문구로 바뀌어 있음
- 미승인안: `convertLobbyLinks`는 인라인 스타일 버튼 + 🌎
- 검증 체크리스트:
  - [ ] 수정 페이지에서 테스트 글 저장 (사용자 수행): 이모지 `☄️ 🤖 🦑 🪳 🗺️ ‼️ ⁉️ ♥️ 🖕🏿 🇰🇷 1️⃣` + 스타일 있는/없는 `<a href="steam://…">`
  - [ ] 저장된 HTML에서 href·이모지 보존 여부 기록 → [docs/dcinside-platform.md](../docs/dcinside-platform.md) 갱신

## SEAF-2 IP 밴 회피

- 발단: 다른 새로고침 도구와 1초 주기 병행 → 차단
- 사용자 거부: 최소 주기 강제, 경고 UI
- 요구: 다른 도구의 탐색 주기를 능동적으로 피하거나 그 주기엔 fetch 생략
- 미승인안: `safeFetch`(3초 캐시 + 0–2초 지터), 연속 실패 시 주기 2배 백오프(최대 30초), 전역 락
- **한계: 위 안은 다른 도구의 요청을 실제로 감지하지 못함 — 요구 미충족. 이 한계를 숨기고 제안하지 마라**

## SEAF-3 배포 방식 (CRX 차단)

- Chrome이 스토어 외부 CRX 설치를 차단
- 대안: 소스 zip + 압축해제 로드, 최종 웹스토어($5 1회)
- 미정: README가 아직 `.crx` 드래그앤드롭을 "방법 1(권장)"으로 안내 — 수정 여부
- `RELEASE.md`는 리포에 커밋된 적 없음 (GitHub release 본문에만 있거나 유실)

## SEAF-4 밀린 알림 폭주

- 원인: 디시 탭 없으면 스킵 → `lastSeenPostId`(`background.js:8`, 메모리)가 과거에 머묾 → 탭 열면 누적분 일괄 알림. service worker 종료 시 리셋
- 미승인안: `tabs.onActivated`/`onUpdated`(complete + helldiversseries) 시 목록 최신 id로 기준선 갱신, storage 영구 저장
- 주의: 제안 코드 정규식에 공지·뉴스 제외 누락 → 그대로 쓰면 공지 id가 기준선이 됨

## SEAF-5 `fast-join-btn` 세로 정렬

- 텍스트가 상단에 붙음. 전 속성 `!important` 적용안이 `styles.css:410-429`에 커밋됨 — 결과 미확인
- 대안(미적용): `<a>` 대신 `<span>`
- 반박당한 원인설: [docs/decisions.md](../docs/decisions.md)

## SEAF-6 결함 (방향 확인 후 수정)

- [ ] `createToast`가 제목을 `innerHTML`로 삽입 (`content.js:34-43`) — 게시글 제목은 외부 입력, XSS
- [ ] `handleAutoFill`의 `if (editor && seaf_settings?.steamUrl)`(`content.js:168`) — steamUrl이 비면 본문 블록 전체 스킵, 실패 문구도 안 뜸
- [ ] `chrome.tabs.query`가 `https://*.dcinside.com/*`(`background.js:88,163`) — content_scripts는 `*://`. http 탭 누락
- [ ] `popup.html:60`, `settings.html:52` 정적 텍스트 `v1.0.0` (런타임에 덮어써져 표시 문제는 없음)
- [ ] `.seaf-popup-body` `min-height` 600px/400px 중복 (`styles.css:26,34`), `settings.html:43` `margin:140px` 빈 `<p>` — 높이 롤백 잔재
- [ ] README: 구조 트리의 `icon64.png`(실제 없음), 버전 히스토리 연도 `2025-02-07` 오타

## SEAF-7 확인 필요

- [ ] `MANGHO_LIST_URL`(`background.js:6`): 현재 `search_head=60`. 사용자는 전체 목록(`?id=helldiversseries&`)으로 바꿨었음 — 의도 확인
- [ ] `isWritePage`의 `board/modify`: `4dfc617`에서 추가(디버깅 목적). 유지 여부 확인
- [ ] 패키지 설치 시 `chrome.alarms` 최소 주기 30초 클램프 여부. 코드 하한은 0.1분(6초) — "최소 6초" 문서화 전 실측
- [ ] `GET_LOBBY_LINK_FROM_PROFILE` 응답 — 저장 HTML에 링크 존재 → 추출 성공으로 보임. 디버그 로그 정리
