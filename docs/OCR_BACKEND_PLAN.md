# OCR Backend Plan — NestJS OcrModule + RabbitMQ + PaddleOCR Worker

> Mục tiêu: Hệ thống OCR bất đồng bộ. Người dùng upload PDF/ảnh → xử lý qua message queue → trả kết quả (text + bbox) sau. Tận dụng server NestJS hiện tại bằng một module `OcrModule` riêng; phần OCR nặng tách ra worker Python (PaddleOCR) chạy Docker.

- Ngôn ngữ OCR: **vi + en** (hỗ trợ `auto`).
- Queue: **RabbitMQ** (worker Python consume native). Đóng gói sau interface để có thể đổi sang Redis/BullMQ.
- Lưu file: **S3 qua `MediaService`** (đã có).
- DB: **MySQL + TypeORM**, `synchronize: false`, migration timestamp (theo convention hiện tại).

---

## 0. Kiến trúc liên quan backend

```
App / FE  --HTTP-->  NestJS OcrModule  --publish ocr.jobs-->  RabbitMQ  --consume-->  PaddleOCR Worker (Python)
                          ^                                                                   |
                          |  <--consume ocr.results--  RabbitMQ  <--publish ocr.results------/
                          v
                       MySQL (ocr_job, ocr_result) + Socket.IO/FCM notify
```

- Exchanges/queues: `ocr.jobs`, `ocr.results`, `ocr.dlx` (dead-letter).
- Job message: `{ jobId, fileUrl, lang, pages?, mode, extractImages? }`
- Result message: `{ jobId, status, pages: [{page,width,height,lines:[{text,confidence,bbox}], images:[{type,bbox,imageUrl}], tables?:[{bbox,html,imageUrl}]}], error? }`

---

## Phase 1 — Hạ tầng RabbitMQ (P1) — ✅ ĐÃ TRIỂN KHAI

> Lưu ý: env dùng tên `RABBITMQ_URL`, `OCR_JOBS_QUEUE`, `OCR_RESULTS_QUEUE`, `OCR_PREFETCH` (xem `.env.example`). Connect chịu lỗi: retry nền, không sập app khi RabbitMQ chưa sẵn sàng.

- [ ] Thêm RabbitMQ vào `docker-compose` dev (image `rabbitmq:3-management`, port 5672 + UI 15672). *(còn lại)*
- [x] Thêm env: `RABBITMQ_URL`, `OCR_JOBS_QUEUE=ocr.jobs`, `OCR_RESULTS_QUEUE=ocr.results`, `OCR_PREFETCH`.
- [x] Cài `amqplib` + `@types/amqplib`.
- [x] Tạo `src/queues/ocr-queue.interface.ts` (abstraction `publishJob`, `consumeResults`, `isReady` + message types).
- [x] Tạo `src/queues/rabbitmq-ocr.queue.ts` triển khai interface; assert queue durable, `prefetch`, reconnect + reapply consumer.
- **DoD:** publish thử 1 message vào `ocr.jobs`, thấy trên RabbitMQ UI; consumer log nhận được.

## Phase 2 — Entity + Migration (thuộc P3) — ✅ ĐÃ TRIỂN KHAI

- [x] `src/entities/ocr-job.entity.ts` — bảng `ocr_job` (+ `mode`, `originalName`).
- [x] `src/entities/ocr-result.entity.ts` — bảng `ocr_result` (UNIQUE(jobId,pageNumber)).
- [x] `src/entities/ocr-asset.entity.ts` — bảng `ocr_asset` (type image|figure|table, bbox json, tableHtml, source).
- [x] Đăng ký 3 entity vào mảng `entities: [...]` trong `src/app.module.ts`.
- [x] `src/migrations/1751200000000-CreateOcrTables.ts` — `CREATE TABLE IF NOT EXISTS` (idempotent).
- **DoD:** `npm run start:dev` chạy migration tạo bảng thành công, không lỗi schema.

## Phase 3 — OcrModule (producer + API) (P3) — ✅ ĐÃ TRIỂN KHAI

