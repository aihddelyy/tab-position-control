// =================================================================================
// 變數宣告區
// =================================================================================

// 【功能一：关闭后激活左侧】所需变量 (已被验证有效)
let lastUserTabInfo = {
    id: null,
    index: -1,
    windowId: -1,
    previousActiveId: null, 
    previousActiveIndex: -1
};

// 【功能二：新标签页位置】所需变量 (基于您提供的插件代码)
const windowOpenTime = {};
const windowActiveTab = {};
let recentlyClosedWindowId; // 插件代码中的变量，暂时保留

// =================================================================================
// 通用工具函數 (基于您提供的插件代码)
// =================================================================================

/**
 * 将标签页移动到打开它的标签页右侧。
 * @param {object} opener - 打开标签页的 Tab 对象。
 * @param {number} id - 要移动的标签页 ID。
 * @param {number} index - 要移动标签页的当前索引。
 */
const moveTabNextToOpener = (opener, id, index) => {
    // 检查是否有错误或 opener 不存在
    if (!opener || chrome.runtime.lastError) return;
    
    // 目标位置是 opener 的索引 + 1
    const targetIndex = opener.index + 1;
    
    // 只有当目标位置在当前位置左侧时才移动 (防止重复移动或无限循环)
    if (targetIndex < index) {
        // 使用 setTimeout 来绕过浏览器对 tabs.move 的即时锁定
        setTimeout(() => {
             try {
                chrome.tabs.move(id, { index: targetIndex });
             } catch (e) {
                 // 忽略移动失败的错误
             }
        }, 50); // 极短的延迟，让浏览器先处理默认行为
    }
};


// =================================================================================
// 初始化和窗口事件 (基于您提供的插件代码)
// =================================================================================

chrome.windows.getAll({ populate: true }, windows => {
    windows.forEach(w => {
        windowActiveTab[w.id] = [];
        if (w.tabs.length > 1) {
            windowOpenTime[w.id] = Date.now();
            const tab = w.tabs.find(tab => tab.active);
            if (tab) windowActiveTab[w.id].unshift(tab.id);
        }
    });
});

chrome.windows.onCreated.addListener(window => {
    windowOpenTime[window.id] = Date.now();
    windowActiveTab[window.id] = [];
});

chrome.windows.onRemoved.addListener(windowId => {
    if (windowId in windowOpenTime) delete windowOpenTime[windowId];
    if (windowId in windowActiveTab) delete windowActiveTab[windowId];
});

// =================================================================================
// 通用事件監聽器 (合并功能一和功能二的逻辑)
// =================================================================================

// 監聽分頁啟用事件，同时更新两个功能所需的跟踪变量
chrome.tabs.onActivated.addListener(activeInfo => {
    // 【功能二跟踪】记录最近激活的标签页
    windowActiveTab[activeInfo.windowId].unshift(activeInfo.tabId);
    if (windowActiveTab[activeInfo.windowId].length > 2) windowActiveTab[activeInfo.windowId].splice(2);
    
    // 【功能一跟踪】记录最后用户激活的标签页（需要异步获取完整tab信息）
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (!chrome.runtime.lastError && tab && tab.windowId !== chrome.windows.WINDOW_ID_NONE) {
            lastUserTabInfo.previousActiveId = lastUserTabInfo.id;
            lastUserTabInfo.previousActiveIndex = lastUserTabInfo.index;
            lastUserTabInfo.id = tab.id;
            lastUserTabInfo.index = tab.index;
            lastUserTabInfo.windowId = tab.windowId;
        }
    });
});

// 當分頁被拖動，位置改變時，更新索引
chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    if (tabId === lastUserTabInfo.id) {
        lastUserTabInfo.index = moveInfo.toIndex;
        lastUserTabInfo.windowId = moveInfo.windowId;
    }
});


// =================================================================================
// 功能一：關閉分頁後，啟用左側分頁 (基于已验证的逻辑)
// =================================================================================

chrome.tabs.onRemoved.addListener((removedTabId, removeInfo) => {
    // 【功能二跟踪】更新插件的活动标签页列表
    if (removedTabId === windowActiveTab[removeInfo.windowId][0]) recentlyClosedWindowId = removeInfo.windowId;
    windowActiveTab[removeInfo.windowId] = windowActiveTab[removeInfo.windowId].filter(id => id !== removedTabId);

    // 核心功能一逻辑
    chrome.storage.sync.get({ activateLeftTabEnabled: true }, (items) => {
        if (!items.activateLeftTabEnabled || removeInfo.isWindowClosing) {
            return; 
        }

        if (removedTabId !== lastUserTabInfo.previousActiveId || removeInfo.windowId !== lastUserTabInfo.windowId) {
             return;
        }

        const removedTabIndex = lastUserTabInfo.previousActiveIndex;
        let newIndex = removedTabIndex > 0 ? removedTabIndex - 1 : 0;
        
        chrome.tabs.query({ windowId: removeInfo.windowId }, (tabs) => {
            if (tabs.length === 0) {
                return;
            }
            
            if (newIndex >= tabs.length) {
                newIndex = tabs.length - 1;
            }

            const tabToActivate = tabs.find(tab => tab.index === newIndex);

            if (tabToActivate) {
                chrome.tabs.update(tabToActivate.id, { active: true });
            }
        });
    });
});


// =================================================================================
// 功能二：新分頁在目前分頁右側開啟
// =================================================================================

chrome.tabs.onCreated.addListener(newTab => {
    const { id, index, openerTabId, pinned, windowId } = newTab;

    chrome.storage.sync.get({ newTabRightEnabled: true }, (items) => {
        if (!items.newTabRightEnabled || pinned) {
            return;
        }

        // 插件中的启动时间检查，防止浏览器启动时移动标签页
        if (!(windowId in windowOpenTime)) {
            windowOpenTime[windowId] = Date.now();
        }
        if (Date.now() - windowOpenTime[windowId] < 1000) return; 

        if (!openerTabId) {
            // 案例 1: 没有 openerTabId (Ctrl+T 或点击 '+')
            // 使用最近激活的标签页作为 opener
            const recentlyActiveTabId = windowActiveTab[windowId][0];
            if (recentlyActiveTabId) {
                chrome.tabs.get(recentlyActiveTabId, tab => {
                    moveTabNextToOpener(tab, id, index);
                });
            }
            return;
        }
        
        
        chrome.tabs.get(openerTabId, opener => {
            moveTabNextToOpener(opener, id, index);
        });
    });
});