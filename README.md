# Beyblade Cup Score Tracker

Beyblade X 賽事計分 Web App（行動優先、深色競技風格、LocalStorage 儲存）。

## 技術棧

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

## 功能摘要

- **單日賽事**：記錄同一天的多場比賽／杯賽
- **自動命名**：`[時間][地點]杯`，重複時自動加 `2`、`3`…
- **計分模式**：先達 4 / 7 / 10 分，或無上限
- **1v1** 與 **多人循環賽**（兩兩對戰，總分最高獲勝）
- **戰刃設定**：每位選手 3 組，含 Beyblade X 部件欄位與出戰順序
- **即時計分**：Spin / Burst / Over / Xtreme / 碰對手前出界（重賽）

## 開始使用

```bash
cd beyblade-cup-score-tracker
npm install
npm run dev
```

在瀏覽器開啟 [http://localhost:3000](http://localhost:3000)。

首次使用可在首頁點「載入範例資料」查看示範比賽。

## 專案結構

```
src/
  app/                 # 頁面路由
  components/          # UI 與比賽元件
  hooks/useAppData.ts  # LocalStorage 狀態
  lib/                 # 計分、配對、儲存邏輯
  types/               # TypeScript 資料模型
```

## 資料儲存與多人同步

- **未設定 Supabase**：資料僅存在各使用者瀏覽器 `localStorage`（鍵名 `beyblade-cup-score-tracker-v1`），無法與他人同步。
- **已設定 Supabase**：全 App 共用雲端單表 `app_global`，支援即時同步與「重新同步」合併。

### 設定 Supabase（部署必做）

1. [Supabase](https://supabase.com/dashboard) 建立專案，在 SQL Editor 執行 `supabase/schema.sql`。
2. Project Settings → API，複製 **Project URL** 與 **anon public** key。
3. [Vercel](https://vercel.com/dashboard) 本專案 → **Settings → Environment Variables**：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 選填 `RINGO_BOOTSTRAP_PASSWORD`（管理員初始密碼，勿寫進前端畫面）
4. **Redeploy** 後請所有使用者重新整理；首頁應顯示「雲端同步」而非橘色未設定提示。

本機：複製 `.env.example` 為 `.env.local` 填入上述變數，再執行 `npm run dev`。

## 零件資料（phstudy）

戰刃設定頁的配件欄位支援從 [beyblade.phstudy.org](https://beyblade.phstudy.org/index.html) 搜尋選取：

- 伺服器透過 `/api/parts-catalog` 代理讀取 `data/main.json` 與 `data/hardcoded.json`
- 瀏覽器會快取精簡目錄 7 天（`beyblade-phstudy-catalog-v1`）
- 欄位對應：鋼鐵戰刃→Blade、固鎖輪盤→Ratchet、軸心→Bit、紋章鎖→LockChip、主要／超越／金屬／輔助戰刃→對應分類

選定零件後可點「在 phstudy 圖鑑查看」開啟原站詳情。
