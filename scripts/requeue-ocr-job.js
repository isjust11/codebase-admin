/* Kiểm tra assets + requeue một job OCR bị kẹt (usage: node scripts/requeue-ocr-job.js <jobId>). */
require('dotenv').config();
const mysql = require('mysql2/promise');
const amqp = require('amqplib');

(async () => {
  const jobId = Number(process.argv[2] || 2);
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  const [assets] = await conn.query(
    'SELECT id, job_id, page_number, type, source, image_url IS NOT NULL AS has_image, created_at FROM ocr_asset WHERE job_id = ?',
    [jobId],
  );
  console.log(`=== ocr_asset (job ${jobId}) ===`);
  console.table(assets);

  const [[job]] = await conn.query(
    'SELECT id, file_url, file_key, lang, mode, extract_images, mime_type, original_name FROM ocr_job WHERE id = ?',
    [jobId],
  );
  if (!job) {
    console.error(`Job #${jobId} không tồn tại.`);
    process.exit(1);
  }
  console.log('Job:', job.original_name, '| mime:', job.mime_type);

  await conn.query(
    "UPDATE ocr_job SET status = 'queued', error = NULL, processed_pages = 0 WHERE id = ?",
    [jobId],
  );

  const mq = await amqp.connect(process.env.RABBITMQ_URL);
  const ch = await mq.createChannel();
  const queue = process.env.OCR_JOBS_QUEUE || 'ocr.jobs';
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(
    queue,
    Buffer.from(
      JSON.stringify({
        jobId: job.id,
        fileUrl: job.file_url,
        fileKey: job.file_key || undefined,
        lang: job.lang,
        mode: job.mode,
        extractImages: !!job.extract_images,
      }),
    ),
    { persistent: true, contentType: 'application/json' },
  );
  console.log(`Đã publish lại job #${jobId} vào '${queue}'.`);
  await ch.close();
  await mq.close();
  await conn.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
