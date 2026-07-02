/* Kiểm tra nhanh trạng thái job OCR trong DB (đọc credential từ .env). */
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  const [jobs] = await conn.query(
    'SELECT id, status, processed_pages, total_pages, error, created_at, updated_at FROM ocr_job ORDER BY id',
  );
  console.log('=== ocr_job ===');
  console.table(jobs);
  const [results] = await conn.query(
    'SELECT id, job_id, page_number, width, height, page_image_url IS NOT NULL AS has_page_image, updated_at FROM ocr_result ORDER BY job_id, page_number',
  );
  console.log('=== ocr_result ===');
  console.table(results);
  await conn.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
