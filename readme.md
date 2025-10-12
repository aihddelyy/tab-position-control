# Tab Control Pro

![Version 2.0](https://img.shields.io/badge/Version-2.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 🗂 简介 (Introduction)

**Tab Control Pro** 是一款轻量级且功能强大的浏览器扩展程序，专为提升标签页管理效率而设计。它解决了 Chromium 浏览器（如 Chrome 和 Edge）在标签页切换和新建标签页位置上的痛点，让您的浏览体验更加顺畅和直观。

经过复杂的兼容性调试，本扩展程序成功地克服了 Chromium 在处理 Ctrl+T 新建标签页位置上的限制，确保功能在大多数环境下稳定运行。

## ✨ 主要功能 (Key Features)

| 功能 | 描述 | 优势 |
| :--- | :--- | :--- |
| **关闭后激活左侧标签页** | 当您关闭当前活动的标签页时，焦点会自动切换到它左侧的标签页。 | 保持浏览连贯性，符合用户直觉，尤其适用于多标签页操作。 |
| **新标签页在当前右侧** | 无论您是按下 **Ctrl+T** (或 Cmd+T) 新建标签页，还是点击 **'+' 按钮**，新标签页都会准确地出现在当前标签页的右侧。 | 告别新标签页跳到最右边的困扰，保持相关的标签页相邻，提高工作效率。 |
| **链接打开在新标签页右侧** | 通过链接打开的新标签页也会自动定位到原标签页的右侧。 | 保持链接关联，方便快速切换和管理。 |

## 🛠 安装与使用 (Installation)

由于您是开发者或正在进行本地测试，请使用 **“加载解压的扩展程序”** 方式安装。

### 步骤一：准备文件

确保您的扩展程序文件夹包含以下所有文件：

* `manifest.json`
* `background.js`
* `popup.html`
* `popup.css`
* `icons/` (包含您的图标文件)

### 步骤二：加载扩展程序

1.  打开您的浏览器（Edge 或 Chrome）。
2.  在地址栏输入 `edge://extensions` 或 `chrome://extensions`，进入扩展程序管理页面。
3.  开启页面右上角的 **“开发者模式”**（Developer mode）。
4.  点击左上角的 **“加载解压的扩展程序”**（Load unpacked）。
5.  选择您的 **Tab Control Pro 扩展程序的根目录文件夹**。

### 步骤三：配置设置

1.  点击浏览器工具栏中的 **Tab Control Pro** 图标。
2.  在弹出的菜单中，您可以分别控制以下两个功能：
    * **关闭分頁後，啟用左側分頁** (Activate left tab on close)
    * **新分頁在目前分頁右側開啟** (Open new tab to the right of current)

## 核心技术说明

本扩展程序在 `background.js` 中采用了以下高级技术来确保功能稳定性：

* **功能一 (onRemoved 激活左侧):** 维护了精确的 `lastUserTabInfo` 状态，确保在关闭操作发生时，能够正确识别并激活用户关闭前最后活跃的标签页左侧。
* **功能二 (新标签页位置):** 借鉴并优化了外部插件的**标签页活跃状态跟踪逻辑** (`windowActiveTab`)，成功绕过了 Chromium 浏览器对 `tabs.create` index 参数的硬性限制，实现了对 Ctrl+T 和链接打开的新标签页的精确位置控制。

---

## 许可证 (License)

本项目采用 MIT 许可证。详情请参阅 LICENSE 文件（如果您有的话）。

## 贡献 (Contribution)

欢迎任何形式的贡献、建议或 Bug 报告。