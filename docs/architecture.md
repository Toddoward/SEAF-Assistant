# 구조 — 메시지·저장소·흐름

사용자용 설명은 [README.md](../README.md). 여기는 구현자용.

## 메시지 타입 (`chrome.runtime`)

| 타입 | 방향 | 동작 |
|---|---|---|
| `GET_LOBBY_LINK` | content → bg | `postId`로 게시글 fetch → `steam://` 직접 매칭, 없으면 본문의 스팀 프로필로 `fetchSteamLobby` |
| `GET_LOBBY_LINK_FROM_PROFILE` | content → bg | 저장된 `steamUrl`로 `fetchSteamLobby` (자동완성용) |
| `SETTINGS_UPDATED` | settings → bg | `setupAlarm` 재실행 |
| `SEAF_NEW_POST` | bg → 모든 디시 탭 | 토스트 표시. `toastDuration`은 초 → ms 변환 |

## storage — `chrome.storage.local`의 `seaf_settings` 단일 객체

- popup: `steamUrl`, `category`, `difficulty`, `subTag`, `customTitle`, `customContent`
- settings: `isDetectionActive`(기본 true), `pollingInterval`(1–30초, 기본 5), `toastDuration`(3–30초, 기본 6)
- `popup.js` 한 파일이 popup·settings 두 페이지를 담당. DOM 요소 존재 여부로 구분
- settings는 변경 즉시 저장 + `SETTINGS_UPDATED`. 저장 버튼 없음
- popup 복원 순서: 카테고리 active → 난이도 그룹 + `renderDifficulty` → `renderSubTags` → **마지막에 저장된 `customTitle`로 덮어쓰기**

## 감지 흐름 (`background.js`)

1. `setupAlarm`: `SEAF_DETECTION` 알람, 주기 `max(0.1분, pollingInterval/60)`
2. `performDetection`: 감지 꺼짐 또는 디시 탭 없음 → 스킵
3. `MANGHO_LIST_URL` fetch → 행 파싱 → 공지·뉴스 제외
4. `lastSeenPostId`가 null이면 최신 id로 초기화 후 종료
5. 더 큰 id를 오래된 순으로 `processNewPost` → 로비 링크 있으면 `SEAF_NEW_POST`
6. `lastSeenPostId` 갱신 (메모리 변수 — service worker 종료 시 리셋)

로비 추출: `<div class="profile_in_game_joingame">…<a href="steam://joinlobby/…">`

## content.js

| 페이지 | 동작 |
|---|---|
| 목록·조회 | `enhanceListPage` + MutationObserver → 망호 행에 `a.seaf-fast-join-btn` |
| 조회 | `convertLobbyLinks` → 본문 `steam://` 문자열 버튼화 |
| 글쓰기·수정(헬다갤) | 1초 `setInterval`로 `injectWriteAssistant` → `.note-break` 앞에 자동완성 버튼 |

`handleAutoFill`: 말머리 클릭 → 제목 입력 → `.note-editable`에 로비 블록 + `customContent` + 버전 푸터

## 태그 (`tags.js`)

카테고리 5종(`TERMINID`, `AUTOMATON`, `ILLUMINATE`, `ANYWHERE`, `CREDIT_RUN`), 난이도 1–10.
제목 형식: `{emoji} {subTag 또는 카테고리명} {N단} 망호`. 태그 변경 시 제목 전체 덮어쓰기.
제목 필터링(`keywords`)은 미구현 — 로비 링크가 있으면 무조건 알림.

## 함정 — 건드리면 깨지는 것

- `background.js`에서 `SEAF_TAGS` 사용 금지 — service worker에 `tags.js`가 로드되지 않아 `not defined`
- 에디터(note/summernote) 안에는 `styles.css`가 안 먹는다 — 인라인 스타일만
- `convertLobbyLinks`의 `innerHTML` 정규식 replace는 href 속성 안 URL까지 삼킨다 — 텍스트 노드만 순회해야 한다(TreeWalker)
- `lastSeenPostId`는 메모리 변수 — service worker가 죽으면 리셋되고, 다음 폴링이 초기화 경로를 타서 알림을 한 번 건너뛴다
- 디시 탭 0개면 폴링 자체를 스킵 — 알림을 놓치는 게 아니라 **기준선이 과거에 멈춘다** (SEAF-4)
- popup 복원의 마지막 `customTitle` 덮어쓰기를 지우면 자동생성 제목이 사용자 입력을 덮는다
