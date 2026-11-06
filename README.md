# 華語導遊筆試練習

使用 React、TypeScript、Vite 與 Tailwind CSS 建立的純前端練習網站。
題庫 JSON 隨網站打包，不需要後端 API、資料庫或環境變數。
作答暫存使用 localStorage，不會跨裝置或網域同步。

## 本機開發

使用 Node.js 24（版本指定於 `.nvmrc`）。

```sh
npm ci
npm run dev
```

正式建置與預覽：

```sh
npm run build
npm run preview
```

建置輸出位於 `dist/`。

## Cloudflare Pages

連接 Git 儲存庫後，使用以下設定：

| 設定 | 值 |
| --- | --- |
| Framework preset | React (Vite) |
| Root directory | 儲存庫根目錄 |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | 24，由 `.nvmrc` 指定 |

Pages 會安裝依賴。若控制台另設 `NODE_VERSION`，請與 `.nvmrc` 保持一致。
本專案的 `wrangler.jsonc` 供 Workers 使用，Pages 請使用上述控制台設定。

網站使用 BrowserRouter。Pages 在沒有頂層 `404.html` 時，會自動回傳
`index.html` 支援 `/setup`、`/exam`、`/result` 等前端路由，目前不需要 `_redirects`。

參考：[建置設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)、
[SPA 路由](https://developers.cloudflare.com/pages/configuration/serving-pages/)。

## Cloudflare Workers

`wrangler.jsonc` 已指定靜態檔案目錄 `dist` 與 SPA fallback。
若使用 Workers Git 自動部署，設定：

| 設定 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `tourguidetest`，需與 `wrangler.jsonc` 一致 |

也可以在本機建置後登入 Cloudflare 並部署：

```sh
npm ci
npm run build
npx wrangler login
npx wrangler deploy
```

參考：[Workers SPA 設定](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)。

## 部署前確認

- Git 自動部署需要先提交並推送程式碼、題庫、`public/`、`package.json`、
  `package-lock.json`、`.nvmrc` 及相關配置檔。
- `node_modules/`、`dist/`、`.wrangler/` 與下載的 PDF 不納入版本控制。
- 部署後直接開啟及重新整理 `/setup`，確認前端路由正常。
- `/exam` 與 `/result` 需要操作流程傳入的狀態；直接開啟時可能導回設定頁，
  這是應用程式行為。

## 更新題庫

題庫位於 `src/data/exams/`。以下是維護題庫的工具，不必在 Cloudflare 建置時執行：

```sh
npm run download-pdfs
npm run parse-exams
npm run validate-exams
```

更新後請將產生的題庫 JSON 一起提交。
