/**
 * Project SEAF - Content Script
 * 디시인사이드 페이지 DOM 조작 및 토스트 알림
 */

const SEAF_CONTENT = {
  /**
   * 페이지 타입 감지
   */
  isWritePage: () => window.location.href.includes('board/write'),
  isListPage: () => window.location.href.includes('board/lists'),
  isViewPage: () => window.location.href.includes('board/view'),
  isHelldiversseriesgallery: () => window.location.href.includes('id=helldiversseries'),

  /**
   * 토스트 알림 생성
   */
  createToast: function(postId, title, lobbyLink, duration) {
    // 컨테이너 확인 또는 생성
    let container = document.getElementById('seaf-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'seaf-toast-container';
      container.className = 'seaf-toast-container';
      document.body.appendChild(container);
    }

    // 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'seaf-toast-item';
    
    const postUrl = `https://gall.dcinside.com/mgallery/board/view/?id=helldiversseries&no=${postId}`;

    toast.innerHTML = `
      <div class="seaf-toast-header">☄️ 신규 망호 감지</div>
      <a href="${postUrl}" target="_blank" class="seaf-toast-body" title="${title}">
        ${title}
      </a>
      <div class="seaf-toast-actions">
        <a href="" class="seaf-toast-btn">⚡ 즉시 참가</a>
        <button class="seaf-toast-close-btn">닫기</button>
      </div>
    `;

    container.appendChild(toast);

    // 버튼 클릭 시 참가 로직
    toast.querySelector('.seaf-toast-btn').onclick = (e) => {
      e.preventDefault();
      const btn = e.target;
      btn.innerText = '...';
      btn.disabled = true;

      // 해당 게시글 id로 fetch
      chrome.runtime.sendMessage(
        { type: "GET_LOBBY_LINK", postId: postId },
        (response) => {
          if (response?.link) {
            window.location.href = response.link;
            btn.innerText = '성공🚀';
          } else {
            btn.innerText = '오류: 링크 없음';
          }
        }
      );
    };

    // 애니메이션 시작
    setTimeout(() => toast.classList.add('seaf-show'), 10);

    // 닫기 함수
    const close = () => {
      toast.classList.remove('seaf-show');
      setTimeout(() => toast.remove(), 400);
    };

    // 닫기 버튼 이벤트
    toast.querySelector('.seaf-toast-close-btn').onclick = close;

    // 자동 닫기
    setTimeout(close, duration);
  },

  /**
   * 목록 페이지 - 빠른 참여 버튼 주입
   */
  enhanceListPage: function() {
  const posts = document.querySelectorAll('.ub-content');
  
  posts.forEach(post => {
    if (post.hasAttribute('data-seaf-processed')) return;

    const subjectTd = post.querySelector('.gall_subject');
    const titleTd = post.querySelector('.gall_tit.ub-word');

    // 헬망호 게시글만 처리
    if (subjectTd && subjectTd.innerText.trim() === '헬망호' && titleTd) {
      const postLink = titleTd.querySelector('a')?.href;
      if (!postLink) return;

      post.setAttribute('data-seaf-processed', 'true');

      // 게시글 번호 추출
      const postIdMatch = postLink.match(/no=(\d+)/);
      if (!postIdMatch) return;
      const postId = postIdMatch[1];

      // 버튼 생성
      const btn = document.createElement('a');
      btn.href = "#"; // 
      btn.className = 'seaf-fast-join-btn';
      btn.innerText = '☄️ 참여';
      
      // 사용자가 클릭 시에만 동작
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const originalText = btn.innerText;
        btn.innerText = '...';
        btn.style.opacity = '0.5';

        // background.js에 로비 링크 요청
        chrome.runtime.sendMessage(
          { type: "GET_LOBBY_LINK", postId: postId },
          (response) => {
            if (response?.link) {
              window.location.href = response.link;
              btn.innerText = "성공🚀";
              setTimeout(() => {
                btn.innerText = originalText;
              }, 2000);
            } else {
              btn.innerText = '링크 없음';
            }
          }
        );
      };
      
      titleTd.querySelector('a').after(btn);
    }
  });
},

  /**
   * 조회 페이지 - steam:// 링크를 버튼으로 변환
   */
  convertLobbyLinks: function() {
    const contentView = document.querySelector('.writing_view_box');
    if (!contentView || contentView.hasAttribute('data-seaf-converted')) return;

    const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+\/\d+/g;
    
    if (lobbyRegex.test(contentView.innerHTML)) {
      contentView.innerHTML = contentView.innerHTML.replace(lobbyRegex, (match) => {
        return `
          <div class="seaf-lobby-btn-wrap">
            <a href="${match}" class="seaf-join-button">☄️ 즉시 참가하기 ☄️</a>
          </div>
        `;
      });
      contentView.setAttribute('data-seaf-converted', 'true');
    }
  },

  /**
   * 글쓰기 페이지 - 자동완성 버튼 주입
   */
  injectWriteAssistant: function() {
    const toolbar = document.querySelector('.note-toolbar');
    const breakPoint = document.querySelector('.note-btn-group.note-break');
    if (!toolbar || !breakPoint || document.getElementById('seaf-auto-btn')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'note-btn-group';
    wrapper.innerHTML = `
      <button type="button" id="seaf-auto-btn" class="note-btn" style="padding: 0 5px;">
        ☄️ 망호 자동 완성
      </button>
    `;
    
    toolbar.insertBefore(wrapper, breakPoint);
    document.getElementById('seaf-auto-btn').onclick = async () => await this.handleAutoFill();
  },

  /**
   * 자동완성 처리
   */
  handleAutoFill: async function() {
    const { seaf_settings } = await chrome.storage.local.get(['seaf_settings']);

    // 말머리 선택
    const manghoLi = document.querySelector('li[data-val="헬망호"]');
    if (manghoLi) manghoLi.click();

    // 제목 입력
    const titleInput = document.querySelector('input[name="subject"]');
    if (titleInput && seaf_settings?.customTitle) {
      titleInput.value = seaf_settings.customTitle;
    }

    // 본문 입력
    const editor = document.querySelector('.note-editable');
    if (editor && seaf_settings?.steamUrl) {
      // Steam 프로필에서 로비 링크 가져오기
      chrome.runtime.sendMessage(
        { type: "GET_LOBBY_LINK_FROM_PROFILE", url: seaf_settings.steamUrl },
        (response) => {
          const lobbyLink = response?.link;
          const lobbyHtml = lobbyLink
            ? `<div style="text-align:center; margin:20px 0;">
                 <a href="${lobbyLink}" style="display:inline-block; background-color:#41639C; color:#ffffff; padding:12px 30px; border-radius:5px; text-decoration:none; font-weight:bold; font-size:16px;">☄️ 즉시 참가하기 ☄️</a>
               </div>`
            : '<p style="text-align:center; color:#ff0000;">[로비 링크 추출 실패: 스팀 프로필이 비공개거나 게임 로비를 찾을 수 없습니다.]</p>';
          
          const contentHtml = seaf_settings.customContent
            ? `<p style="text-align:center;">${seaf_settings.customContent.replace(/\n/g, '<br>')}</p>`
            : '';

          const manifestData = chrome.runtime.getManifest();
          editor.innerHTML = `
            <div style="text-align:center;">
              ${lobbyHtml}
              <p><br></p>
              ${contentHtml}
              <p><br></p>
              <p style="font-size:11px; color:#888;">Generated by SEAF Assistant v${manifestData.version}</p>
            </div>
          `;
        }
      );
    }
  },

  /**
   * 초기화
   */
  init: function() {
    // // 주입 시 background.js의 lastSeenPostd를 초기화
    // if (this.isListPage()) {
    //   chrome.runtime.sendMessage({ type: "RESET_LAST_ID" });
    // }
    // 목록 페이지
    if (this.isListPage() || this.isViewPage()) {
      this.enhanceListPage();
      // NOTE: MutationObserver는 dcinside에서 작동하지 않을 것으로 보임. 호환성을 위해 삭제하지 않았음
      new MutationObserver(() => this.enhanceListPage())
        .observe(document.body, { childList: true, subtree: true });
    }

    // 조회 페이지
    if (this.isViewPage()) {
      this.convertLobbyLinks();
    }

    // 글쓰기 페이지
    if (this.isWritePage() && this.isHelldiversseriesgallery()) {
      setInterval(() => this.injectWriteAssistant(), 1000);
    }

    // background.js로부터 알림 수신
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "SEAF_NEW_POST") {
        this.createToast(
          message.postId,
          message.title,
          message.lobbyLink,
          message.toastDuration
        );
      }
    });
  }
};

// 실행
SEAF_CONTENT.init();