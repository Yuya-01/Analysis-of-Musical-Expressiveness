# Minima Viewer - 静态展示版

基于最小能量点的音乐表现力分析系统静态展示版。

## 在线访问

访问地址：https://[your-username].github.io/minima-viewer/

## 功能特点

- 多层级最小能量点分析
- 速度曲线可视化
- 分层结构浏览器
- 预置示例数据展示

## 本地运行

由于是静态网站，可以直接在浏览器中打开 `index.html`，或者使用任意静态服务器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .
```

然后访问 http://localhost:8000

## 部署到 GitHub Pages

1. 将此仓库推送到 GitHub
2. 进入 Settings > Pages
3. Source 选择 `main` 分支和 `/(root)` 目录
4. 点击 Save

等待几分钟后，你的网站就会上线了。

## 技术栈

- 前端：原生 JavaScript + HTML5 Canvas
- 乐谱渲染：OpenSheet Music Display (OSMD)
- 图表：Chart.js
- 国际化：i18n 支持

## 示例数据

预置了莫扎特钢琴奏鸣曲的三个乐章作为示例：

- K.310-1：a小调钢琴奏鸣曲第一乐章
- K.331-3：A大调钢琴奏鸣曲第三乐章（土耳其进行曲）
- K.332-1：F大调钢琴奏鸣曲第一乐章

## 关于

这是一个用于毕设的演示项目，核心创新点是**分层最小能量点算法**，用于分析音乐演奏中的结构和表现力。
