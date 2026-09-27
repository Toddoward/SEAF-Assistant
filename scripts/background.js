/**
 * Project SEAF - Background Service Worker
 * 실시간 망호 게시글 감지
 */

const MANGHO_LIST_URL = "https://gall.dcinside.com/mgallery/board/lists/?id=helldiversseries&sort_type=N&search_head=60";

let lastSeenPostId = null;

/**
 * chrome.alarms 설정
 */
async function setupAlarm() {
  const { seaf_settings } = await chrome.storage.local.get(['seaf_settings']);
  
  await chrome.alarms.clear("SEAF_DETECTION");
  
  if (seaf_settings?.isDetectionActive) {
    const intervalInMinutes = Math.max(0.1, (seaf_settings.pollingInterval || 5) / 60);
    chrome.alarms.create("SEAF_DETECTION", { periodInMinutes: intervalInMinutes });
    console.log(`[SEAF] 감지 시작: ${seaf_settings.pollingInterval}초 간격`);
  } else {
    console.log('[SEAF] 감지 중지');
  }
}

/**
 * 게시글 상세 페이지에서 Steam 로비 링크 추출
 */
async function extractLobbyLink(postId) {
  try {
    const viewUrl = `https://gall.dcinside.com/mgallery/board/view/?id=helldiversseries&no=${postId}`;
    const response = await fetch(viewUrl);
    const html = await response.text();
    
    // steam://joinlobby 직접 링크 찾기
    const lobbyMatch = html.match(/steam:\/\/joinlobby\/\d+\/\d+\/\d+/);
    if (lobbyMatch) {
      return lobbyMatch[0];
    }
    
    // Steam 프로필 URL에서 로비 링크 추출
    const profileMatch = html.match(/https?:\/\/steamcommunity\.com\/(id|profiles)\/[^\s"<>]+/);
    if (profileMatch) {
      const profileUrl = profileMatch[0];
      const lobbyLink = await fetchSteamLobby(profileUrl);
      if (lobbyLink) return lobbyLink;
    }
    
    return null;
  } catch (error) {
    console.error(`[SEAF] 로비 링크 추출 실패 (${postId}):`, error);
    return null;
  }
}

/**
 * Steam 프로필에서 로비 링크 가져오기
 */
async function fetchSteamLobby(profileUrl) {
  try {
    const response = await fetch(profileUrl);
    const html = await response.text();
    
    const lobbyRegex = /<div class="profile_in_game_joingame">[\s\S]*?<a href="(steam:\/\/joinlobby\/\d+\/\d+\/\d+)"/;
    const match = html.match(lobbyRegex);
    
    return match ? match[1] : null;
  } catch (error) {
    console.error('[SEAF] Steam 프로필 접근 실패:', error);
    return null;
  }
}

/**
 * 실시간 감지 루프
 */
async function performDetection() {
  try {
    const { seaf_settings } = await chrome.storage.local.get(['seaf_settings']);
    
    if (!seaf_settings?.isDetectionActive) {
      return;
    }

    // 디시인사이드 탭이 열려있는지 확인
    const tabs = await chrome.tabs.query({ 
      url: "https://*.dcinside.com/*" 
    });
    
    if (tabs.length === 0) {
      return; // 디시 탭 없으면 스킵
    }

    // 망호 목록 크롤링
    const response = await fetch(MANGHO_LIST_URL);
    const html = await response.text();
    
    // 게시글 파싱 (공지 제외)
    const postRegex = /<tr[^>]*data-no="(\d+)"[^>]*>[\s\S]*?<td class="gall_tit[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g;
    const matches = [...html.matchAll(postRegex)];
    
    const posts = matches
      .filter(m => !m[0].includes('icon_notice') && !m[0].includes('icon_fnews'))
      .map(m => ({
        id: parseInt(m[1]),
        title: m[2].replace(/<[^>]*>?/gm, '').trim()
      }));

    if (posts.length === 0) {
      return;
    }

    // 첫 실행 시 초기화만 하고 종료
    if (lastSeenPostId === null) {
      lastSeenPostId = posts[0].id;
      console.log(`[SEAF] 초기화 완료. 마지막 게시글 ID: ${lastSeenPostId}`);
      return;
    }

    // 신규 게시글 필터링 (ID가 더 큰 것만)
    const newPosts = posts.filter(p => p.id > lastSeenPostId);
    
    if (newPosts.length > 0) {
      console.log(`[SEAF] 신규 게시글 ${newPosts.length}개 발견`);
      
      // 오래된 것부터 처리
      for (const post of newPosts.reverse()) {
        await processNewPost(post, seaf_settings);
      }
      
      // 가장 최신 게시글 ID로 업데이트
      lastSeenPostId = posts[0].id;
      console.log(`[SEAF] lastSeenPostId 업데이트: ${lastSeenPostId}`);
    }

  } catch (error) {
    console.error('[SEAF] 감지 엔진 오류:', error);
  }
}

/**
 * 신규 게시글 처리
 */
async function processNewPost(post, settings) {
  const { id, title } = post;
  
  console.log(`[SEAF] 게시글 처리 시작: [${id}] ${title}`);
  
  // 로비 링크 추출
  const lobbyLink = await extractLobbyLink(id);
  
  // 로비 링크가 없으면 알림 안 보냄
  if (!lobbyLink) {
    console.log(`[SEAF] 로비 링크 없음, 알림 스킵: [${id}] ${title}`);
    return;
  }
  
  console.log(`[SEAF] 로비 링크 발견: ${lobbyLink}`);
  
  // 모든 디시 탭에 알림 전송
  const tabs = await chrome.tabs.query({ 
    url: "https://*.dcinside.com/*" 
  });
  
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, {
      type: "SEAF_NEW_POST",
      postId: id,
      title: title,
      lobbyLink: lobbyLink,
      toastDuration: (settings.toastDuration || 6) * 1000 // 초 → 밀리초 변환
    }).catch(() => {
      // content script 로드 안 된 탭 무시
    });
  }
  
  console.log(`[SEAF] 알림 전송 완료: [${id}] ${title}`);
}

/**
 * 이벤트 리스너
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "SEAF_DETECTION") {
    performDetection();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SETTINGS_UPDATED") {
    setupAlarm();
  }
  
  if (request.type === "GET_LOBBY_LINK") {
    extractLobbyLink(request.postId).then(link => {
      sendResponse({ link });
    });
    return true; // 비동기 응답
  }
  
  if (request.type === "GET_LOBBY_LINK_FROM_PROFILE") {
    console.log('[SEAF] 프로필 링크 요청 받음:', request.url);
    fetchSteamLobby(request.url).then(link => {
      console.log('[SEAF] 추출된 링크:', link);
      sendResponse({ link });
    });
    return true; // 비동기 응답
  }
});

// 확장 프로그램 시작 시 알람 설정
setupAlarm();