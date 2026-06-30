// Tạo database nếu chưa có (idempotent). Dùng credential trong .env.
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const dbName = process.env.DB_DATABASE;
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log('Database ready:', dbName);
  await conn.end();
})().catch((e) => {
  console.error('Create DB failed:', e.message);
  process.exit(1);
});
