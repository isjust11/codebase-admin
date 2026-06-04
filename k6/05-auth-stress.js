/**
 * ========================================
 *  Kịch bản 5: AUTH STRESS TEST
 * ========================================
 * Mục đích: Test riêng authentication endpoints.
 * - Login liên tục (brute force simulation)
 * - Refresh token
 * - Validate token
 * 
 * Chạy: k6 run k6/05-auth-stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { BASE_URL, TEST_USER, DEFAULT_HEADERS } from './config.js';

const loginDuration = new Trend('login_duration', true);
const refreshDuration = new Trend('refresh_duration', true);
const authErrorRate = new Rate('auth_error_rate');
const loginCount = new Counter('login_attempts');

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '15s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    login_duration: ['p(95)<2000'],
    refresh_duration: ['p(95)<500'],
    auth_error_rate: ['rate<0.10'],
  },
};

export default function () {
  // ── 1. Login ──
  loginCount.add(1);
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      username: TEST_USER.email,
      password: TEST_USER.password,
    }),
    { headers: DEFAULT_HEADERS }
  );

  loginDuration.add(loginRes.timings.duration);
  
  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
  });

  if (!loginOk) {
    authErrorRate.add(true);
    sleep(1);
    return;
  }
  authErrorRate.add(false);

  let body;
  try {
    body = JSON.parse(loginRes.body);
  } catch {
    sleep(1);
    return;
  }

  const accessToken = body?.data?.accessToken;
  const refreshToken = body?.data?.refreshToken;
  sleep(0.5);

  // ── 2. Validate token ──
  if (accessToken) {
    const validateRes = http.get(
      `${BASE_URL}/auth/validate-token?token=${accessToken}`,
      { headers: DEFAULT_HEADERS }
    );
    check(validateRes, {
      'validate-token OK': (r) => r.status === 200,
    });
    sleep(0.3);
  }

  // ── 3. Refresh token ──
  if (refreshToken) {
    const refreshRes = http.post(
      `${BASE_URL}/auth/refresh-token`,
      JSON.stringify({ refreshToken }),
      { headers: DEFAULT_HEADERS }
    );
    refreshDuration.add(refreshRes.timings.duration);
    check(refreshRes, {
      'refresh status 200': (r) => r.status === 200,
    });
    sleep(0.3);
  }

  // ── 4. Get profile ──
  if (accessToken) {
    const profileRes = http.get(`${BASE_URL}/auth/profile`, {
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    check(profileRes, {
      'profile status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
