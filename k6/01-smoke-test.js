/**
 * ========================================
 *  Kịch bản 1: SMOKE TEST
 * ========================================
 * Mục đích: Kiểm tra nhanh API có hoạt động không.
 * Chạy 1 user duy nhất, xác minh tất cả endpoints trả về đúng.
 * 
 * Chạy: k6 run k6/01-smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_HEADERS, STAGES, THRESHOLDS } from './config.js';
import { login, authHeaders, checkResponse } from './helpers.js';

export const options = {
  stages: STAGES.smoke,
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

// ── Setup: Login 1 lần, share token cho tất cả iterations ──
export function setup() {
  const tokens = login();
  if (!tokens) {
    throw new Error('Setup failed: Cannot login. Kiểm tra lại TEST_USER trong config.js');
  }
  console.log('✅ Login thành công, bắt đầu smoke test...');
  return tokens;
}

// ── Main: Test từng endpoint ──
export default function (tokens) {
  const headers = authHeaders(tokens.accessToken);

  // 1. Books public (cần auth vì controller có @UseGuards)
  const publicBooks = http.get(`${BASE_URL}/books/public?page=1&size=5`, {
    headers,
  });
  checkResponse(publicBooks, 'GET /books/public');
  sleep(0.5);

  // 2. Discover - Sách mới nhất
  const newest = http.get(`${BASE_URL}/books/discover/newest?page=1&size=5`, {
    headers,
  });
  checkResponse(newest, 'GET /books/discover/newest');
  sleep(0.5);

  // 3. Discover - Sách phổ biến
  const popular = http.get(`${BASE_URL}/books/discover/popular?page=1&size=5`, {
    headers,
  });
  checkResponse(popular, 'GET /books/discover/popular');
  sleep(0.5);

  // 4. Discover - Gợi ý
  const recommended = http.get(`${BASE_URL}/books/discover/recommended?page=1&size=5`, {
    headers,
  });
  checkResponse(recommended, 'GET /books/discover/recommended');
  sleep(0.5);

  // 5. Profile
  const profile = http.get(`${BASE_URL}/auth/profile`, {
    headers,
  });
  checkResponse(profile, 'GET /auth/profile');
  sleep(0.5);

  // 6. Validate token
  const validateToken = http.get(`${BASE_URL}/auth/validate-token?token=${tokens.accessToken}`, {
    headers: DEFAULT_HEADERS,
  });
  check(validateToken, {
    'validate-token responded': (r) => r.status === 200 || r.status === 401,
  });
  sleep(0.5);

  // 7. Search books
  const search = http.get(`${BASE_URL}/books/public/search?keyword=test`, {
    headers: DEFAULT_HEADERS,
  });
  checkResponse(search, 'GET /books/public/search');
  sleep(0.5);
}

export function teardown(tokens) {
  console.log('🏁 Smoke test hoàn tất!');
}
