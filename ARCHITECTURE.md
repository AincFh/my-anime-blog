# Project: Blue Sky (碧蓝之空)
## 沉浸式二次元个人终端 · 产品与技术架构白皮书

**文档版本**: V2.0 (Final)  
**项目代号**: A.T. Field (绝对领域)  
**核心愿景**: 打造一个"新海诚"式画风的、基于边缘计算的、永不掉线的二次元数字据点。  
**技术基座**: Cloudflare Ecosystem (Pages + D1 + R2) + React Router v7

---

## 1. 设计哲学 (Design Philosophy)

本项目拒绝传统博客"性冷淡"或"黑客风"的刻板印象，核心审美对标 **Kyoto Animation (京阿尼)** 与 **Makoto Shinkai (新海诚)** 的美术风格。

### 1.1 视觉关键词

- **空气感 (Airy)**: 页面必须通透，强调呼吸感，拒绝高密度的信息堆叠
- **高饱和 (Vibrant)**: 使用天空蓝、樱花粉、夕阳橙等高亮色调，模拟自然光照
- **拟态 (Glass)**: UI 材质为"牛奶玻璃" (Milky Glass)，即高透明度的白色磨砂，而非暗色磨砂
- **流动 (Flow)**: 所有交互必须带有物理惯性（弹簧动画），拒绝生硬的切换

### 1.2 核心隐喻

- **首页** = "世界的窗户"（全屏动态风景）
- **文章** = "旅行的日记"（沉浸式阅读）
- **归档** = "时间的卷轴"（非线性时间轴）
- **后台** = "指挥官控制台"（极简、治愈）

---

## 2. 功能架构 (Functional Architecture)

### 2.1 前台系统 (The Client)

#### F1 - 动态壁纸引擎 ✅
- 基于时间的自动切换（早晨是蓝天，傍晚是夕阳，深夜是星空）
- 资源从 R2 对象存储预加载，实现无缝溶解切换
- **实现位置**: `app/components/ui/DynamicBackground.tsx`

#### F2 - 全局无缝播放器 (Persistent Player) ✅
- 利用 SPA (单页应用) 特性，页面跳转时音频流不中断
- 支持歌词 (.lrc) 悬浮显示（待实现）
- 可视化频谱跳动效果
- **实现位置**: `app/components/ui/MusicPlayer.tsx`

#### F3 - 追番/游戏记录 (Otaku Log) ✅
- 独立于 Bangumi/MAL 的私有数据库
- 雷达图评测：动态生成六维图（剧情/作画/音乐/人设/声优/厨力）
- 状态追踪：想看 / 在看 / 已阅 / 弃坑
- **实现位置**: 
  - `app/routes/bangumi.tsx`
  - `app/components/ui/RadarChart.tsx`

#### F4 - 瞬时搜索 (Instant Search) ✅
- Ctrl + K 唤起
- 基于 SQLite FTS5 技术，实现毫秒级全文检索（文章、番剧、评论）
- **实现位置**: `app/components/ui/InstantSearch.tsx`

#### F5 - 沉浸式图库 (Gallery) ✅
- 瀑布流布局
- 拍立得风格展示
- 支持 EXIF 信息读取（待实现）或 Pixiv ID 链接（待实现）
- **实现位置**: `app/routes/gallery.tsx`

#### F6 - 评论/弹幕系统 ✅
- 支持普通评论和弹幕两种模式
- 弹幕从右到左飘过屏幕
- 随机像素头像生成
- **实现位置**: `app/components/ui/Danmaku.tsx`

### 2.2 后台管理系统 (The Admin)

#### A1 - 所见即所得编辑器 ✅
- 支持 Markdown 语法
- 支持拖拽上传图片（自动上传至 R2 并返回链接，待实现R2 API）
- 实时预览二次元渲染效果
- **实现位置**: `app/components/ui/NotionEditor.tsx`

