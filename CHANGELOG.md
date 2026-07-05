# CHANGELOG

## 2026-07-05

### Fixed
- 按呼号查询仅匹配己方（from_call），对方（to_call）无法查到记录：CloudBase 路径使用 `_.or([{from_call}, {to_call}])` 复合查询，localStorage 同时匹配双方 — 两路径均已覆盖
- 无 CloudBase 环境时全站不可用（后台持续初始化、查询无响应）：新增 localStorage 兜底存储层，`cloudbase.ts` 自动检测 ENV_ID 占位符并切换至本地存储模式，所有接口（提交/查询/妥收/管理配置/管理列表/状态更新）在 localStorage 模式下完全可用

### Added
- 管理后台增加修改密码功能：Dashboard 顶部「修改密码」按钮展开表单，需验证当前密码后设置新密码
- 加密工具模块 `src/lib/crypto.ts`，支持 AES-GCM 对称加密 + SHA-256 密码哈希 + PBKDF2 密钥派生
- 通用 Modal 弹窗组件 `src/components/Modal.tsx`
- Home 页面表单验证（呼号格式校验、RST/SINPO 数值范围校验）
- Home 页面提交前预览卡片弹窗
- Home 页面提交成功后展示编号 + 一键复制 + 分享链接
- Status 页面状态进度条可视化（5 步圆点线）
- Status 页面编号复制按钮、空状态提示
- Status 页面支持 URL 参数 `?q=xxx` 直接查询
- Confirm 页面三步流程（查询 → 预览详情 → 确认），防误操作
- Confirm 页面可选备注输入
- Confirm 页面妥收成功时间戳展示
- Admin 首次密码设置流程（替换硬编码 admin123）
- Admin 密码 SHA-256 哈希存储
- Admin 分页列表、状态筛选、类型筛选
- Admin 内联状态下拉切换
- CloudBase 扩展接口：`getAdminConfig`、`setAdminPassword`、`getAllRequests`、`updateRequestStatus`
- GitHub Actions 自动部署到 GitHub Pages（deploy.yml）

### Changed
- Home 页面按钮文案「提交申请」→「预览并提交」
- Status 页面查询结果卡片增加信息密度
- Admin 页面从占位数据改为 CloudBase 实时数据
- deploy.yml 的 node-version 从 22 升级到 24
- vite.config.ts 设置 base 为 `/qsl-card/`
- package.json 项目名从 qsl-card-tmp 改为 qsl-card

### Fixed
- BrowserRouter 改为 HashRouter，修复 GitHub Pages SPA 路由白屏
- 删除冲突的 Jekyll 自动部署工作流
