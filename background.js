// 記錄最後一個被啟用的分頁ID和其索引位置
let lastActivatedTabId = null;
let lastActivatedTabIndex = -1;

// 監聽分頁啟用事件，更新紀錄
chrome.tabs.onActivated.addListener(activeInfo => {
  // 使用 activeInfo 中的 tabId 直接查詢，效率更高
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    // 檢查 tab 物件是否存在且視窗ID有效，避免在視窗關閉等邊界情況下出錯
    if (!chrome.runtime.lastError && tab && tab.windowId !== chrome.windows.WINDOW_ID_NONE) {
      lastActivatedTabId = tab.id;
      lastActivatedTabIndex = tab.index;
    }
  });
});

// 監聽分頁關閉事件
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // 如果整個視窗正在關閉，則不執行任何操作
  if (removeInfo.isWindowClosing) {
    return;
  }

  // 核心改動：直接判斷被關閉的是否為最後一個活躍分頁
  // 如果是，則執行我們的切換邏輯，覆蓋瀏覽器的預設行為
  if (tabId === lastActivatedTabId) {
    // 查詢目前視窗中剩餘的分頁
    chrome.tabs.query({ windowId: removeInfo.windowId }, (tabs) => {
      // 如果關閉後已沒有分頁，則不執行任何操作
      if (tabs.length === 0) {
        return;
      }

      // 計算應該被啟用的新分頁的索引
      // 如果被關閉的分頁索引大於0 (不是最左邊的)，則目標索引為其左側
      // 如果被關閉的是最左邊的分頁 (index 0)，則新的目標索引依然是 0 (也就是原本右邊的第一個)
      let newIndex = lastActivatedTabIndex > 0 ? lastActivatedTabIndex - 1 : 0;

      // 確保新索引不會超出目前剩餘分頁的範圍
      if (newIndex >= tabs.length) {
        newIndex = tabs.length - 1;
      }

      // 找到對應索引的分頁並啟用它
      const tabToActivate = tabs.find(tab => tab.index === newIndex);
      if (tabToActivate) {
          chrome.tabs.update(tabToActivate.id, { active: true });
      } else if (tabs.length > 0) {
          // 作為備用方案，如果找不到對應索引的分頁，就啟用最接近的一個
          chrome.tabs.update(tabs[newIndex].id, { active: true });
      }
    });
  }
});

// 當分頁被拖動，位置改變時，也需要更新 lastActivatedTabIndex
chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    if (tabId === lastActivatedTabId) {
        lastActivatedTabIndex = moveInfo.toIndex;
    }
});