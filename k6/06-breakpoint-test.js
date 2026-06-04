/**
 * ========================================
 *  Kịch bản 6: BREAKPOINT TEST
 * ========================================
 * Mục đích: Tìm số user tối đa server chịu được.
 * Tăng dần từ 0 → 500 users cho đến khi fail.
 * 
 * Chạy: k6 run k6/06-breakpoint-test.js
 * 
 * ⚠️  CẢNH BÁO: Test này sẽ đẩy server đến giới hạn!
 *     Chỉ chạy trên môi trường staging/dev.
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS } from './config.js';
import { login, authHeaders } from './helpers.js';

const errorRate = new Rate('error_rate');
const responseDuration = new Trend('response_duration', true);

export const options = {
  // Ramping: 0 → 50 → 100 → 200 → 300 → 500
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 500 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Test sẽ abort nếu error rate > 50%
    error_rate: [{ threshold: 'rate<0.50', abortOnFail: true, delayAbortEval: '10s' }],
  },
};

export function setup() {
  const tokens = login();
  if (!tokens) throw new Error('Setup failed');
  console.log('💥 Bắt đầu breakpoint test - tìm giới hạn server...');
  return tokens;
}

export default function (tokens) {
  const headers = authHeaders(tokens.accessToken);

  // Chỉ test endpoint nhẹ nhất để đo pure throughput
  const res = http.get(`${BASE_URL}/books/public?page=1&size=5`, {
    headers,
  });

  responseDuration.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  sleep(0.1); // Minimal sleep
}

export function teardown(tokens) {
  console.log('🏁 Breakpoint test hoàn tất!');
  console.log('📊 Xem lại output để biết server bắt đầu lỗi ở bao nhiêu VUs.');
  console.log('💡 Kết hợp với monitoring server (CPU, RAM, DB connections) để phân tích.');
}
