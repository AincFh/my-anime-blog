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
  <img src="https://img.shields.io/badge/Framework-React_Router_v7-blue?style=flat-square&logo=react" />
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

</details>

---

### 🚧 待完成功能

- [ ] 钱包系统 — 充值虚拟货币（支持，不退款）
- [ ] 番剧评分短评展示
- [ ] 更多彩蛋交互

---

## 📅 更新日志 (Changelog)

<details open>
<summary><strong>✨ v1.5.1 (2026-02-22) — 全局交互体验重构 & 上帝模式完备</strong></summary>

**更新内容 & 新玩法:**
- 🛡️ **上帝模式参数阵列补完**: 万能控制枢纽增强，完整注入了针对 PV 偏移量、注册人数劫持、以及实时在线人数上下限的模拟，真正做到指哪打哪的全域数据拟态。

**体验优化:**
- 🎨 **全局交互视觉统一 (UI/UX PRO MAX)**: 
  - 彻底抹除原生浏览器打断式警告。全站（前台商城、后台图库、清理策略、编辑器等）的原生 `confirm()` 和 `alert()` 已被高斯模糊风格的 `confirmModal` 和无感流光 `Toast` 完美取代。
- ⚡ **TypeScript 类型链极度严苛**: 修复补全了全部遗漏的依赖（如 Tiptap 编辑器）及上下文属性生命树，达成 `npm run typecheck` 零错误金刚不坏之躯。

**核心修复:**
- 🔧 **回归修复**: 解决 `admin.tsx` 中 `musicPlaylistId` 变量越界导致的首页 500 万能白屏崩溃。
- 🔧 **句柄修正**: 修复商店后台编辑函数 `setEditingMission` 绑定错误。
- 🔧 **路由隔离**: 阻断 `/panel/login` 错误加载前台组件导致的持续 401 Unauthorized 无效请求。

**接下来的方向:**
- 🚀 **1:1 迭代换新内容**: 持续向着更加沉浸、动态丰富的次元生态演进，一比一对齐顶尖应用交互，带来更硬核的玩法与视觉重塑。

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
# Node.js >= 20, Git
git clone <your-repo-url>
cd my-anime-blog
npm install
```

### 2. Cloudflare 配置

```bash
npx wrangler login
npx wrangler d1 create anime-db
# 将 database_id 填入 wrangler.jsonc
```

### 3. 数据库初始化

```bash
# 核心表
npx wrangler d1 execute anime-db --remote --file=database/schema.sql -y

# 会员系统表
npx wrangler d1 execute anime-db --remote --file=database/schema_membership.sql -y

# 初始数据
npx wrangler d1 execute anime-db --remote --file=database/seed.sql -y
```

### 4. 本地开发 & 部署

```bash
npm run dev        # 本地开发
npm run deploy     # 正式部署
```

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
│   ├── utils/                # 🛠️ 工具函数
│   └── routes.ts             # 🗺️ 统一路由映射中心
├── database/                 # 💾 SQL 文件
│   ├── schema.sql            #    核心表
│   ├── schema_membership.sql #    会员系统表
│   ├── seed.sql              #    初始数据
│   └── scripts/              #    迁移与运维脚本
└── public/                   # 📦 静态资源
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
| **Framework** | React Router v7 (Remix) | 全栈 SSR 框架 |
| **Runtime** | Cloudflare Workers | 边缘计算 Serverless |
| **Database** | Cloudflare D1 (SQLite) | 分布式关系型数据库 |
| **Storage** | Cloudflare R2 | 对象存储（图片/媒体） |
| **Cache** | Cloudflare KV | 内存级缓存 |
| **Styling** | Tailwind CSS v4 | 原子化 CSS |
| **Animation** | Framer Motion | 物理动画引擎 |
| **Icons** | Lucide React | 图标库 |
| **AI** | Deepseek / Workers AI | 智能内容生成与审核 |

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