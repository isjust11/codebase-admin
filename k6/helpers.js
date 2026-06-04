/**
 * ========================================
 *  K6 Load Test - Helper Functions
 * ========================================
 * Các hàm tiện ích dùng chung.
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, TEST_USER, DEFAULT_HEADERS } from './config.js';

/**
 * Login và lấy access token.
 * Dùng trong setup() để share token giữa các VU.
 */
export function login() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      username: TEST_USER.email,
      password: TEST_USER.password,
    }),
    { headers: DEFAULT_HEADERS }
  );

  const body = JSON.parse(res.body);

  const success = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token': () => !!body.accessToken,
  });

  if (!success) {
    console.error(`Login failed! Status: ${res.status}, Body: ${res.body}`);
    return null;
  }

  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  };
}

/**
 * Tạo headers với Bearer token.
 */
export function authHeaders(token) {
  return {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Check response cơ bản.
 */
export function checkResponse(res, name) {
  return check(res, {
    [`${name} - status 200`]: (r) => r.status === 200 || r.status === 201,
    [`${name} - duration < 500ms`]: (r) => r.timings.duration < 500,
    [`${name} - no error`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== false;
      } catch {
        return r.status >= 200 && r.status < 300;
      }
    },
  });
}
