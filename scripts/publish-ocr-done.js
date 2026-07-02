/* Publish message 'done' thủ công cho một job vào ocr.results (usage: node scripts/publish-ocr-done.js <jobId> <totalPages>). */
require('dotenv').config();
const amqp = require('amqplib');

(async () => {
  const jobId = Number(process.argv[2] || 2);
  const totalPages = Number(process.argv[3] || 1);
  const mq = await amqp.connect(process.env.RABBITMQ_URL);
  const ch = await mq.createChannel();
  const queue = process.env.OCR_RESULTS_QUEUE || 'ocr.results';
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(
    queue,
    Buffer.from(
      JSON.stringify({
        jobId,
        status: 'done',
        processedPages: totalPages,
        totalPages,
      }),
    ),
    { persistent: true, contentType: 'application/json' },
  );
  console.log(`Đã publish 'done' cho job #${jobId} vào '${queue}'.`);
  await ch.close();
  await mq.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
