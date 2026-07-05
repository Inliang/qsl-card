# CHANGELOG

### Changed
- deploy.yml 的 node-version 从 22 升级到 24，消除 Node 20 弃用警告

### Fixed
- BrowserRouter 改为 HashRouter，修复 GitHub Pages SPA 路由白屏
- 删除冲突的 Jekyll 自动部署工作流

## 2026-07-05

### Added
- GitHub Actions 自动部署到 GitHub Pages（deploy.yml）
- vite.config.ts 设置 base 为 `/qsl-card/`

### Changed
- package.json 项目名从 qsl-card-tmp 改为 qsl-card

### Added
- 初始化项目：React 18 + TypeScript + Tailwind CSS v4 + Vite
- 首页/申请页：三种卡片类型（QSL / EYEBALL / SWL）动态表单
- 状态查询页：按编号或呼号查询卡片处理进度
- 妥收确认页：输入编号确认卡片妥收
- 管理后台：密码保护，占位管理面板
- CloudBase SDK 集成（待配置环境 ID）
- 移动端底部 Tab 导航 + 桌面端顶部导航响应式布局
