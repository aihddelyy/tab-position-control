// 定义设置项的 HTML ID 和存储键名
const SETTING_KEYS = {
    HTML_ID: {
        ACTIVATE_LEFT: 'activateLeftTab', // 激活左侧标签功能
        NEW_TAB_RIGHT: 'newTabRight'      // 新标签在右侧打开功能
    },
    STORAGE_KEY: {
        ACTIVATE_LEFT: 'activateLeftTabEnabled',
        NEW_TAB_RIGHT: 'newTabRightEnabled'
    }
};

// 获取 DOM 元素
const activateLeftTabCheckbox = document.getElementById(SETTING_KEYS.HTML_ID.ACTIVATE_LEFT);
const newTabRightCheckbox = document.getElementById(SETTING_KEYS.HTML_ID.NEW_TAB_RIGHT);

/**
 * 从 Chrome 存储加载设置，并更新开关状态
 */
function loadSettings() {
    // 默认值为 true (开启)
    const defaults = {
        [SETTING_KEYS.STORAGE_KEY.ACTIVATE_LEFT]: true,
        [SETTING_KEYS.STORAGE_KEY.NEW_TAB_RIGHT]: true
    };

    chrome.storage.sync.get(defaults, (items) => {
        if (!chrome.runtime.lastError) {
            activateLeftTabCheckbox.checked = items[SETTING_KEYS.STORAGE_KEY.ACTIVATE_LEFT];
            newTabRightCheckbox.checked = items[SETTING_KEYS.STORAGE_KEY.NEW_TAB_RIGHT];
        }
    });
}

/**
 * 保存单个设置到 Chrome 存储
 * @param {string} key - 存储键名
 * @param {boolean} value - 设置值
 */
function saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
            console.error("保存设置失败:", chrome.runtime.lastError.message);
        }
    });
}

// 为开关添加事件监听器
activateLeftTabCheckbox.addEventListener('change', (event) => {
    saveSetting(SETTING_KEYS.STORAGE_KEY.ACTIVATE_LEFT, event.target.checked);
});

newTabRightCheckbox.addEventListener('change', (event) => {
    saveSetting(SETTING_KEYS.STORAGE_KEY.NEW_TAB_RIGHT, event.target.checked);
});

// 页面加载时，加载设置
document.addEventListener('DOMContentLoaded', loadSettings);
