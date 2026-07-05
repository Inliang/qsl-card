---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 4d32f127e120f5be24dadce57b263d70_f704b381787311f1b3d35254007bceed
    ReservedCode1: ji+f13WIVR2d0hyE5ThtnSI8A9xevkNYRztWp2f6mdhGgHf2MwMononO8FtfIc60OT5rAeoTYb4P4VeaxG9Zx+DCTDbMdD94R4Q7ydcS8fxnaDxUxEqrRp2MAqjKTdUelHEIRGpagDrv6K0QfRCRiTcZl1UfYC+D2PpidrmPx16tgmsNo2D4+A6aBoE=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 4d32f127e120f5be24dadce57b263d70_f704b381787311f1b3d35254007bceed
    ReservedCode2: ji+f13WIVR2d0hyE5ThtnSI8A9xevkNYRztWp2f6mdhGgHf2MwMononO8FtfIc60OT5rAeoTYb4P4VeaxG9Zx+DCTDbMdD94R4Q7ydcS8fxnaDxUxEqrRp2MAqjKTdUelHEIRGpagDrv6K0QfRCRiTcZl1UfYC+D2PpidrmPx16tgmsNo2D4+A6aBoE=
---



# QSL 卡片交换网站 — 设计规格说明

日期：2026-07-05  
状态：已确认

---

## 1. 概述

构建一个业余无线电 QSL 卡片交换网站，支持通联卡（QSL）、眼球卡（EYEBALL）、收听卡（SWL）三种卡片类型的在线申请、状态追踪和管理。全站移动端与桌面端功能对等，采用统一申请流 + 动态表单方案。

参考网站：manager.nebulae.cool

---

## 2. 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS v4
- **后端**：CloudBase BaaS（NoSQL 数据库 + 静态托管）
- **设计风格**：实用工具型，简洁功能型界面，非花哨营销页
- **响应式**：Tailwind CSS v4 响应式断点（sm/md/lg），移动端底部 Tab 栏 / 桌面端顶部导航条

---

## 3. 卡片类型与字段

三种卡片共用一张申请表，类型切换时字段动态变化。

| 类型 | 标识 | 必填字段 | 发起方限制 |
|------|------|----------|-----------|
| 通联卡 | QSL | 己方呼号、对方呼号、通联时间、频率、模式(SSB/CW/FT8等)、RST(r/s/t) | 双方均可发起 |
| 眼球卡 | EYEBALL | 己方呼号、对方呼号、见面时间、活动名称/地点 | 双方均可发起 |
| 收听卡 | SWL | 非收听方不可见入口；收听台站呼号、收听时间、频率、SINPO(s/i/n/p/o) | 仅收听方可发起 |

---

## 4. 状态流转

```
申请 → 待处理 → 处理中 → 已寄出 → 已妥收
```

---

## 5. 数据模型

### 5.1 qsl_requests 集合

```typescript
interface QSLRequest {
  _id: string;                    // 自动生成
  card_type: "QSL" | "EYEBALL" | "SWL";
  status: "申请" | "待处理" | "处理中" | "已寄出" | "已妥收";
  
  // 通用字段
  from_call: string;
  to_call: string;
  created_at: number;
  updated_at: number;
  
  // 通联卡字段 (card_type=QSL 时必填)
  qso_time?: string;
  freq?: string;
  mode?: string;
  rst_sent?: number;
  rst_rcvd?: number;
  rst_tone?: number;
  
  // 眼球卡字段 (card_type=EYEBALL 时必填)
  eyeball_time?: string;
  eyeball_event?: string;
  
  // 收听卡字段 (card_type=SWL 时必填)
  swl_time?: string;
  swl_freq?: string;
  swl_sinpo_s?: number;
  swl_sinpo_i?: number;
  swl_sinpo_n?: number;
  swl_sinpo_p?: number;
  swl_sinpo_o?: number;
  
  // 管理字段
  handled_by?: string;
  shipped_at?: number;
  confirmed_at?: number;
}
```

### 5.2 operators 集合（呼号库）

```typescript
interface Operator {
  _id: string;
  callsign: string;     // 呼号（唯一）
  name?: string;        // 姓名
  is_swl: boolean;      // 是否为收听台
  created_at: number;
}
```

### 5.3 admin_users 集合

```typescript
interface AdminUser {
  _id: string;
  username: string;
  password_hash: string;  // CloudBase 认证或自定义
  created_at: number;
}
```

---

## 6. 页面结构与路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 / 申请页 | 卡片类型选择 + 动态表单，SWL 入口对非收听方不可见 |
| `/status` | 状态查询 | 输入申请编号或呼号查进度，全类型统一列表 |
| `/confirm` | 妥收确认 | 输入编号确认妥收 |
| `/admin` | 管理后台 | 密码保护，按类型筛选 + 状态管理，含呼号库维护 |

### 6.1 移动端适配策略

- 表单区域：移动端全宽堆叠，桌面端 640px 居中
- 导航：移动端底部固定 Tab 栏（首页 / 查询 / 确认 / 管理），桌面端顶部水平导航条
- 使用 Tailwind CSS `sm:` / `md:` / `lg:` 断点控制布局切换

---

## 7. API 接口设计

### 7.1 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/qsl/submit` | 提交卡片申请 |
| GET | `/api/qsl/query?id=xxx` | 按 ID 查询申请状态 |
| GET | `/api/qsl/query?call=xxx` | 按呼号查询申请列表 |
| POST | `/api/qsl/confirm` | 确认妥收 |
| GET | `/api/operators` | 呼号库查询（模糊搜索） |

### 7.2 管理接口（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/qsl?type=&status=&page=` | 管理列表（分页 + 筛选） |
| PATCH | `/api/admin/qsl/:id/status` | 更新申请状态 |
| POST | `/api/admin/operators` | 新增呼号 |
| DELETE | `/api/admin/operators/:id` | 删除呼号 |

### 7.3 业务约束

- SWL 申请路由：前端校验 `operators` 表中 `from_call` 的 `is_swl` 字段，非收听方屏蔽 SWL 入口
- CloudBase 安全规则：数据库写操作需通过云函数鉴权，读操作（公开查询）开放

---

## 8. 测试策略

- **单元测试**：表单字段校验逻辑、卡片类型路由守卫、状态流转合法性
- **集成测试**：CloudBase 云函数接口（提交 / 查询 / 状态更新）
- **E2E 测试**：三种卡片完整申请流程（QSL / EYEBALL / SWL），移动端断点覆盖

---

## 9. 前置依赖

1. CloudBase 环境创建并获取环境 ID
2. CloudBase 数据库集合初始化（qsl_requests、operators、admin_users）
3. CloudBase 匿名登录 + 自定义管理员认证配置
4. CloudBase 静态托管绑定自定义域名（如需要）

---

## 10. 方案选择记录

- **方案 A（统一申请流 + 动态表单）** vs 方案 B（独立申请流）：选择 A，降低维护成本，SWL 限制通过路由层控制
- **移动端策略**：全端一致（方案 3），移动端与桌面端功能完全对等
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
