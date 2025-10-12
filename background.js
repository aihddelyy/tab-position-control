// 关闭标签后激活左侧功能所需变量
let lastUserTabInfo = {
    id: null,
    index: -1,
    windowId: -1,
    previousActiveId: null,
    previousActiveIndex: -1
};

// 控制新标签页位置所需变量
const windowOpenTime = {};
const windowActiveTab = {};
let recentlyClosedWindowId;

/**
 * 移动标签页到其打开者（opener）的右侧
 * @param {chrome.tabs.Tab} opener - 打开者标签页对象
 * @param {number} id - 要移动的标签页 ID
 * @param {number} index - 要移动的标签页当前索引
 */
const moveTabNextToOpener = (opener, id, index) => {
    if (!opener || chrome.runtime.lastError) return;

    const targetIndex = opener.index + 1;

    // 仅当目标位置在当前位置左侧时移动，防止循环
    if (targetIndex < index) {
        // 使用 setTimeout 避免浏览器锁定
        setTimeout(() => {
            try {
                chrome.tabs.move(id, { index: targetIndex });
            } catch (e) {
                // 忽略移动错误
            }
        }, 50);
    }
};

// 初始化时获取所有窗口和标签页信息
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

// 窗口创建时，初始化相关数据
chrome.windows.onCreated.addListener(window => {
    windowOpenTime[window.id] = Date.now();
    windowActiveTab[window.id] = [];
});

// 窗口关闭时，清理数据
chrome.windows.onRemoved.addListener(windowId => {
    delete windowOpenTime[windowId];
    delete windowActiveTab[windowId];
});

// 监听标签页激活事件，更新追踪变量
chrome.tabs.onActivated.addListener(activeInfo => {
    // 记录最近激活的标签页 (用于新标签页定位)
    if (windowActiveTab[activeInfo.windowId]) {
        windowActiveTab[activeInfo.windowId].unshift(activeInfo.tabId);
        if (windowActiveTab[activeInfo.windowId].length > 2) {
            windowActiveTab[activeInfo.windowId].splice(2);
        }
    }

    // 记录最后用户激活的标签页信息 (用于关闭后激活左侧)
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

// 标签页移动时，更新其索引
chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    if (tabId === lastUserTabInfo.id) {
        lastUserTabInfo.index = moveInfo.toIndex;
        lastUserTabInfo.windowId = moveInfo.windowId;
    }
});

// 标签页关闭时的处理
chrome.tabs.onRemoved.addListener((removedTabId, removeInfo) => {
    // 更新活动标签页列表
    if (windowActiveTab[removeInfo.windowId]) {
        if (removedTabId === windowActiveTab[removeInfo.windowId][0]) {
            recentlyClosedWindowId = removeInfo.windowId;
        }
        windowActiveTab[removeInfo.windowId] = windowActiveTab[removeInfo.windowId].filter(id => id !== removedTabId);
    }

    // 功能一：关闭标签后，激活左侧标签
    chrome.storage.sync.get({ activateLeftTabEnabled: true }, (items) => {
        if (!items.activateLeftTabEnabled || removeInfo.isWindowClosing) {
            return;
        }

        // 确认关闭的是之前激活的标签
        if (removedTabId !== lastUserTabInfo.previousActiveId || removeInfo.windowId !== lastUserTabInfo.windowId) {
            return;
        }

        const removedTabIndex = lastUserTabInfo.previousActiveIndex;
        let newIndex = Math.max(0, removedTabIndex - 1);

        chrome.tabs.query({ windowId: removeInfo.windowId }, (tabs) => {
            if (tabs.length === 0) {
                return;
            }

            // 确保索引在范围内
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

// 功能二：新标签页在当前标签右侧打开
chrome.tabs.onCreated.addListener(newTab => {
    const { id, index, openerTabId, pinned, windowId } = newTab;

    chrome.storage.sync.get({ newTabRightEnabled: true }, (items) => {
        if (!items.newTabRightEnabled || pinned) {
            return;
        }

        // 防止浏览器启动时移动标签页
        if (!(windowId in windowOpenTime)) {
            windowOpenTime[windowId] = Date.now();
        }
        if (Date.now() - windowOpenTime[windowId] < 1000) return;

        if (!openerTabId) {
            // 对于没有 opener 的新标签 (如 Ctrl+T), 使用最近激活的标签作为参考
            const recentlyActiveTabId = windowActiveTab[windowId]?.[0];
            if (recentlyActiveTabId) {
                chrome.tabs.get(recentlyActiveTabId, tab => {
                    moveTabNextToOpener(tab, id, index);
                });
            }
            return;
        }

        // 对于有 opener 的新标签，直接移动
        chrome.tabs.get(openerTabId, opener => {
            moveTabNextToOpener(opener, id, index);
        });
    });
});
