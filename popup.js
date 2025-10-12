// popup.js

// =================================================================================
// 存储键名 (必须与 background.js 中检查的键名一致)
// =================================================================================
const SETTING_KEYS = {
    HTML_ID: {
        ACTIVATE_LEFT: 'activateLeftTab', // HTML ID for "关闭标签页后激活左侧标签页"
        NEW_TAB_RIGHT: 'newTabRight'      // HTML ID for "新标签页在当前标签页右侧开启"
    },
    STORAGE_KEY: {
        ACTIVATE_LEFT: 'activateLeftTabEnabled', 
        NEW_TAB_RIGHT: 'newTabRightEnabled'      
    }
};

// =================================================================================
// DOM 元素获取
// =================================================================================
const activateLeftTabCheckbox = document.getElementById(SETTING_KEYS.HTML_ID.ACTIVATE_LEFT);
const newTabRightCheckbox = document.getElementById(SETTING_KEYS.HTML_ID.NEW_TAB_RIGHT);

// =================================================================================
// 功能函数
// =================================================================================

/**
 * 从 Chrome 存储中加载设置并更新开关状态。
 */
function loadSettings() {
    // 设置默认值：如果存储中没有值，则默认为 true（开启）
    const defaults = {};
    defaults[SETTING_KEYS.STORAGE_KEY.ACTIVATE_LEFT] = true;
    defaults[SETTING_KEYS.STORAGE_KEY.NEW_TAB_RIGHT] = true;

    chrome.storage.sync.get(defaults, (items) => {
        if (!chrome.runtime.lastError) {
            // 根据存储的值设置 checkbox 的 checked 状态
            activateLeftTabCheckbox.checked = items[SETTING_KEYS.STORAGE_KEY.ACTIVATE_LEFT];
            newTabRightCheckbox.checked = items[SETTING_KEYS.STORAGE_KEY.NEW_TAB_RIGHT];
        }
    });
}

/**
 * 将单个设置保存到 Chrome 存储中。
 * @param {string} key - 存储键名。
 * @param {boolean} value - 要保存的值 (true/false)。
 */
function saveSetting(key, value) {
    let setting = {};
    setting[key] = value;
    chrome.storage.sync.set(setting, () => {
        if (chrome.runtime.lastError) {
            console.error("保存设置失败:", chrome.runtime.lastError.message);
        } else {
            console.log(`设置 ${key} 保存成功: ${value}`);
        }
    });
}

// =================================================================================
// 事件监听器
// =================================================================================

// 监听 "关闭标签页后激活左侧标签页" 开关的变化
activateLeftTabCheckbox.addEventListener('change', (event) => {
    saveSetting(SETTING_KEYS.STORAGE_KEY.ACTIVATE_LEFT, event.target.checked);
});

// 监听 "新标签页在当前标签页右侧开启" 开关的变化
newTabRightCheckbox.addEventListener('change', (event) => {
    saveSetting(SETTING_KEYS.STORAGE_KEY.NEW_TAB_RIGHT, event.target.checked);
});

// 页面加载完成后，加载并显示存储的设置
document.addEventListener('DOMContentLoaded', loadSettings);