#### A2 - 仪表盘 (Dashboard) ✅
- 展示 PV/UV 趋势（基础实现）
- 展示 R2 流量消耗与 D1 读写次数（待实现）
- **实现位置**: `app/routes/admin.tsx`

#### A3 - 快速发布 (Quick Action)
- 一键发布"说说/动态"（类似 Twitter 的短内容）
- **待实现**

---

## 3. 技术架构选型 (Technical Stack)

### 3.1 前端 (Frontend)

- **框架**: React Router v7 (原 Remix) ✅
  - 支持 SSR (服务端渲染) 对 SEO 友好
  - 同时具备 SPA 的丝滑体验

- **样式**: Tailwind CSS ✅
  - 原子化 CSS，方便实现复杂的玻璃拟态和响应式布局

- **动画**: Framer Motion ✅
  - React 生态最强动画库
  - 负责页面转场、手势交互、滚动视差

### 3.2 后端与运行时 (Backend & Runtime)

- **计算**: Cloudflare Pages (Functions) ✅
  - 代码运行在边缘节点（离用户最近的地方），冷启动极快

- **数据库**: Cloudflare D1 (基于 SQLite) ✅
  - 边缘原生数据库，读写速度极快
  - 支持 SQL 查询，免费额度大
  - 支持 FTS5 全文搜索

- **存储**: Cloudflare R2 ✅
  - 兼容 S3 协议，无出口流量费
  - 对存大量高清图的二次元网站至关重要

---

## 4. 数据模型设计 (Data Schema Strategy)

### 4.1 Articles (文章表) ✅

```sql
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,       -- URL 路径
    title TEXT NOT NULL,             -- 标题
    description TEXT,                -- 摘要
    content TEXT NOT NULL,           -- Markdown 内容
    cover_image TEXT,                -- 封面图 URL (R2)
    category TEXT DEFAULT '随笔',    -- 分类
    mood_color TEXT,                 -- 文章代表色（用于动态主题）
    views INTEGER DEFAULT 0,         -- 阅读量
    created_at INTEGER DEFAULT (unixepoch())
);
```

### 4.2 Animes (番剧/娱乐表) ✅

```sql
CREATE TABLE animes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,             -- 作品名
    cover_url TEXT,                  -- 封面
    status TEXT CHECK(status IN ('watching', 'completed', 'dropped', 'plan')),
    progress TEXT,                   -- 进度 (e.g. "12/24")
    rating INTEGER,                  -- 评分 (1-10)
    rating_radar TEXT,              -- 雷达图数据 (JSON格式)
    review TEXT,                     -- 短评
    created_at INTEGER DEFAULT (unixepoch())
);
```

### 4.3 Comments (评论/弹幕表) ✅

```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,              -- 关联文章ID（可为NULL，表示全局评论）
    author TEXT DEFAULT '匿名',      -- 评论者
    content TEXT NOT NULL,           -- 评论内容
    is_danmaku INTEGER DEFAULT 0,   -- 是否作为弹幕显示 (0/1)
    avatar_style TEXT,               -- 像素头像ID（随机生成）
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
```

### 4.4 FTS5 全文搜索 ✅

```sql
CREATE VIRTUAL TABLE articles_fts USING fts5(
    title, 
    content, 
    content='articles', 
    content_rowid='id'
);
```

---

## 5. 交互与动效规范 (Interaction & Motion Specs)

### 5.1 页面转场 (Transitions) ✅

- **逻辑**: 当前页面内容向下淡出 (Opacity 1->0, Y 0->20px)，新页面内容向上浮出
- **背景**: 背景图保持不动或轻微视差移动，不刷新
- **实现位置**: `app/root.tsx` (AnimatePresence + motion.div)

### 5.2 鼠标交互 (Cursor) ✅

- **默认**: 自定义 SVG 图标（粉色箭头）
- **点击**: 触发 Canvas 粒子爆炸效果（樱花瓣或星星散开）
- **悬停 (Hover)**: 可点击元素要有"磁吸"效果或果冻回弹效果
- **实现位置**: `app/components/ui/CustomCursor.tsx`

