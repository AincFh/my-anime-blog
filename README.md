# A.T. Field

**基于 React Router v8.3 与 Cloudflare Workers 的全栈内容与社区平台**

[在线站点](https://aincfh.dpdns.org) · [源码仓库](https://github.com/AincFh/my-anime-blog) · [部署与运维文档](docs/DEPLOYMENT.md) · [数据库迁移](database/)

> **当前状态（2026-08-04）**：项目已部署到 Cloudflare Workers，主域名为 [`aincfh.dpdns.org`](https://aincfh.dpdns.org)。最近一轮发布完成了支付交付、商城购买、抽卡、上传配额、认证会话和 D1 发布门禁的生产级加固；当前本地回归为 **122 个测试文件、505 项测试通过**，依赖审计为 0 个已知漏洞。

> **日志口径**：2026-04-08 至 2026-04-26 的内容来自 Git 提交；2026-07-19 之后的内容来自 `docs/PRODUCTION_DEPLOYMENT_STATUS.md`、本地门禁和 Cloudflare 发布验收。只有明确写为“生产发布”的内容才代表已部署，候选批次仍按未发布处理。

## 项目概览

A.T. Field 是一个已部署到 Cloudflare 的全栈个人内容平台，覆盖文章、番剧资料、图库、社交互动、会员权益、虚拟积分和管理后台。项目采用边缘 SSR 与无服务器架构，重点处理了 D1 数据一致性、会话安全、支付幂等、上传配额和可观测性等生产问题。

| 维度 | 实现 |
| --- | --- |
| 前端与渲染 | TypeScript、React 19、React Router v8.3 SSR、Tailwind CSS v4 |
| 边缘运行时 | Cloudflare Workers、Workers AI |
| 数据与存储 | Cloudflare D1、KV、R2、Analytics Engine |
| 工程化 | Vitest、Wrangler、数据库增量迁移、生产 readiness gate |
| 当前验证 | 122 个测试文件、505 项测试通过；typecheck、生产构建、数据库安全检查和依赖审计通过 |

### 核心工程实践

- 通过 `repositories → services → API/pages` 分层封装 D1 访问，使用显式字段投影和参数化查询。
- 对支付交付、抽卡、商店购买、会员和上传配额使用 D1 批处理、幂等键和审计日志，降低重复扣款与数据不一致风险。
- 使用会话撤销、CSRF、登录限流、TOTP、CSP nonce、R2 文件校验和安全响应头保护用户与资产链路。
- 通过生产 D1 readiness、迁移安全检查、公开健康探针、构建校验和全量测试形成发布门禁。

### 当前生产发布

| 项目 | 状态 |
| --- | --- |
| Worker | `my-anime-blog`，100% 流量 |
| 最近版本 | `8e34469d-0941-4d1e-8336-d2f48d141b2d`（2026-08-03） |
| 公开入口 | [`https://aincfh.dpdns.org`](https://aincfh.dpdns.org) |
| 只读验收 | 首页、文章、番剧、图库、RSS/Atom、搜索和公开 readiness 均通过 |
| 保护边界 | 未认证的系统 health 接口按设计返回 `401`；生产支付、上传和资产写入不使用真实业务数据做冒烟测试 |

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=8B5CF6&height=260&section=header&text=Project%20::%20A.T.%20Field&fontSize=65&fontAlignY=35&desc=Absolute%20Domain%20Deployed&descAlignY=60&descAlign=50&animation=twinkling" width="100%" />
</p>

<p align="center" style="margin-top: -10px;">
  <a href="https://github.com/AincFh">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&pause=1000&color=00FF99&center=true&vCenter=true&width=800&lines=[+SYSTEM_ONLINE+];Cloudflare+Workers+%2B+D1+%2B+R2+%2B+KV;React+Router+v7+%7C+Tailwind+CSS+v4;Glassmorphism+%7C+Dynamic+Backgrounds;%E7%A0%B4%E7%81%AD%E7%9A%84%E5%AE%BF%E5%91%BD%E4%BA%A6%E6%98%AF%E9%87%8D%E7%94%9F%E7%9A%84%E5%96%9C%E6%82%A6;Absolute+Domain:+DEPLOYED." />
  </a>
</p>

<p align="center">
  <br/>
  <samp>
    「The fate of destruction is also the joy of rebirth.」
  </samp>
  <br/><br/>
</p>

<h1 align="center">
  🛡️ Project: A.T. Field (绝对领域)
</h1>

<h3 align="center">
  沉浸式二次元个人网站 — 基于 Cloudflare 全家桶 (Workers + D1 + R2 + KV)
</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Framework-React_Router_v8.3-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Runtime-Cloudflare_Workers-orange?style=flat-square&logo=cloudflare" />
  <img src="https://img.shields.io/badge/Database-Cloudflare_D1_(SQLite)-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Storage-Cloudflare_R2-yellow?style=flat-square" />
  <img src="https://img.shields.io/badge/Cache-Cloudflare_KV-red?style=flat-square" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Animation-Framer_Motion-ff69b4?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" />
</p>

<br/>
<h2 align="center">📑 系统导航 | MAGI Directory</h2>
<p align="center">
  <a href="#-项目进度"><img src="https://img.shields.io/badge/01-🎯_项目进度-8B5CF6?style=for-the-badge" alt="项目进度" /></a>
  <a href="#-更新日志-changelog"><img src="https://img.shields.io/badge/02-📅_更新日志-00FF99?style=for-the-badge&labelColor=black" alt="更新日志" /></a>
  <a href="#-快速开始-quick-start"><img src="https://img.shields.io/badge/03-🚀_快速开始-F38020?style=for-the-badge" alt="快速开始" /></a>
  <a href="#-项目结构"><img src="https://img.shields.io/badge/04-📂_项目结构-3DDC84?style=for-the-badge&labelColor=black" alt="项目结构" /></a>
  <a href="#-技术栈-tech-stack"><img src="https://img.shields.io/badge/05-🧬_技术栈-4285F4?style=for-the-badge" alt="技术栈" /></a>
</p>
<br/>

---

## 🎯 项目进度

> 状态说明：下方 `✅` 表示功能已实现或已有本地验证记录，不等同于已完成独立 Preview 验收或生产验证。生产就绪状态以 `docs/UNKNOWN_REGISTER.md` 和最新质量门禁记录为准。

### ✅ 已完成

<details open>
<summary><strong>1. 📊 数据库设计</strong></summary>

| 模块 | 状态 | 描述 |
|------|:----:|------|
| 文章系统 | ✅ | 支持 Markdown、封面图、阅读量统计、标签分类 |
| 番剧系统 | ✅ | 追番状态管理（在看/看过/想看/弃番）、评分、短评 |
| 用户系统 | ✅ | 基于 D1 的用户认证、权限管理 |
| 会员系统 | ✅ | 多等级订阅、权益管理、自动续费 |
| 积分系统 | ✅ | 虚拟货币"星尘"、签到、消费、交易记录 |
| 支付系统 | ✅ | 订单管理、Mock 支付、回调处理 |
| 全文搜索 | ✅ | 基于 SQLite FTS5 的高性能搜索 |

</details>

<details open>
<summary><strong>2. 🖥️ 核心功能页面</strong></summary>

| 页面 | 状态 | 亮点描述 |
|------|:----:|----------|
| 首页 (Home) | ✅ | 沉浸式 Hero 区域，视差滚动，最新动态展示 |
| 文章列表 (Articles) | ✅ | 响应式网格布局，支持分类筛选 |
| 时光机 (Archive) | ✅ | 双列交互式时间轴，记录生活点滴 |
| 番剧墙 (Bangumi) | ✅ | 瀑布流海报展示，支持状态过滤和评分 |
| 图库 (Gallery) | ✅ | 拍立得风格照片墙，支持随机旋转和视差效果 |
| 积分商城 (Shop) | ✅ | 虚拟物品兑换、头像框、主题、表情 |
| 会员中心 | ✅ | 订阅管理、权益展示、订单历史 |
| RSS/Atom 订阅 | ✅ | 自动生成订阅源 |

</details>

<details open>
<summary><strong>3. 💰 虚拟经济系统</strong></summary>

#### ⭐ 星尘 (Stardust) — 网站专属虚拟货币

| 获取方式 | 数量 | 说明 |
|----------|------|------|
| 每日签到 | 5 ~ 50 | 根据会员等级递增 |
| 连续 7 日签到 | +50% | 额外连签奖励加成 |

| 消费用途 | 价格 (星尘) | 换算 |
|----------|-------------|------|
| 🌸 樱花头像框 | 300 ~ 800 | ≈ 60 天签到 |
| 🎨 主题皮肤 | 350 ~ 400 | ≈ 70-80 天签到 |
| 😄 表情包 | 200 ~ 250 | ≈ 40-50 天签到 |
| 💎 VIP月卡券 | 5,000 | ≈ 1000 天签到 |

> **设计原则**: 普通用户通过签到可在 2-3 个月内获得基础装饰，鼓励长期活跃。

#### 👑 会员等级

| 等级 | 月费 | 权益 |
|------|------|------|
| 🆓 免费用户 | ¥0 | 基础功能全开放 |
| ⭐ VIP | ¥19.9/月 | 去广告 + AI 100次/天 + 积分 ×2 倍 |
| 👑 SVIP | ¥39.9/月 | AI 无限次 + 积分 ×3 倍 + 全部专属特权 |

</details>

<details open>
<summary><strong>4. 🎛️ 后台管理系统 (Project: MAGI)</strong></summary>

| 功能 | 状态 | 描述 |
|------|:----:|------|
| 仪表盘 | ✅ | NERV 风格指挥中心，RPG 状态卡片 |
| 流量分析 | ✅ | TrafficRadar 实时流量可视化 |
| 内容管理 | ✅ | 文章/番剧/图库/标签 CRUD |
| 评论管理 | ✅ | 评论审核与弹幕管理 |
| 缓存清理 | ✅ | 一键清理 KV 缓存 |
| 上帝模式枢纽 | ✅ | 万能数据篡改中心（资产/流量/评论/全局统计） |

</details>

<details open>
<summary><strong>5. 👤 用户系统</strong></summary>

| 功能 | 状态 | 描述 |
|------|:----:|------|
| 注册/登录 | ✅ | 表单验证、邮箱验证码 |
| 忘记密码 | ✅ | 完整的密码重置流程 |
| 用户仪表盘 | ✅ | 个人数据统计 |
| 成就系统 | ✅ | 徽章收集与展示 |
| 每日签到 | ✅ | 积分奖励、连续签到加成 |

</details>

<details open>
<summary><strong>6. 🛡️ 安全保障</strong></summary>

| 措施 | 状态 | 描述 |
|------|:----:|------|
| 支付签名 | ✅ | HMAC-SHA256 验签 |
| 审计日志 | ✅ | 关键操作记录 |
| 2FA 支持 | ✅ | TOTP 双因素认证 |
| 速率限制 | ✅ | API 防刷保护 |
| CSRF 防护 | ✅ | Token 验证拦截器 |

</details>

<details open>
<summary><strong>7. 🎨 视觉设计</strong></summary>

| 特性 | 状态 | 描述 |
|------|:----:|------|
| Glassmorphism | ✅ | 全局深色磨砂玻璃质感 |
| Dynamic Backgrounds | ✅ | 动态流体背景 |
| Responsive | ✅ | 完美适配移动端、平板和桌面端 |
| Live2D | ✅ | 看板娘（桌面端显示，移动端已禁用优化性能） |

</details>

<details open>
<summary><strong>8. ☁️ 部署与架构</strong></summary>

| 组件 | 状态 | 描述 |
|------|:----:|------|
| Cloudflare Workers | ✅ | 边缘计算 SSR 渲染 |
| Cloudflare D1 | ✅ | 分布式 SQL 数据库 |
| Cloudflare R2 | ✅ | 对象存储（图片/媒体） |
| Cloudflare KV | ✅ | 缓存存储 |
| GitHub Actions | ✅ | 自动化 CI/CD 部署流程 |
| Notion 同步 | ✅ | 对接 5 个 Notion 数据库 |

</details>

<details open>
<summary><strong>9. 🤖 AI 智能引擎</strong></summary>

| 功能 | 状态 | 描述 |
|------|:----:|------|
| AI 聊天 | ✅ | 智能对话助手 |
| AI 摘要 | ✅ | 内容自动摘要生成 |
| AI 写作 | ✅ | 辅助内容创作 |
| AI 审核 | ✅ | 内容安全过滤 |
| AI SEO | ✅ | SEO 优化建议生成 |
| AI 标签 | ✅ | 智能打标签 |
| AI 搜索 | ✅ | 增强语义搜索 |
| AI 推荐 | ✅ | 个性化内容推荐 |

</details>

<details open>
<summary><strong>10. 🎮 游戏化系统</strong></summary>

| 功能 | 状态 | 描述 |
|------|:----:|------|
| 抽卡系统 (Gacha) | ✅ | 扭蛋机概率抽取 |
| 每日任务 | ✅ | 任务系统与奖励 |
| 成就徽章 | ✅ | 六边形成就展示 |
| 经验等级 | ✅ | 用户成长体系 |
| 签到系统 | ✅ | 连续签到奖励 |

</details>

<details open>
<summary><strong>11. ✨ 特色 UI 效果</strong></summary>

| 效果 | 状态 | 描述 |
|------|:----:|------|
| Live2D 看板娘 | ✅ | 二次元角色互动 |
| 玻璃态设计 | ✅ | 极光玻璃态 UI |
| 音乐播放器 | ✅ | 全屏/迷你播放器 |
| 弹幕系统 | ✅ | Danmaku 弹幕 |
| 樱花粒子 | ✅ | 动态背景特效 |
| Omni Command | ✅ | 全局命令面板 |
| 彩蛋系统 | ✅ | Konami Code 等彩蛋 |
| 主题切换 | ✅ | 深色/浅色模式 |

</details>

---

### 🚧 待完成功能

- [ ] 接入真实支付提供商并完成独立沙箱验收（当前保留 Mock 钱包流程）
- [ ] 为生产支付、上传、注册和资产链路建立隔离测试账号的定期冒烟流程
- [ ] 使用 Durable Objects 或 D1 outbox 完成跨 Worker isolate 的严格串行化
- [ ] 完成生产恢复演练、Cloudflare 边缘响应头对齐和浏览器 FPS 基准记录
- [ ] 番剧评分短评展示与更多彩蛋交互

---

## 📅 更新日志 (Changelog)

<details open>
<summary><strong>🚀 2026-08-03 — 生产安全、数据一致性与发布工程化</strong></summary>

**生产链路加固:**
- 💳 **支付交付幂等化**：支付回调使用 D1 条件写入与唯一交付记录作为 exactly-once 边界，重复回调不会重复发放；失败订单允许经过签名和金额校验的晚到成功回调重试结算。
- 🛒 **商城与抽卡一致性**：余额、库存、订单、抽卡结果和资产流水进入受控的 D1 批处理，补充订单号/请求幂等校验，避免重复扣款、超卖和扣费后不发奖。
- 📦 **上传配额治理**：R2 上传增加 D1 配额预留、并发竞争保护、频率限制、失败补偿和审计记录，避免对象存储与数据库状态长期漂移。
- 🔐 **认证会话闭环**：登录失败限流按账号/IP 原子计数，成功后可恢复；改密与重置密码撤销既有会话，Cookie 解析、CSRF、TOTP 和 Bearer 认证边界进一步收紧。

**数据库与发布工程:**
- 🧱 **生产 D1 readiness gate**：部署前只读校验表、字段、索引、通知约束和外键完整性；迁移清单采用增量、可重复执行的策略，阻止破坏性 schema 变更进入生产。
- 🧭 **Repository 边界收敛**：生产 SQL 统一进入 repository 层，核心查询改为显式字段投影，`SELECT *` 和 API/Service 直连 D1 会被自动检查拦截。
- 🧪 **质量门禁完整化**：`typecheck`、生产构建、数据库安全校验、readiness、全量 Vitest 和 `npm audit` 纳入发布前验证；当前 122 个测试文件、505 项测试全绿，审计结果为 0 漏洞。
- ☁️ **主 Worker 正式发布**：`my-anime-blog` 已通过 production 配置校验并接管主域 100% 流量，发布后完成公开路由、readiness、CSP 和认证边界的只读验收。

**体验与运行时优化:**
- 🎵 **播放器时间轴兼容**：歌词时间戳支持标准 LRC、小时格式和增强格式，非法时间会被忽略，减少歌曲切换后歌词与进度不同步。
- ⚙️ **动画生命周期治理**：无交互时停止多余 RAF 调度，组件卸载时取消动画帧，降低首页空闲 CPU 占用和长期运行的资源泄漏风险。
- 🧵 **Worker 请求隔离**：Cron 和请求处理使用当前调用上下文，不再依赖 isolate 级可变请求环境，避免复用实例造成上下文串扰。

**主要实现位置:** `app/repositories/payment-delivery.repository.ts`、`app/repositories/upload-reservation.repository.ts`、`app/hooks/useMusicPlayer.ts`、`app/components/ui/animations/FluidTrail.tsx`、`workers/app.ts`。

**已知边界:**
- 真实支付服务商仍需单独接入和验收，当前支付页面保留 Mock 流程。
- 严格跨 isolate 的支付串行化仍需 Durable Objects 或 D1 outbox；当前以 D1 条件写入和唯一约束作为资金安全边界。
- Cloudflare 边缘响应头规则、生产恢复演练、真实业务账号的上传/支付冒烟和浏览器 FPS 还需要单独的运维窗口验证。

</details>

<details>
<summary><strong>🛡️ 2026-07-19 — 2026-07-31 — 生产基线、依赖安全与认证治理</strong></summary>

**生产发布基线:**
- ☁️ **部署目标固定**：production 构建明确生成 `my-anime-blog`，避免 `--env production` 误解析为另一个 Worker；部署前增加 Worker 名称、环境变量和远程 D1 绑定校验。
- 🧱 **D1 增量迁移治理**：迁移清单、重复执行检查、外键检查和生产 readiness gate 形成闭环；历史不兼容的 `migrations/0006_mission_system.sql` 保留为退役记录，不直接重放旧任务种子。
- ⏱️ **定时任务可观测**：部署 `fetch` 与 `scheduled` handlers，订单过期状态机和 KV 心跳经过生产只读验收。

**依赖与认证安全:**
- 🔄 升级 React 19.2、React Router 8.3、Wrangler 4.116 和 Cloudflare Vite 插件 1.47，移除未使用的 Cloudflare 适配依赖；`npm ci` 可复现安装。
- 🔐 登录失败限流改为 D1 原子计数，覆盖 IP、账号和邮箱维度；密码重置、后台改密、会话撤销和 CSRF 形成完整闭环。
- 📝 Notion 同步改为管理员 CSRF 保护的 POST，增加超时、分页上限、游标保护和失败时保留权威快照的边界；AI 配置增加运行时校验。
- 🧪 生产发布前固定执行 `typecheck`、全量测试、生产构建、`db:validate`、`deploy:readiness`、`deploy:dry-run` 和 `npm audit`。

**发布证据:**
- 2026-07-21 完成一次生产增量迁移和 Worker 发布，D1/KV/R2/AI/Analytics/Assets 绑定及四条 Cron 通过验收。
- 2026-07-31 完成依赖升级、认证迁移和移动端播放器避让发布；桌面播放器展开、全屏、移动端和切歌联动的生产浏览器检查无控制台错误。

**主要实现位置:** `wrangler.jsonc`、`scripts/check-production-d1-readiness.mjs`、`database/migration-manifest.json`、`app/services/auth.server.ts`、`app/services/notion-sync.server.ts`。

</details>

<details>
<summary><strong>🎮 2026-04-25 — 2026-04-26 — 会员经济、架构拆分与播放器迭代</strong></summary>

**功能与体验:**
- 🎁 **签到与星尘经济**：补签、连续签到、任务奖励和星尘流水进入独立服务与 repository，补充签到记录和任务迁移。
- 🌗 **主题切换修复**：深浅色切换同步 DOM class，并通过统一的主题 Provider 处理过渡状态。
- 🎵 **移动端播放器重做**：重新设计移动端播放器布局和交互，处理播放器、底部导航与 AI 入口的避让关系；后续生产检查覆盖展开、全屏和切歌联动。

**架构与稳定性:**
- 🧩 **前后端分层**：将路由中的职责拆分为 `app/api`、`app/pages`、`app/services`、`app/repositories`，让页面负责渲染与编排，数据访问集中到 repository。
- 🛠️ **后台回归修复**：修复首页播放器配置越界、商城后台编辑句柄和后台登录路由隔离问题，补齐全站 Toast/Modal 交互。
- 🛡️ **CSP 与 SSR 稳定性**：补齐音乐源站连接策略，修复 `OptimizedImage` hydration mismatch，并保留 nonce CSP 生成链路。
- ✅ **工程质量收敛**：全站原生 `confirm()`/`alert()` 逐步替换为统一 Modal/Toast，补齐编辑器和路由上下文类型，`npm run typecheck` 达到 0 错误。

**主要实现位置:** `app/routes.ts`、`app/services/membership/makeup-signin.server.ts`、`app/components/ui/media/MusicPlayerMobile.tsx`、`app/entry.server.tsx`。

**对应提交:** `ddda45b`、`e66c409`、`4abde68`、`0d86cac`、`4d1abe1`、`85057b5`。

</details>

<details>
<summary><strong>🔒 2026-04-17 — P0 安全修复与会员数据模型补全</strong></summary>

- 🔐 收紧注册、登录、找回密码、Markdown/Notion 编辑器和外部图片等输入边界，清理不应进入公开仓库的配置内容。
- 👥 补全会员等级、订阅、支付、星尘、商城、任务、权限和用户会员关系等 D1 表及增量迁移。
- 🧱 将会员核心逻辑集中到 `app/services/membership/`，后台权限判断统一复用 permission helpers，避免各页面自行拼接权限规则。
- 📜 增加法律与隐私相关页面，完善会员、支付和用户数据处理的产品边界说明。

**主要实现位置:** `app/services/membership/membership.server.ts`、`app/utils/permissions.ts`、`database/migration_005_user_missions.sql`、`database/migration_006_user_memberships.sql`。

**对应提交:** `abe5330`、`8b59fcd`。

</details>

<details open>
<summary><strong>✨ v1.6.0 (2026-04-08) — 架构升级与 AI 深度集成</strong></summary>

**核心更新:**
- 🤖 **AI 智能引擎全功能上线**: 聊天、摘要、写作、审核、SEO、标签、搜索、推荐八大功能
- 📝 **Notion 深度同步**: 对接全部 5 个 Notion 数据库，实现内容双向同步
- 🔒 **安全强化**: 清理开源代码中的敏感信息泄露，强化支付签名与 CSRF 防护

**UI/UX 进化:**
- 🎨 **玻璃态设计全面升级**: 极光玻璃态 UI 风格统一
- 🎵 **音乐播放器重构**: 全屏/迷你/移动端三版本适配
- ✨ **动画系统增强**: FluidTrail、PageTransition 页面过渡效果
- 🖼️ **图片加载优化**: OptimizedImage 组件性能提升

**新增功能:**
- 🎮 **游戏化系统**: Gacha 抽卡、每日任务、成就徽章
- 💬 **评论系统升级**: CommentsSection 组件重构，支持嵌套评论
- 🌐 **国际化支持**: i18n 国际化框架
- 📊 **性能监控**: 动画性能优化组件

**技术优化:**
- ⚡ **数据库迁移**: 性能索引、标签分类、Notion 同步
- 🔧 **云存储管理**: R2 管理器服务增强
- 💾 **缓存优化**: Cloudflare 缓存服务重构
- 📝 **日志系统**: 统一日志工具 logger.ts

**新增数据库迁移:**
- `migration_005_performance_indexes.sql` - 性能索引优化
- `migration_006_membership_shop_if_missing.sql` - 会员商城表（可重复执行）
- `migration_007_tags_and_categories.sql` - 标签分类系统
- `migration_008_notion_sync.sql` - Notion 同步表
- `schema_membership.sql` - 完整会员系统表（会员、订阅、支付、积分、商城、任务等 19 表）

**本地开发数据库:**
- 已创建本地 D1 数据库 `anime-db-local`（绑定: `anime_db_local`）
- 所有迁移已在本地测试通过
- 详细说明见 `database/PENDING_MIGRATIONS.md`

**对应提交:** `b2a995a`、`44f1984`、`e60f276`。

</details>

<details>
<summary><strong>🌌 v1.5.0 (2026-02-22) — 万能控制枢纽 (God Mode)</strong></summary>

**上帝视角管理套件:**
- 🛡️ **万能控制枢纽 (Universal Admin Control Hub)**:
  - **资产干预**: 物理级修正用户等级、经验、金币余额。
  - **内容操纵**: 文章阅读量与点赞数手动注入数据。
  - **交互改写**: 评论文本深度编辑、作者元数据伪造、一键物理抹除。
  - **全局篡改**: 注入全站 PV/UV 偏移量，模拟实时在线人数波动区间。
- 🕹️ **RPG 游戏化增强**: 完善 Mission、Shop、Membership 等模块的后台原子级控制。
- 📊 **上帝监控墙**: 后台首页集成实时“数据伪造”监控指标对比。

**核心修复:**
- 🔧 修复 `admin.articles.tsx` 的 Fetcher 定义域错误。
- 🔧 统一全站管理模块的玻璃质感设计语言。

</details>

<details>
<summary><strong>🏗️ v1.4.0 (2025-02-21) — 架构解耦大重构</strong></summary>

**工程架构:**
- 🏗️ **全栈前后端物理解耦**: 将 `app/routes/` 中混杂的 70+ 文件按领域驱动设计拆分为 `app/api/` (后端) 与 `app/pages/` (前端视图) 两大独立域
- 📂 **后端 API 分域**: `api/auth/`, `api/ai/`, `api/payment/`, `api/admin/`, `api/user/`, `api/bangumi/`, `api/wallet/`, `api/misc/`
- 📂 **前端视图分域**: `pages/admin/`, `pages/user/`, `pages/public/`, `pages/auth/`, `pages/legal/`, `pages/error/`
- 🧹 **根目录大扫除**: 清除数十个历史构建日志、临时 SQL 脚本、脱机数据快照

**管理后台:**
- 🔧 修复 500 白屏崩溃 (CommentManager 幽灵引用导致的 SSR 致命错误)
- 📊 Admin Dashboard 接入真实数据库统计 (文章数/评论数/访问量/待审评论)
- 🎯 CSRF Token 校验链路修复，所有后台 POST 操作恢复正常

</details>

<details>
<summary><strong>🎨 v1.3.0 (2024-12-26) — UI/UX 重构</strong></summary>

**UI/UX 重构:**

- ✨ **音乐播放器**: 全平台适配版 Glassmorphism 风格
  - 桌面端：左下角黑胶唱片悬浮球，展开毛玻璃胶囊
  - 移动端：右下角悬浮球 + 底部弹窗 (Bottom Sheet)
  - 自动适配深色/浅色模式
- ✨ **导航栏**: iOS 液体玻璃风格 (Liquid Glassmorphism)
  - 极强背景高斯模糊 (`backdrop-blur-xl`)
  - 导航项切换时高亮胶囊液体流动动画
  - 半透明边框增加精致感
- 🎨 **页面切换动画**: EyeCatch 转场遮罩优化

**性能优化:**
- 🚀 脚本加载优化：Promise 链式加载 APlayer/MetingJS

</details>

<details>
<summary><strong>💎 v1.2.0 (2024-12-23) — 会员与经济系统</strong></summary>

**新增功能:**
- ✨ **会员系统**: 三级会员 (免费/VIP/SVIP)，权益差异化
- ✨ **积分系统**: 星尘虚拟货币，签到、消费、记录
- ✨ **每日签到**: 连续签到奖励，会员积分加成
- ✨ **积分商城**: 头像框、主题、表情、徽章兑换
- ✨ **支付系统**: Mock 支付流程，订单管理
- ✨ **法律页面**: 隐私政策、用户协议、赞助条款

**后台增强:**
- 🎛️ 数据库迁移: 会员系统表结构 (19 表)
- 🎛️ 安全服务: 支付签名、审计日志、2FA

**性能优化:**
- 🚀 Live2D 优化: 移动端禁用，延迟加载 5s
- 🚀 RSS/Atom 修复: 类型错误修复

</details>

<details>
<summary><strong>⚡ v1.1.0 (2024-12-18) — 社区互动功能</strong></summary>

**新增功能:**
- ✨ **评论系统**: 完整评论功能，弹幕模式
- ✨ **图片上传**: 编辑器内拖拽上传图片至 R2
- ✨ **SEO 优化**: sitemap.xml、JSON-LD、OG 图片
- ✨ **用户仪表盘**: 个人数据统计页面
- ✨ **成就系统**: 徽章收集与展示

</details>

---

## 🚀 快速开始 (Quick Start)

### 1. 环境准备

```bash
# Node.js >= 22, Git
git clone https://github.com/AincFh/my-anime-blog.git
cd my-anime-blog
npm ci
```

### 2. Cloudflare 配置

```bash
npx wrangler login
npx wrangler d1 create anime-db
# 将 database_id 填入 wrangler.jsonc
```

### 3. 本地数据库初始化

`schema.sql`、`schema_membership.sql` 和 seed 文件仅用于本地或全新隔离数据库，禁止直接用于已有生产数据库。

```bash
# 核心表
npx wrangler d1 execute anime_db --local --file=database/schema.sql -y

# 会员系统表
npx wrangler d1 execute anime_db --local --file=database/schema_membership.sql -y

# 初始数据
npx wrangler d1 execute anime_db --local --file=database/seed.sql -y
```

生产数据库只允许在备份、独立 Preview 预演、迁移审查和明确授权后执行增量 migration；不得执行 schema 或 seed 文件。

### 4. 本地开发 & 部署

```bash
npm run dev        # 本地开发
npm run typecheck  # 生成 Cloudflare 类型并执行 TypeScript 检查
npm test -- --run  # 全量测试
npm run db:validate # 迁移、repository 边界与本地 D1 安全检查
npm run build:production # 生产环境构建与 Worker 目标校验
npm run deploy:dry-run   # 生产配置与上传包本地预检，不执行部署
npm run deploy           # 正式部署（必须获得明确生产授权）
```

生产构建必须使用项目脚本生成并校验 `env.production` 配置；不得直接部署普通 `npm run build` 的产物。完整门禁、数据库准备和回滚流程见 `docs/DEPLOYMENT.md`。

---

## 📂 项目结构

```
my-anime-blog/
├── app/
│   ├── api/                  # ⚙️ 后端服务层 (Server-Only)
│   │   ├── admin/            #    管理后台 API
│   │   ├── ai/               #    AI 智能引擎接口
│   │   ├── auth/             #    认证与令牌服务
│   │   ├── bangumi/          #    番剧外部数据代理
│   │   ├── comments/         #    评论治理
│   │   ├── payment/          #    支付回调与订单
│   │   ├── user/             #    用户数据接口
│   │   ├── wallet/           #    钱包管道
│   │   └── misc/             #    图床/OG/主题等杂项
│   ├── pages/                # 🖥️ 前端视图层 (UI Rendering)
│   │   ├── admin/            #    CMS 后台管理视图
│   │   ├── auth/             #    登录/注册界面
│   │   ├── error/            #    404 等错误页
│   │   ├── legal/            #    法律条款页面
│   │   ├── public/           #    首页/文章/番剧/图库等
│   │   └── user/             #    用户中心/背包/商城
│   ├── components/           # 🧩 可复用组件库
│   ├── services/             # 🔌 核心服务层
│   │   ├── membership/       #    会员服务 (tier, subscription, coins)
│   │   ├── payment/          #    支付服务 (gateway, mock, signature)
│   │   └── security/         #    安全服务 (audit, totp, csrf)
│   ├── repositories/         # 🗄️ D1/KV/R2 数据访问层
│   ├── types/                # 📐 运行时与 DTO 类型定义
│   ├── styles/               # 🎨 全局样式与设计令牌
│   ├── utils/                # 🛠️ 工具函数
│   └── routes.ts             # 🗺️ 统一路由映射中心
├── database/                 # 💾 SQL 文件
│   ├── schema.sql            #    核心表
│   ├── schema_membership.sql #    会员系统表
│   ├── seed.sql              #    初始数据
│   └── migration_*.sql       #    增量、可重复执行的迁移
├── scripts/                  # 🔧 构建、迁移与发布门禁脚本
├── workers/                  # ☁️ Cloudflare Worker 入口
├── docs/                     # 📚 部署、恢复与生产状态记录
├── public/                   # 📦 静态资源
└── wrangler.jsonc            # ⚙️ Cloudflare 环境与绑定配置
```

---

## 🧬 技术栈 (Tech Stack)

<p align="center">
  <br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,cloudflare,sqlite,tailwind,nodejs,ts,js,html,css,git,github,githubactions&perline=12" alt="技术栈图标阵列" />
  </a>
  <br/><br/>
</p>

| 类别 | 技术 | 用途 |
|------|------|------|
| **Framework** | React Router v8.3 (Remix) | 全栈 SSR 框架 |
| **Runtime** | Cloudflare Workers | 边缘计算 Serverless |
| **Database** | Cloudflare D1 (SQLite) | 分布式关系型数据库 |
| **Storage** | Cloudflare R2 | 对象存储（图片/媒体） |
| **Cache** | Cloudflare KV | 内存级缓存 |
| **Styling** | Tailwind CSS v4 | 原子化 CSS |
| **Animation** | Framer Motion | 物理动画引擎 |
| **Icons** | Lucide React | 图标库 |
| **AI** | Deepseek / Workers AI | 智能内容生成与审核 |
| **Build & QA** | Vite 7.3、Wrangler 4.116、Vitest 3.2、TypeScript 5.9 | 构建、类型检查、测试与发布门禁 |

---

## 📄 License

```
MIT License © 2024-2026 Project A.T. Field (绝对领域)
```

<p align="center">
  <sub>
    Built with ♥ and ☕ on the edge of Cloudflare.
  </sub>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=8B5CF6&height=120&section=footer" width="100%" />
</p>
