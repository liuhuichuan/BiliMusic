# BiliMusic

一个使用 Vue 3、TypeScript 和 Tauri 2 编写的音乐榜单练习项目。页面展示酷狗公开接口中的新歌榜、综合榜和分类榜单，并支持解析可用音源进行播放。

## 技术分工

- **Vue**：页面、交互和播放器界面。
- **TypeScript**：约束歌曲、榜单和接口返回值的数据结构。
- **Rust / Tauri**：桌面端和 Android 端的应用外壳，以及受限的网络请求代理。
- **CSS**：组件样式和响应式布局，没有引入额外 UI 框架。

浏览器开发时，请求由 Vite 代理转发；运行 Tauri 应用时，请求通过 `src-tauri/src/lib.rs` 中的 `fetch_kugou` 命令转发。两种环境共用同一套 Vue 业务代码。

## 推荐阅读顺序

如果你正在学习 Vue，建议按下面的顺序阅读：

1. `src/types/music.ts`：先认识应用里的数据模型。
2. `src/constants/music.ts`：了解榜单分类和歌曲版权状态。
3. `src/services/kugou.ts`：学习如何请求接口，并把原始返回值转换成页面需要的数据。
4. `src/composables/useMusicCatalog.ts`：学习列表的加载、错误和刷新状态。
5. `src/composables/useRankBrowser.ts`：学习筛选、缓存、分页和 `watch`。
6. `src/components/SongList.vue`：从简单的“数据输入、事件输出”组件开始。
7. `src/components/NewSongsView.vue` 和 `src/components/RankingsView.vue`：学习页面如何组合小组件。
8. `src/composables/usePlayer.ts` 与 `src/components/PlayerBar.vue`：最后再看播放队列和原生 `<audio>` 控制。
9. `src/App.vue`：它只负责把页面、状态和事件装配在一起。
10. `src-tauri/src/lib.rs`：理解 Vue 如何通过 Tauri 调用 Rust。

## 目录结构

```text
src/
├─ components/       # 展示和用户交互
│  └─ rankings/      # 排行榜页面的子组件
├─ composables/      # 可复用的响应式状态和业务流程
├─ constants/        # 枚举、标签等固定业务含义
├─ services/         # 接口请求与返回值转换
├─ styles/           # 已按组件拆出的样式
├─ types/            # TypeScript 数据模型
├─ utils/            # 无状态的通用小函数
└─ App.vue           # 应用装配层
```

这里刻意没有引入 Pinia。当前状态规模较小，先掌握 `ref`、`computed`、`watch` 和 composable，会比一开始增加状态管理框架更容易理解。

## 本地运行

```powershell
npm install
npm run dev
```

构建前端：

```powershell
npm run build
```

运行桌面端：

```powershell
npm run tauri dev
```

运行 Android 开发版前，需要先安装并配置 Android Studio、SDK、NDK、Java 和 Rust Android targets：

```powershell
npm run tauri android dev
```

## 数据流

```text
页面组件
   ↓ 调用
composable（状态与业务流程）
   ↓ 调用
service（请求与数据转换）
   ↓
Vite 开发代理 或 Tauri/Rust 命令
   ↓
酷狗公开接口
```

接口字段可能随服务方调整；项目中的 `RawSong`、`RawRank` 等类型表示原始返回值，`Song`、`Rank` 等类型表示清洗后供 UI 使用的数据。把这两层分开，可以避免接口细节散落在组件中。
