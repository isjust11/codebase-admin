/**
 * ========================================
 *  K6 Load Test - Configuration
 * ========================================
 * Cấu hình chung cho tất cả kịch bản test.
 * Thay đổi BASE_URL và credentials trước khi chạy.
 */

// ── Base URL ──────────────────────────────────────────────
// Thay bằng URL server thực tế
export const BASE_URL = __ENV.BASE_URL || 'https://readbox.pro.vn';

// ── Test Account ──────────────────────────────────────────
// Account dùng để test (nên tạo account riêng cho test)
export const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'vohung.it',
  password: __ENV.TEST_PASSWORD || 'Hg!@1997',
};

// ── Headers ───────────────────────────────────────────────
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept-Language': 'vi',
  'x-region': 'vi-VN',
  'x-country-code': 'VN',
};

// ── Thresholds (Ngưỡng chấp nhận) ────────────────────────
export const THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
  http_req_failed: ['rate<0.05'],                    // Error rate < 5%
  http_reqs: ['rate>10'],                            // Throughput > 10 rps
};

// ── Stage Templates ───────────────────────────────────────
export const STAGES = {
  // Smoke test: kiểm tra cơ bản
  smoke: [
    { duration: '10s', target: 1 },
  ],

  // Load test: tải bình thường
  load: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 20 },    // Giữ tải
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // Stress test: tải cao
  stress: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],

  // Spike test: tải đột biến
  spike: [
    { duration: '10s', target: 5 },
    { duration: '5s', target: 200 },   // Spike!
    { duration: '30s', target: 200 },
    { duration: '10s', target: 5 },
    { duration: '30s', target: 0 },
  ],

  // Soak test: chạy dài phát hiện memory leak
  soak: [
    { duration: '1m', target: 30 },
    { duration: '10m', target: 30 },   // Giữ 10 phút
    { duration: '1m', target: 0 },
  ],
};
