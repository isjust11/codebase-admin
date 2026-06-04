/**
 * ========================================
 *  Kịch bản 2: LOAD TEST
 * ========================================
 * Mục đích: Kiểm tra hiệu năng dưới tải bình thường.
 * Giả lập 10-20 users đồng thời truy cập các API chính.
 * 
 * Chạy: k6 run k6/02-load-test.js
 * Với report: k6 run --out json=k6/results/load-test.json k6/02-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, STAGES, THRESHOLDS } from './config.js';
import { login, authHeaders, checkResponse } from './helpers.js';

// ── Custom Metrics ──
const bookListDuration = new Trend('book_list_duration', true);
const searchDuration = new Trend('search_duration', true);
const profileDuration = new Trend('profile_duration', true);
const errorRate = new Rate('custom_error_rate');

export const options = {
  stages: STAGES.load,
  thresholds: {
    ...THRESHOLDS,
    book_list_duration: ['p(95)<800'],
    search_duration: ['p(95)<600'],
    profile_duration: ['p(95)<300'],
    custom_error_rate: ['rate<0.05'],
  },
};

export function setup() {
  const tokens = login();
  if (!tokens) {
    throw new Error('Setup failed: Cannot login');
  }
  console.log('✅ Login thành công, bắt đầu load test...');
  return tokens;
}

export default function (tokens) {
  const headers = authHeaders(tokens.accessToken);

  // ── Group 1: Browsing flow (user mở app, duyệt sách) ──
  group('📖 Browse Books', () => {
    // Trang chủ - lấy sách mới
    const newest = http.get(`${BASE_URL}/books/discover/newest?page=1&size=10`, { headers });
    bookListDuration.add(newest.timings.duration);
    errorRate.add(newest.status !== 200);
    checkResponse(newest, 'discover/newest');
    sleep(1);

    // Sách phổ biến
    const popular = http.get(`${BASE_URL}/books/discover/popular?page=1&size=10`, { headers });
    bookListDuration.add(popular.timings.duration);
    errorRate.add(popular.status !== 200);
    checkResponse(popular, 'discover/popular');
    sleep(1);

    // Sách gợi ý
    const recommended = http.get(`${BASE_URL}/books/discover/recommended?page=1&size=10`, { headers });
    bookListDuration.add(recommended.timings.duration);
    errorRate.add(recommended.status !== 200);
    checkResponse(recommended, 'discover/recommended');
    sleep(0.5);
  });

  // ── Group 2: Search flow ──
  group('🔍 Search Books', () => {
    const keywords = ['nestjs', 'flutter', 'javascript', 'python', 'react'];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    const searchRes = http.get(`${BASE_URL}/books/public/search?keyword=${keyword}`, {
      headers: DEFAULT_HEADERS,
    });
    searchDuration.add(searchRes.timings.duration);
    errorRate.add(searchRes.status !== 200);
    checkResponse(searchRes, `search "${keyword}"`);
    sleep(1);

    // Search by title
    const titleRes = http.get(`${BASE_URL}/books/public/title?q=${keyword}`, {
      headers: DEFAULT_HEADERS,
    });
    searchDuration.add(titleRes.timings.duration);
    checkResponse(titleRes, `search title "${keyword}"`);
    sleep(0.5);
  });

  // ── Group 3: Profile & Auth ──
  group('👤 User Profile', () => {
    const profileRes = http.get(`${BASE_URL}/auth/profile`, { headers });
    profileDuration.add(profileRes.timings.duration);
    errorRate.add(profileRes.status !== 200);
    checkResponse(profileRes, 'profile');
    sleep(0.5);
  });

  // ── Group 4: Pagination (giả lập user scroll) ──
  group('📄 Pagination', () => {
    for (let page = 1; page <= 3; page++) {
      const res = http.get(`${BASE_URL}/books/public?page=${page}&size=10`, {
        headers,
      });
      bookListDuration.add(res.timings.duration);
      checkResponse(res, `books page ${page}`);
      sleep(0.3);
    }
  });

  sleep(1); // Think time giữa các scenario
}

export function teardown(tokens) {
  console.log('🏁 Load test hoàn tất!');
  console.log('📊 Xem metrics ở output bên trên.');
}