- [x] `src/modules/ocr.module.ts` — import `AuthModule`, `MediaModule`, `TypeOrmModule.forFeature([OcrJob, OcrResult, OcrAsset])`, queue provider (`OCR_QUEUE` → `RabbitmqOcrQueue`).
- [x] `src/services/ocr.service.ts`: `createJob` (upload S3 → insert queued → publish), `requeueJob`, `getJobs`, `getJob`, `getResult`, `getAssets`, `handleResult`.
- [x] `src/controllers/ocr/ocr.controller.ts` — `@Controller('ocr')`, `JwtAuthGuard` + `PermissionGuard`:
  - `POST /ocr/jobs` (`FileInterceptor('file')`, ≤100MB, mimetype pdf/ảnh).
  - `POST /ocr/jobs/:id/requeue`, `GET /ocr/jobs`, `GET /ocr/jobs/:id`, `GET /ocr/jobs/:id/result?page=`, `GET /ocr/jobs/:id/assets?page=&type=`.
  - `POST /ocr/jobs/:id/export` — *(phase 6, chưa làm)*.
- [x] DTO `CreateOcrJobDto { lang?, mode?, extractImages?, pages? }`.
- [ ] Seed permission `ocr` (action CREATE/READ) — *(admin/super-admin đã bypass; seed cho role khác nếu cần)*.
- [x] Add `OcrModule` vào `imports` của `app.module.ts`.
- **DoD:** Upload file qua `POST /ocr/jobs` → có row `ocr_job(queued)` + message trên `ocr.jobs`.

## Phase 4 — Consumer kết quả + realtime (P3/P5) — ✅ ĐÃ TRIỂN KHAI

- [x] `src/services/ocr-result.consumer.ts` — đăng ký `consumeResults` lúc `onModuleInit`; `OcrService.handleResult` xử lý:
  - `status=processing` → update `processedPages`/`totalPages`.
  - `status=done` → upsert `ocr_result` từng trang + ghi đè `ocr_asset` của trang + `ocr_job=done`.
  - `status=failed` → `ocr_job=failed` + lưu `error`.
- [x] Realtime: `src/gateways/ocr.gateway.ts` — Socket.IO event `ocr.job.updated`, room theo `jobId` (`ocr.join`/`ocr.leave`). *(FCM push: tùy chọn, chưa nối)*.
- [x] Idempotent: upsert theo `UNIQUE(jobId,pageNumber)` + xóa-ghi-lại asset của trang trước khi insert.
- **DoD:** Worker publish kết quả → DB cập nhật → FE/App nhận event realtime.

## Phase 5 — Worker Python PaddleOCR (`codebase-ocr`) (P2)

> Repo/service mới, Docker riêng. Consumer của `ocr.jobs`, publisher của `ocr.results`.

```
codebase-ocr/
├── app/
│   ├── worker.py        # kết nối RMQ (pika), consume ocr.jobs, publish ocr.results
│   ├── ocr_engine.py    # PaddleOCR singleton (lang vi/en) + PPStructure (layout), warm-up khi start
│   ├── pdf_renderer.py  # PyMuPDF(fitz): PDF -> ảnh theo trang @ DPI cấu hình
│   ├── image_extractor.py # tách ảnh: embedded (fitz get_images) + figure/table (PP-Structure) -> crop
│   ├── s3_client.py     # boto3 tải file + upload ảnh đã tách lên S3
│   ├── schemas.py       # pydantic message in/out
│   └── config.py        # rmq_url, dpi, langs, prefetch, use_gpu, extract_images
├── requirements.txt     # paddleocr, paddlepaddle, pika, pymupdf, boto3, pydantic, opencv-python, pillow
├── Dockerfile
└── README.md
```

- [ ] Khởi tạo `PaddleOCR(use_angle_cls=True, lang=...)` **1 lần** lúc start + warm-up bằng ảnh giả.
- [ ] Consume `ocr.jobs` với `prefetch_count` thấp; ack sau khi xong.
- [ ] Tải file S3 → render từng trang (DPI cấu hình, mặc định 200–300) → OCR → chuẩn hoá `{page,width,height,lines:[{text,confidence,bbox}]}`.
- [ ] Phát `ocr.results` theo tiến độ (`processing` mỗi N trang) và `done` khi hoàn tất.
- [ ] Lỗi → retry N lần → đẩy `ocr.dlx` + publish `status=failed`.
- [ ] `GET /health` (readiness model).
- [ ] Dockerfile + healthcheck; có thể scale nhiều replica.
- **DoD:** Đưa 1 job PDF scan vi/en vào queue → worker OCR ra text + bbox đúng, publish kết quả.

## Phase 5b — Tách ảnh / figure / table trong trang PDF (P5)

> Mục tiêu: nếu trang PDF chứa hình (ảnh nhúng hoặc hình trong bản scan), tách ra thành ảnh riêng (kèm vị trí) để app/FE hiển thị, lưu trữ hoặc xuất file. Chỉ chạy khi `extractImages = true` (mặc định bật).

