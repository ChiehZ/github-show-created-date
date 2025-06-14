const browserAPI = typeof chrome !== "undefined" ? chrome : browser;

// 從 URL 提取 owner 和 repo 名稱
const path = window.location.pathname.split("/");
const owner = path[1];
const repo = path[2];

// 確認是在儲存庫頁面
if (owner && repo && !path[3]) {
  // 儲存創建時間，避免重複呼叫 API
  let repoCreatedDate = null;

  // 插入創建時間的函數
  function insertCreatedTimeElements() {
    if (!repoCreatedDate) return;
    
    // 只有當元素不存在時才插入
    if (!document.getElementById("repo-created-time")) {
      insertCreatedTime(repoCreatedDate);
    }
    
    if (!document.getElementById("repo-created-time-second")) {
      insertCreatedTimeSecond(repoCreatedDate);
    }
  }

  // 監聽 URL 變化
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // 延遲執行以等待頁面更新
      setTimeout(insertCreatedTimeElements, 500);
    }
  }, 100);

  // 監聽 DOM 變化
  const observer = new MutationObserver((mutations) => {
    // 檢查是否有新增的節點包含我們感興趣的內容
    const shouldUpdate = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === 1) { // ELEMENT_NODE
          return node.matches && (
            node.matches('.mt-2 a[href$="/forks"]') || 
            node.matches('.mb-2.d-flex.color-fg-muted') ||
            node.querySelector('.mt-2 a[href$="/forks"]') ||
            node.querySelector('.mb-2.d-flex.color-fg-muted')
          );
        }
        return false;
      });
    });

    if (shouldUpdate) {
      insertCreatedTimeElements();
    }
  });

  // 開始觀察 document 的變化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 呼叫 GitHub API 取得創建時間
  async function fetchRepoData() {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      const data = await response.json();
      
      if (data.created_at) {
        repoCreatedDate = new Date(data.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        insertCreatedTimeElements();
      } else {
        console.error("無法取得創建時間:", data.message || "未知錯誤");
      }
    } catch (error) {
      console.error("API 請求失敗:", error);
    }
  }
  
  fetchRepoData();
}

// 在 Forks 和 Report repository 之間插入創建時間
function insertCreatedTime(createdDate) {
  // 找到 Forks 的 div 容器
  const forksContainer = document.querySelector('div.mt-2 a[href$="/forks"]')?.closest('div.mt-2');
  if (!forksContainer) {
    console.error("找不到 Forks 容器");
    return;
  }
  
  // 檢查是否已插入，避免重複
  if (document.getElementById("repo-created-time")) return;

  // 創建新的 div 容器
  const createdTimeDiv = document.createElement("div");
  createdTimeDiv.id = "repo-created-time";
  createdTimeDiv.className = "mt-2";
  createdTimeDiv.innerHTML = `
    <h3 class="sr-only">Repository created on ${createdDate}</h3>
    <span class="d-inline-block">
      <svg class="octicon octicon-calendar mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2A2.75 2.75 0 0 1 15 4.75v8.5A2.75 2.75 0 0 1 12.25 16H3.75A2.75 2.75 0 0 1 1 13.25v-8.5A2.75 2.75 0 0 1 3.75 2V.75A.75.75 0 0 1 4.75 0ZM2.5 6v7.25c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V6Zm1.25-3.5c-.69 0-1.25.56-1.25 1.25V4.5h11V3.75c0-.69-.56-1.25-1.25-1.25Z"></path>
      </svg>
      <span>Created: <strong>${createdDate}</strong></span>
    </span>
  `;
  
  // 在 Forks 容器後插入創建時間
  forksContainer.after(createdTimeDiv);
}

// 在 Public repository 前插入創建時間
function insertCreatedTimeSecond(createdDate) {
  // 檢查是否已插入，避免重複
  if (document.getElementById("repo-created-time-second")) return;

  // 找到 Public repository 的容器
  const publicRepoContainer = document.querySelector('.mb-2.d-flex.color-fg-muted');
  if (!publicRepoContainer) {
    console.error("找不到 Public repository 容器");
    return;
  }

  // 創建新的 div 容器
  const createdTimeDiv = document.createElement("div");
  createdTimeDiv.id = "repo-created-time-second";
  createdTimeDiv.className = "mb-2 d-flex color-fg-muted";
  createdTimeDiv.innerHTML = `
    <div class="d-flex flex-items-center" style="height: 21px">
      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-calendar flex-shrink-0 mr-2">
        <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2A2.75 2.75 0 0 1 15 4.75v8.5A2.75 2.75 0 0 1 12.25 16H3.75A2.75 2.75 0 0 1 1 13.25v-8.5A2.75 2.75 0 0 1 3.75 2V.75A.75.75 0 0 1 4.75 0ZM2.5 6v7.25c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V6Zm1.25-3.5c-.69 0-1.25.56-1.25 1.25V4.5h11V3.75c0-.69-.56-1.25-1.25-1.25Z"></path>
      </svg>
      <span class="flex-auto min-width-0 width-fit">
        Created: <span class="text-bold color-fg-default">${createdDate}</span>
      </span>
    </div>
  `;
  
  // 在 Public repository 容器前插入創建時間
  publicRepoContainer.parentNode.insertBefore(createdTimeDiv, publicRepoContainer);
}