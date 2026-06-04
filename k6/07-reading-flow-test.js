/**
 * ========================================
 *  Kịch bản 7: READING FLOW TEST
 * ========================================
 * Mục đích: Giả lập flow đọc sách thực tế của user.
 * 
 * Flow: Login → Browse books → Chọn sách → Lấy files → Download PDF (Google Drive proxy)
 * 
 * Endpoint chính:
 *   - GET /books/discover/newest    (browse)
 *   - GET /books/public/:id         (xem chi tiết)
 *   - GET /books/:id/files          (lấy danh sách file)
 *   - GET /google-drive/download/:fileId  (download PDF - @Public)
 * 
 * Chạy: k6 run k6/07-reading-flow-test.js
 * 
 * ⚠️  Lưu ý: Test này tạo tải lên Google Drive API.
 *     Nên hạn chế số VU để tránh vượt quota Google.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, THRESHOLDS } from './config.js';
import { login, authHeaders, checkResponse } from './helpers.js';

// ── Custom Metrics ──
const browseDuration = new Trend('browse_duration', true);
const bookDetailDuration = new Trend('book_detail_duration', true);
const fileListDuration = new Trend('file_list_duration', true);
const downloadDuration = new Trend('download_duration', true);
const downloadSize = new Trend('download_size_bytes', false);
const errorRate = new Rate('error_rate');
const downloadCount = new Counter('download_count');

export const options = {
  scenarios: {
    // Kịch bản 1: Nhiều user browse sách (nhẹ)
    browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '30s', target: 20 },
        { duration: '15s', target: 0 },
      ],
      exec: 'browseBooks',
    },
    // Kịch bản 2: Một số user đọc sách (nặng - download file)
    reading: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 3 },
        { duration: '30s', target: 5 },
        { duration: '15s', target: 0 },
      ],
      exec: 'readBook',
    },
  },
  thresholds: {
    browse_duration: ['p(95)<500'],
    book_detail_duration: ['p(95)<500'],
    file_list_duration: ['p(95)<500'],
    download_duration: ['p(95)<10000'],   // PDF download có thể chậm
    error_rate: ['rate<0.10'],
  },
};

// ── Setup: Login lấy token ──
export function setup() {
  const tokens = login();
  if (!tokens) throw new Error('Setup failed: Cannot login');

  // Lấy danh sách sách để có book IDs thực tế
  const booksRes = http.get(`${BASE_URL}/books/discover/newest?page=1&size=20`, {
    headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${tokens.accessToken}` },
  });

  let bookIds = [];
  try {
    const body = JSON.parse(booksRes.body);
    // Tuỳ cấu trúc response, lấy list book IDs
    const books = body.data || body.items || body || [];
    if (Array.isArray(books)) {
      bookIds = books.map((b) => b.id).filter(Boolean);
    } else if (books.items) {
      bookIds = books.items.map((b) => b.id).filter(Boolean);
    }
  } catch (e) {
    console.warn('Cannot parse book list, will use browse-only mode');
  }

  console.log(`✅ Setup hoàn tất. Tìm thấy ${bookIds.length} books.`);
  return { ...tokens, bookIds };
}

// ══════════════════════════════════════════════
//  Scenario 1: Browse Books (nhiều user, nhẹ)
// ══════════════════════════════════════════════
export function browseBooks(data) {
  const headers = authHeaders(data.accessToken);

  group('📖 Browse & Discover', () => {
    // Discover newest
    const newest = http.get(`${BASE_URL}/books/discover/newest?page=1&size=10`, { headers });
    browseDuration.add(newest.timings.duration);
    errorRate.add(newest.status !== 200);
    checkResponse(newest, 'discover/newest');
    sleep(1);

    // Discover popular
    const popular = http.get(`${BASE_URL}/books/discover/popular?page=1&size=10`, { headers });
    browseDuration.add(popular.timings.duration);
    errorRate.add(popular.status !== 200);
    checkResponse(popular, 'discover/popular');
    sleep(1);

    // Random page browse
    const page = Math.floor(Math.random() * 5) + 1;
    const list = http.get(`${BASE_URL}/books/public?page=${page}&size=10`, { headers });
    browseDuration.add(list.timings.duration);
    errorRate.add(list.status !== 200);
    checkResponse(list, `books page ${page}`);
    sleep(0.5);
  });
}

// ══════════════════════════════════════════════
//  Scenario 2: Read Book (ít user, nặng)
// ══════════════════════════════════════════════
export function readBook(data) {
  const headers = authHeaders(data.accessToken);
  const bookIds = data.bookIds || [];

  if (bookIds.length === 0) {
    // Fallback: chỉ browse nếu không có book IDs
    browseBooks(data);
    return;
  }

  // Chọn random 1 cuốn sách
  const bookId = bookIds[Math.floor(Math.random() * bookIds.length)];

  group('📚 Read Book Flow', () => {
    // ── Bước 1: Xem chi tiết sách ──
    const detailRes = http.get(`${BASE_URL}/books/public/${bookId}`, {
      headers: DEFAULT_HEADERS,
    });
    bookDetailDuration.add(detailRes.timings.duration);
    errorRate.add(detailRes.status !== 200);

    check(detailRes, {
      'book detail - status 200': (r) => r.status === 200,
      'book detail - has data': (r) => {
        try { return !!JSON.parse(r.body); } catch { return false; }
      },
    });
    sleep(1); // User đọc thông tin sách

    // ── Bước 2: Lấy danh sách files của sách ──
    const filesRes = http.get(`${BASE_URL}/books/${bookId}/files`, {
      headers: DEFAULT_HEADERS,
    });
    fileListDuration.add(filesRes.timings.duration);
    errorRate.add(filesRes.status !== 200);

    check(filesRes, {
      'files list - status 200': (r) => r.status === 200,
    });

    // Parse file list để lấy Google Drive fileId
    let driveFileId = null;
    try {
      const filesBody = JSON.parse(filesRes.body);
      const files = filesBody.data || filesBody || [];
      const fileList = Array.isArray(files) ? files : (files.items || []);

      // Tìm file PDF hoặc file đầu tiên có fileUrl chứa google drive ID
      for (const f of fileList) {
        const fileUrl = f.fileUrl || f.url || '';
        // Thử extract Google Drive fileId từ URL
        const match = fileUrl.match(/\/download\/([a-zA-Z0-9_-]+)/);
        if (match) {
          driveFileId = match[1];
          break;
        }
        // Hoặc nếu fileUrl là direct Google Drive ID
        if (fileUrl.match(/^[a-zA-Z0-9_-]{20,}$/)) {
          driveFileId = fileUrl;
          break;
        }
      }
    } catch (e) {
      // Không parse được, skip download
    }
    sleep(0.5);

    // ── Bước 3: Download file từ Google Drive proxy ──
    if (driveFileId) {
      downloadCount.add(1);
      const downloadRes = http.get(`${BASE_URL}/google-drive/download/${driveFileId}`, {
        headers: DEFAULT_HEADERS,
        responseType: 'binary', // Nhận binary data
        timeout: '30s',         // PDF có thể lớn
      });

      downloadDuration.add(downloadRes.timings.duration);
      errorRate.add(downloadRes.status !== 200);

      const downloadOk = check(downloadRes, {
        'download - status 200': (r) => r.status === 200,
        'download - has content': (r) => r.body && r.body.length > 0,
        'download - is PDF': (r) => {
          const ct = r.headers['Content-Type'] || '';
          return ct.includes('pdf') || ct.includes('octet-stream') || ct.includes('epub');
        },
      });

      if (downloadOk) {
        downloadSize.add(downloadRes.body.length);
        console.log(`📄 Downloaded file: ${driveFileId} (${(downloadRes.body.length / 1024 / 1024).toFixed(2)} MB) in ${downloadRes.timings.duration.toFixed(0)}ms`);
      }
    } else {
      console.log(`⚠️ Book ${bookId}: No downloadable file found, skipping download`);
    }

    sleep(2); // User đang đọc sách
  });
}

export function teardown(data) {
  console.log('🏁 Reading flow test hoàn tất!');
  console.log(`📊 Tổng downloads: xem download_count metric`);
  console.log('💡 Kiểm tra download_duration để đánh giá hiệu năng proxy Google Drive.');
}
