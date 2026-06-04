/**
 * ========================================
 *  Kịch bản 4: SPIKE TEST
 * ========================================
 * Mục đích: Kiểm tra khả năng xử lý đột biến traffic.
 * Ví dụ: Khi có notification push đến nhiều user cùng lúc.
 * 
 * Chạy: k6 run k6/04-spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, STAGES } from './config.js';
import { login, authHeaders, checkResponse } from './helpers.js';

const errorRate = new Rate('error_rate');
const responseDuration = new Trend('response_duration', true);

export const options = {
  stages: STAGES.spike,
  thresholds: {
    http_req_duration: ['p(95)<3000'],   // Chấp nhận chậm hơn khi spike
    http_req_failed: ['rate<0.30'],       // Cho phép 30% lỗi trong spike
  },
};

export function setup() {
  const tokens = login();
  if (!tokens) throw new Error('Setup failed');
  console.log('🚀 Bắt đầu spike test...');
  return tokens;
}

export default function (tokens) {
  const headers = authHeaders(tokens.accessToken);

  // Giả lập user flow khi nhận push notification → mở app
  // 1. Mở app → load discover
  const newest = http.get(`${BASE_URL}/books/discover/newest?page=1&size=10`, { headers });
  responseDuration.add(newest.timings.duration);
  errorRate.add(newest.status !== 200);
  sleep(0.1);

  // 2. Load profile
  const profile = http.get(`${BASE_URL}/auth/profile`, { headers });
  responseDuration.add(profile.timings.duration);
  errorRate.add(profile.status !== 200);
  sleep(0.1);

  // 3. Browse books
  const books = http.get(`${BASE_URL}/books/public?page=1&size=10`, {
    headers,
  });
  responseDuration.add(books.timings.duration);
  errorRate.add(books.status !== 200);
  sleep(0.2);
}

export function teardown(tokens) {
  console.log('🏁 Spike test hoàn tất!');
  console.log('📊 Kiểm tra xem server có recovery lại bình thường sau spike không.');
}
