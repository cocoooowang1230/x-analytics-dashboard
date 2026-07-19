# XPulse Analytics Dashboard

CMO 級別的 X/Twitter 數據觀測平台

## 功能
- 📊 Followers / Posts / Likes / Retweets 完整儀表板
- 📈 粉絲成長趨勢分析
- 💬 互動數據分析（Likes、Retweets、Replies、Bookmarks）
- 📝 貼文表現排行
- 👥 受眾洞察
- 🏆 競品比較
- 🔥 互動熱力圖

## 技術棧
- Pure HTML / CSS / JavaScript
- Chart.js 4.4.0
- Google Fonts (Inter + Space Grotesk)

## 部署
透過 Vercel 自動部署，每次 push 到 GitHub 自動更新。

## 資料更新

每日更新會執行 `scraper/fetch.js`，把公開 X/Twitter 帳號摘要寫入
`data.json`。寫檔流程會先建立暫存檔再替換正式檔案，避免中途失敗時留下
不完整 JSON。

如需匯入 [Xquik](https://github.com/Xquik-dev/x-twitter-scraper) 匯出的貼文資料，可使用範例檔驗證流程：

```bash
cd scraper
node import-xquik.js xquik-sample.json
```

也可以把 Xquik 匯出路徑交給環境變數：

```bash
cd scraper
XQUIK_EXPORT_PATH=../exports/xquik-tweets.json npm run import:xquik
```

匯入器會把 likes、retweets、replies、bookmarks、impressions 與貼文數量
彙總到 `data.json` 的 `xquik` 欄位。請只提交清理過的公開摘要，不要把 API
keys、cookie、原始使用者匯出或私有客戶資料提交到 repository。

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
