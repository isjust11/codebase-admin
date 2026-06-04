/**
 * ========================================
 *  Kịch bản 3: STRESS TEST
 * ========================================
 * Mục đích: Tìm breaking point (điểm chịu tải tối đa).
 * Tăng dần từ 20 → 50 → 100 users.
 * 
 * Chạy: k6 run k6/03-stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, STAGES } from './config.js';
import { login, authHeaders, checkResponse } from './helpers.js';

// ── Custom Metrics ──
const responseDuration = new Trend('response_duration', true);
const errorCount = new Counter('error_count');
const errorRate = new Rate('error_rate');

export const options = {
  stages: STAGES.stress,
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // Cho phép chậm hơn load test
    http_req_failed: ['rate<0.15'],       // Cho phép 15% lỗi khi stress
    error_rate: ['rate<0.20'],
  },
};

export function setup() {
  const tokens = login();
  if (!tokens) throw new Error('Setup failed: Cannot login');
  console.log('⚡ Bắt đầu stress test...');
  return tokens;
}

export default function (tokens) {
  const headers = authHeaders(tokens.accessToken);

  // ── Heavy read operations ──
  group('📖 Heavy Reads', () => {
    // Đọc danh sách sách - nhiều page
    const page = Math.floor(Math.random() * 10) + 1;
    const size = Math.floor(Math.random() * 20) + 5;
    const res = http.get(`${BASE_URL}/books/public?page=${page}&size=${size}`, {
      headers,
    });
    responseDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    if (res.status !== 200) errorCount.add(1);
    sleep(0.3);
  });

  group('🔍 Heavy Search', () => {
    const keywords = ['a', 'b', 'test', 'book', 'ebook', 'flutter', 'javascript', 'nestjs', 'react', 'vue'];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    const res = http.get(`${BASE_URL}/books/public/search?keyword=${keyword}`, {
      headers: DEFAULT_HEADERS,
    });
    responseDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    if (res.status !== 200) errorCount.add(1);
    sleep(0.2);
  });

  group('👤 Auth Endpoints', () => {
    const profileRes = http.get(`${BASE_URL}/auth/profile`, { headers });
    responseDuration.add(profileRes.timings.duration);
    errorRate.add(profileRes.status !== 200);
    if (profileRes.status !== 200) errorCount.add(1);
    sleep(0.2);
  });

  group('📚 Discover APIs', () => {
    // Gọi đồng thời nhiều endpoint discover
    const responses = http.batch([
      ['GET', `${BASE_URL}/books/discover/newest?page=1&size=10`, null, { headers }],
      ['GET', `${BASE_URL}/books/discover/popular?page=1&size=10`, null, { headers }],
      ['GET', `${BASE_URL}/books/discover/recommended?page=1&size=10`, null, { headers }],
    ]);

    responses.forEach((res, i) => {
      responseDuration.add(res.timings.duration);
      errorRate.add(res.status !== 200);
      if (res.status !== 200) errorCount.add(1);
    });
    sleep(0.3);
  });

  sleep(0.5);
}

export function teardown(tokens) {
  console.log('🏁 Stress test hoàn tất!');
  console.log('📊 Kiểm tra error_rate và response_duration trong kết quả.');
  console.log('💡 Nếu error_rate > 15% → cần tối ưu hoặc scale up server.');
}
