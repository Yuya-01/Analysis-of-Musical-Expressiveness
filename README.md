# Minima Viewer - 静态网站版本

基于 GitHub Pages 部署的音乐表现力分析系统。

## 访问地址

部署后访问: `https://你的用户名.github.io/minima-viewer/`

## 功能特点

- **最小能量点分析**：识别音乐结构中的能量最低点（分段/呼吸点）
- **层级结构浏览**：多层级能量结构，Level 1 最细粒度
- **速度曲线可视化**：实时显示演奏速度变化
- **系统逐行播放**：自动逐行播放乐谱
- **深色/浅色主题**：一键切换
- **中英文切换**：支持多语言

## 内置曲目

- K.310 - Mozart Sonata 8-1 (Rozanski, Bogdanovitch, Jia, Lo, Lee)
- K.331 - Mozart Sonata 11-3 (Stahievitch)
- K.332 - Mozart Sonata 12-1 (Adig, MunA, TET, WuuE)
- K.332 - Mozart Sonata 12-2 (MunA, WuuE)
- K.332 - Mozart Sonata 12-3 (Blinov, MunA, WuuE)

## 本地开发

1. 下载整个仓库
2. 直接在浏览器中打开 `index.html`（需要通过 HTTP 服务器访问以避免 CORS 问题）

```bash
# 使用 Python 启动本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 部署到 GitHub Pages

1. Fork 或复制此仓库
2. 在仓库 Settings → Pages 中启用 GitHub Pages
3. 选择 `gh-pages` 分支或 `main` 分支的 `/ (root)` 目录
4. 访问 `https://你的用户名.github.io/仓库名/`

## 技术栈

- OSMD (OpenSheetMusicDisplay) - 乐谱渲染
- Chart.js - 速度曲线可视化
- Bootstrap 5 - UI 框架
