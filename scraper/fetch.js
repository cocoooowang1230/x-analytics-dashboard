/**
 * XPulse Daily Scraper - @MYAIPETS
 * 抓取 x.com/MYAIPETS 公開頁面數據，儲存至 ../data.json
 * 由 GitHub Actions 每天自動執行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { writeJsonFile } from './write-json-file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '..', 'data.json');
const TARGET_URL = 'https://x.com/MYAIPETS';

// ── 模擬瀏覽器請求頭 ──────────────────────────────────────
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0',
};

// ── 主要抓取函數 ──────────────────────────────────────────
async function scrapeXProfile() {
  console.log(`[${new Date().toISOString()}] 開始抓取 ${TARGET_URL} ...`);

  const response = await fetch(TARGET_URL, {
    headers: HEADERS,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP 錯誤: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  console.log(`[OK] 頁面抓取成功，大小: ${(html.length / 1024).toFixed(1)} KB`);

  // ── 解析 __INITIAL_STATE__ JSON ───────────────────────
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (!match) {
    throw new Error('找不到 __INITIAL_STATE__，X 可能已封鎖此請求');
  }

  let state;
  try {
    state = JSON.parse(match[1]);
  } catch (e) {
    throw new Error(`JSON 解析失敗: ${e.message}`);
  }

  // ── 提取用戶資料 ───────────────────────────────────────
  const users = state?.entities?.users?.entities;
  if (!users) throw new Error('找不到 users 資料');

  // 找到 MYAIPETS 用戶資料
  const userData = Object.values(users).find(
    u => u.screen_name?.toLowerCase() === 'myaipets'
  );
  if (!userData) throw new Error('找不到 MYAIPETS 用戶資料');

  const scraped = {
    followers: userData.followers_count   ?? null,
    following:  userData.friends_count    ?? null,
    posts:      userData.statuses_count   ?? null,
    media:      userData.media_count      ?? null,
    listed:     userData.listed_count     ?? null,
    scrapedAt:  new Date().toISOString(),
  };

  console.log('[資料]', JSON.stringify(scraped, null, 2));
  return { scraped, userData };
}

// ── 更新 data.json ────────────────────────────────────────
function updateDataFile(scraped, userData) {
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    console.warn('[警告] 找不到現有 data.json，將建立新的');
  }

  const today = new Date().toISOString().slice(0, 10);
  const history = existing.history || [];

  // 避免同一天重複記錄
  const alreadyToday = history.some(h => h.date === today);
  if (!alreadyToday) {
    history.push({
      date:      today,
      followers: scraped.followers,
      following:  scraped.following,
      posts:     scraped.posts,
      media:     scraped.media,
      listed:    scraped.listed,
    });
  }

  // 只保留最近 365 天
  const trimmed = history.slice(-365);

  const updated = {
    name:        userData.name         || existing.name,
    handle:      '@MYAIPETS',
    verified:    userData.is_blue_verified ?? existing.verified,
    created:     userData.created_at
                   ? new Date(userData.created_at).toISOString().slice(0,10)
                   : existing.created,
    description: userData.description  || existing.description,
    avatar:      userData.profile_image_url_https
                   ? userData.profile_image_url_https.replace('_normal', '_400x400')
                   : existing.avatar,
    banner:      userData.profile_banner_url || existing.banner,
    current:     scraped,
    history:     trimmed,
  };

  writeJsonFile(DATA_FILE, updated);
  console.log(`[完成] data.json 已更新，共 ${trimmed.length} 天歷史紀錄`);
  return updated;
}

// ── 計算粉絲變化 ───────────────────────────────────────────
function logChanges(updated) {
  const hist = updated.history;
  if (hist.length < 2) return;
  const prev = hist[hist.length - 2];
  const curr = hist[hist.length - 1];
  const delta = (curr.followers ?? 0) - (prev.followers ?? 0);
  console.log(`[成長] ${prev.date} → ${curr.date}: 粉絲 ${delta >= 0 ? '+' : ''}${delta} (${curr.followers?.toLocaleString()})`);
}

// ── 執行 ───────────────────────────────────────────────────
(async () => {
  try {
    const { scraped, userData } = await scrapeXProfile();
    const updated = updateDataFile(scraped, userData);
    logChanges(updated);
    console.log('[成功] 抓取完成！');
    process.exit(0);
  } catch (err) {
    console.error('[錯誤]', err.message);
    // 抓取失敗時讓 Action 失敗，避免靜默發布過期資料
    process.exit(1);
  }
})();