### 5.3 滚动体验 (Scroll) ✅

- 使用 CSS `scroll-behavior: smooth` 实现平滑滚动
- 滚动条样式美化：极细、半透明、圆角
- **实现位置**: `app/app.css` (::-webkit-scrollbar)

---

## 6. 开发实施路线 (Implementation Roadmap)

### ✅ Phase 1: 骨架与皮肤 (The Shell) - 已完成

- 搭建 React Router + Tailwind 环境
- 实现 Layout：全屏背景引擎、玻璃拟态容器、导航栏
- 完成首页 UI 和静态的文章列表展示
- **交付物**: 一个只有 UI 但非常好看的静态网站

### ✅ Phase 2: 注入灵魂 (The Data) - 已完成

- 配置 Cloudflare D1 数据库
- 实现后端 Loader：从 D1 读取文章和番剧数据
- 实现简单的后台写入接口
- **交付物**: 可以动态更新内容的动态网站

### ✅ Phase 3: 多媒体增强 (The Media) - 已完成

- 接入 Cloudflare R2（配置完成，待实现上传API）
- 开发图片上传组件（UI完成，待连接R2 API）
- 开发全局音乐播放器组件
- **交付物**: 图文并茂、有 BGM 的完整站点

### 🚧 Phase 4: 究极打磨 (The Polish) - 进行中

- ✅ 增加 Live2D 看板娘（基础实现）
- ✅ 增加全站搜索 (FTS5)
- ✅ 增加评论/弹幕功能
- ⏳ SEO 优化与域名绑定
- ⏳ R2 图片上传 API 实现
- ⏳ 歌词同步功能

---

## 7. 核心文件结构

```
my-anime-blog/
├── app/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── CustomCursor.tsx          # 自定义鼠标指针
│   │   │   ├── DynamicBackground.tsx     # 动态背景引擎
│   │   │   ├── MusicPlayer.tsx            # 全局音乐播放器
│   │   │   ├── InstantSearch.tsx          # 瞬时搜索
│   │   │   ├── NotionEditor.tsx           # Notion风格编辑器
│   │   │   ├── RadarChart.tsx             # 雷达图评测
│   │   │   ├── Danmaku.tsx                # 弹幕组件
│   │   │   └── ...
│   │   └── layouts/
│   │       ├── PublicLayout.tsx           # 前台布局
│   │       └── AdminLayout.tsx            # 后台布局
│   ├── routes/
│   │   ├── home.tsx                       # 首页
│   │   ├── articles.tsx                   # 文章列表
│   │   ├── archive.tsx                    # 归档时间轴
│   │   ├── bangumi.tsx                    # 番剧墙
│   │   ├── gallery.tsx                    # 图库
│   │   └── admin/                         # 后台管理
│   ├── app.css                            # 全局样式
│   └── root.tsx                           # 根组件
├── schema.sql                             # 数据库结构
└── wrangler.jsonc                         # Cloudflare 配置
```

---

## 8. 给开发团队的一句话总结

**"请不要把它当成一个 CMS 系统来开发，请把它当成一个 Web 端的视觉小说 (Visual Novel) 游戏来开发。性能要硬，身段要软。"**

---

## 9. 待实现功能清单

- [ ] R2 图片上传 API 实现
- [ ] 歌词同步功能 (.lrc 文件解析)
- [ ] EXIF 信息读取（摄影作品）
- [ ] Pixiv ID 链接（插画作品）
- [ ] 快速发布"说说/动态"功能
- [ ] PV/UV 统计和 R2 流量监控
- [ ] Live2D 看板娘智能对话增强
- [ ] SEO 优化（Meta 标签、Sitemap）
- [ ] 域名绑定和 HTTPS 配置

---

**最后更新**: 2025-01-28  
**维护者**: Project A.T. Field Team

