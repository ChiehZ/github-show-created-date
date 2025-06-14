const browserAPI = typeof chrome !== "undefined" ? chrome : browser;

// 選擇器常數
const SELECTORS = {
  FORKS_LINK: 'div.mt-2 a[href$="/forks"]',
  PUBLIC_REPO_CONTAINER: '.mb-2.d-flex.color-fg-muted',
  CREATED_TIME: '#repo-created-time',
  CREATED_TIME_SECOND: '#repo-created-time-second'
};

// DOM 元素模板
const TEMPLATES = {
  createdTime: (date) => `
    <h3 class="sr-only">Repository created on ${date}</h3>
    <span class="d-inline-block">
      <svg class="octicon octicon-calendar mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2A2.75 2.75 0 0 1 15 4.75v8.5A2.75 2.75 0 0 1 12.25 16H3.75A2.75 2.75 0 0 1 1 13.25v-8.5A2.75 2.75 0 0 1 3.75 2V.75A.75.75 0 0 1 4.75 0ZM2.5 6v7.25c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V6Zm1.25-3.5c-.69 0-1.25.56-1.25 1.25V4.5h11V3.75c0-.69-.56-1.25-1.25-1.25Z"/>
      </svg>
      <span>Created: <strong>${date}</strong></span>
    </span>
  `,
  createdTimeSecond: (date) => `
    <div class="d-flex flex-items-center" style="height: 21px">
      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-calendar flex-shrink-0 mr-2">
        <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2A2.75 2.75 0 0 1 15 4.75v8.5A2.75 2.75 0 0 1 12.25 16H3.75A2.75 2.75 0 0 1 1 13.25v-8.5A2.75 2.75 0 0 1 3.75 2V.75A.75.75 0 0 1 4.75 0ZM2.5 6v7.25c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V6Zm1.25-3.5c-.69 0-1.25.56-1.25 1.25V4.5h11V3.75c0-.69-.56-1.25-1.25-1.25Z"/>
      </svg>
      <span class="flex-auto min-width-0 width-fit">
        Created: <span class="text-bold color-fg-default">${date}</span>
      </span>
    </div>
  `
};

// 從 URL 提取倉庫信息
function getRepoInfo() {
  const [_, owner, repo] = location.pathname.split('/');
  return { owner, repo };
}

// 格式化日期
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 檢查是否在倉庫主頁面
function isRepoHomePage() {
  const { owner, repo } = getRepoInfo();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  return owner && repo && pathSegments.length === 2;
}

// 創建 DOM 元素
function createElement({ id, className, html }) {
  const element = document.createElement('div');
  if (id) element.id = id;
  if (className) element.className = className;
  if (html) element.innerHTML = html;
  return element;
}

// 在 Forks 和 Report repository 之間插入創建時間
function insertCreatedTime(createdDate) {
  if (document.querySelector(SELECTORS.CREATED_TIME)) return;

  const forksContainer = document.querySelector(SELECTORS.FORKS_LINK)?.closest('div.mt-2');
  if (!forksContainer) return;

  const createdTimeDiv = createElement({
    id: 'repo-created-time',
    className: 'mt-2',
    html: TEMPLATES.createdTime(createdDate)
  });

  forksContainer.after(createdTimeDiv);
}

// 在 Public repository 前插入創建時間
function insertCreatedTimeSecond(createdDate) {
  if (document.querySelector(SELECTORS.CREATED_TIME_SECOND)) return;

  const publicRepoContainer = document.querySelector(SELECTORS.PUBLIC_REPO_CONTAINER);
  if (!publicRepoContainer) return;

  const createdTimeDiv = createElement({
    id: 'repo-created-time-second',
    className: 'mb-2 d-flex color-fg-muted',
    html: TEMPLATES.createdTimeSecond(createdDate)
  });

  publicRepoContainer.parentNode.insertBefore(createdTimeDiv, publicRepoContainer);
}

// 插入創建時間元素
function insertCreatedTimeElements(createdDate) {
  if (!createdDate) return;
  insertCreatedTime(createdDate);
  insertCreatedTimeSecond(createdDate);
}

// 監聽 DOM 變化
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    const shouldUpdate = mutations.some(mutation => 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && (
          node.matches?.(`${SELECTORS.FORKS_LINK}, ${SELECTORS.PUBLIC_REPO_CONTAINER}`) ||
          node.querySelector(`${SELECTORS.FORKS_LINK}, ${SELECTORS.PUBLIC_REPO_CONTAINER}`)
        )
      )
    );

    if (shouldUpdate && window.repoCreatedDate) {
      insertCreatedTimeElements(window.repoCreatedDate);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}

// 監聽 URL 變化
function setupUrlChangeListener() {
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        if (window.repoCreatedDate) {
          insertCreatedTimeElements(window.repoCreatedDate);
        }
      }, 500);
    }
  }, 100);
}

// 獲取倉庫數據
async function fetchRepoData(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    const data = await response.json();
    
    if (data.created_at) {
      window.repoCreatedDate = formatDate(data.created_at);
      insertCreatedTimeElements(window.repoCreatedDate);
    } else {
      console.error("無法取得創建時間:", data.message || "未知錯誤");
    }
  } catch (error) {
    console.error("API 請求失敗:", error);
  }
}

// 初始化擴展
function initExtension() {
  if (!isRepoHomePage()) return;

  const { owner, repo } = getRepoInfo();
  setupMutationObserver();
  setupUrlChangeListener();
  fetchRepoData(owner, repo);
}

// 啟動擴展
document.addEventListener('DOMContentLoaded', initExtension);
document.addEventListener('pjax:end', initExtension);