**Hai cơ chế bổ trợ nhau (trong `image_extractor.py`):**

1. **Ảnh nhúng — PDF digital** (PyMuPDF, lấy ảnh gốc chất lượng cao):
   - `page.get_images(full=True)` → danh sách `xref`.
   - `doc.extract_image(xref)` → `{ image: bytes, ext: 'png'|'jpeg', ... }`.
   - `page.get_image_rects(xref)` → bbox vị trí ảnh trên trang (để map overlay).
   - `source = embedded`.

2. **Hình trong PDF scan / fallback — Layout analysis** (PaddleOCR PP-Structure):
   - `PPStructure(layout=True, table=True, ocr=False)` chạy trên ảnh render của trang.
   - Trả về vùng có `type ∈ {figure, table, text, title, list}` + bbox.
   - Vùng `figure` → crop từ ảnh trang (OpenCV/PIL) → ảnh tách (`source = layout`).
   - Vùng `table` → có thể lấy `res.html` (cấu trúc bảng) + ảnh crop.

**Các bước:**
- [ ] `image_extractor.extract(page, page_image)` trả `[{type, bbox, image_bytes, table_html?, source}]`.
- [ ] Khử trùng/khử chồng lấn giữa ảnh embedded và figure layout (IoU bbox) để tránh tách 2 lần cùng 1 hình.
- [ ] Bỏ qua ảnh quá nhỏ (icon, đường kẻ) theo ngưỡng diện tích cấu hình.
- [ ] Upload mỗi ảnh tách lên S3 → nhận `imageUrl/imageKey`.
- [ ] Đưa vào result message: `pages[].images[]` và `pages[].tables[]`.
- [ ] Worker cấu hình `extract_images`, ngưỡng kích thước, có bật table hay không.
- **DoD:** Trang có hình (cả digital lẫn scan) → tách đúng ảnh + bbox, ảnh nằm trên S3, metadata trả về trong kết quả.

> Lưu ý hiệu năng: PP-Structure nặng hơn OCR thuần. Nên (a) chỉ bật khi `extractImages=true`, (b) ưu tiên `get_images()` cho PDF digital (nhẹ), (c) chỉ chạy layout khi trang là scan hoặc khi cần bắt figure.

## Phase 6 — Export & Hardening (P6)

- [ ] Export `.txt` (ghép text các trang) và **searchable PDF** (ảnh gốc + lớp text ẩn — sinh ở worker bằng PyMuPDF/reportlab).
- [ ] Retry/back-off, dead-letter xử lý, alert khi job kẹt.
- [ ] Rate limit `POST /ocr/jobs` theo user; giới hạn dung lượng/độ dài.
- [ ] Logging chi tiết (jobId xuyên suốt), metrics (số job, thời gian/trang).
- [ ] (Tùy chọn) Bull Board/RabbitMQ UI để giám sát.
- **DoD:** Chịu tải nhiều job song song, job lỗi không kẹt hệ thống, có file export.

---

## API Contract (tóm tắt)

| Method | Path | Body/Query | Response |
|---|---|---|---|
| POST | `/ocr/jobs` | multipart `file` + `lang?,pages?,mode?` | `{ jobId, status }` |
| GET | `/ocr/jobs` | `page,limit,status?` | `{ items:[OcrJob], total }` |
| GET | `/ocr/jobs/:id` | — | `OcrJob` (kèm tiến độ) |
| GET | `/ocr/jobs/:id/result` | `page?` | `{ page, width, height, lines:[{text,confidence,bbox}], images:[{type,bbox,imageUrl}], tables?:[{bbox,html,imageUrl}] }` |
| GET | `/ocr/jobs/:id/assets` | `page?,type?` | `{ items:[{pageNumber,type,bbox,imageUrl}] }` |
| POST | `/ocr/jobs/:id/export` | `{ format: 'txt'\|'pdf' }` | `{ url }` |
| WS | `ocr.job.updated` | — | `{ jobId, status, processedPages, totalPages }` |

## Checklist hạ tầng / env

- [ ] `OCR_RMQ_URL`, `OCR_RMQ_JOBS_QUEUE`, `OCR_RMQ_RESULTS_QUEUE`, `OCR_RMQ_DLX`
- [ ] `OCR_DEFAULT_LANG=auto`, `OCR_RENDER_DPI=240`
- [ ] Worker: `S3_*` (tái dùng), `OCR_PREFETCH`, `OCR_USE_GPU`
- [ ] docker-compose: rabbitmq + codebase-ocr (scale-able)
