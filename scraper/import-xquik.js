/**
 * Import a Xquik tweet export into data.json as an aggregate source snapshot.
 *
 * Usage:
 *   node scraper/import-xquik.js scraper/xquik-sample.json
 *   XQUIK_EXPORT_PATH=exports/xquik-tweets.json node scraper/import-xquik.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { writeJsonFile } from './write-json-file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '..', 'data.json');
const DEFAULT_INPUT_FILE = path.resolve(__dirname, 'xquik-sample.json');

function resolveInputFile() {
  const rawPath = process.argv[2] || process.env.XQUIK_EXPORT_PATH || DEFAULT_INPUT_FILE;
  return path.resolve(process.cwd(), rawPath);
}

function readExport(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) {
    throw new Error(`Empty Xquik export: ${filePath}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
}

function tweetRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.tweets)) return payload.tweets;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.tweets)) return payload.data.tweets;
  throw new Error('Xquik export must be an array or contain tweets/results/data');
}

function nestedNumber(record, keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((current, segment) => current?.[segment], record);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replaceAll(',', ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function firstDate(record) {
  const value = record.createdAt || record.created_at || record.publishedAt || record.timestamp;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function aggregate(records) {
  const totals = records.reduce(
    (acc, record) => {
      acc.likes += nestedNumber(record, ['likeCount', 'likes', 'metrics.likes', 'public_metrics.like_count']);
      acc.retweets += nestedNumber(record, ['retweetCount', 'reposts', 'retweets', 'metrics.retweets', 'public_metrics.retweet_count']);
      acc.replies += nestedNumber(record, ['replyCount', 'replies', 'comments', 'metrics.replies', 'public_metrics.reply_count']);
      acc.bookmarks += nestedNumber(record, ['bookmarkCount', 'bookmarks', 'metrics.bookmarks']);
      acc.impressions += nestedNumber(record, ['impressionCount', 'impressions', 'views', 'viewCount', 'metrics.impressions', 'public_metrics.impression_count']);
      const date = firstDate(record);
      if (date && (!acc.latestTweetAt || date > acc.latestTweetAt)) acc.latestTweetAt = date;
      return acc;
    },
    {
      likes: 0,
      retweets: 0,
      replies: 0,
      bookmarks: 0,
      impressions: 0,
      latestTweetAt: null,
    },
  );

  return {
    posts: records.length,
    ...totals,
  };
}

function readExistingData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function mergeXquikSnapshot(existing, summary, inputFile) {
  return {
    ...existing,
    xquik: {
      source: 'Xquik export',
      sourceFile: path.basename(inputFile),
      importedAt: new Date().toISOString(),
      ...summary,
    },
  };
}

const inputFile = resolveInputFile();
const records = tweetRecords(readExport(inputFile));
const existing = readExistingData();
const updated = mergeXquikSnapshot(existing, aggregate(records), inputFile);

writeJsonFile(DATA_FILE, updated);
console.log(`[完成] 已匯入 ${records.length} 筆 Xquik 貼文摘要至 data.json`);
