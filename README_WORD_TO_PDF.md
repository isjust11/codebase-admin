# Word to PDF Conversion Feature

Tính năng chuyển đổi file Word (.doc, .docx) sang PDF trên server NestJS.

## 📋 Tổng quan

Hệ thống này cho phép chuyển đổi file Word sang PDF thông qua API RESTful. Được xây dựng với:
- **Backend:** NestJS + TypeScript
- **Libraries:** mammoth (Word to HTML) + html-pdf-node (HTML to PDF)
- **Frontend Support:** Flutter, JavaScript, cURL, Postman

## 🚀 Cài đặt

### 1. Cài đặt Dependencies

```bash
cd d:\Develops\codebase\codebase-admin
npm install
```

Các package đã được cài đặt:
- `mammoth` - Chuyển đổi .docx sang HTML
- `html-pdf-node` - Chuyển đổi HTML sang PDF
- `he` - HTML entity encoding/decoding

### 2. Build Project

```bash
npm run build
```

### 3. Start Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

Server sẽ chạy tại: `http://localhost:3000` (hoặc port bạn đã cấu hình)

## 📁 Cấu trúc File

```
src/
├── controllers/
│   └── converter/
│       └── converter.controller.ts    # HTTP endpoints
├── services/
│   └── converter.service.ts           # Business logic
├── modules/
│   └── converter.module.ts            # Module definition
└── app.module.ts                      # Import ConverterModule

docs/
├── WORD_TO_PDF_API.md                 # API Documentation
├── FLUTTER_INTEGRATION_EXAMPLE.dart   # Flutter example
├── test-converter.html                # Web testing tool
└── README_WORD_TO_PDF.md             # This file
```

## 🌐 API Endpoints

### 1. POST `/converter/word-to-pdf` (Protected)

Chuyển đổi Word sang PDF với authentication.

**Request:**
```bash
curl -X POST http://localhost:3000/converter/word-to-pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.docx" \
  --output output.pdf
```

**Requirements:**
- Authentication: JWT Token
- Permission: `CREATE` on `media`

### 2. POST `/converter/word-to-pdf-public` (Public)

Chuyển đổi Word sang PDF không cần authentication (để test).

**Request:**
```bash
curl -X POST http://localhost:3000/converter/word-to-pdf-public \
  -F "file=@document.docx" \
  --output output.pdf
```

**⚠️ Lưu ý:** Endpoint public nên được bảo vệ bằng rate limiting trong production.

## 🧪 Testing

### Cách 1: Sử dụng Web Test Tool

1. Mở file `docs/test-converter.html` bằng browser
2. Kéo thả file Word vào hoặc click để chọn file
3. Điều chỉnh API URL nếu cần
4. Click "Chuyển đổi ngay"
5. Tải xuống file PDF

### Cách 2: Sử dụng cURL

```bash
# Test với file local
curl -X POST http://localhost:3000/converter/word-to-pdf-public \
  -F "file=@/path/to/your/document.docx" \
  --output result.pdf
```

### Cách 3: Sử dụng Postman

1. Method: `POST`
2. URL: `http://localhost:3000/converter/word-to-pdf-public`
3. Body → form-data:
   - Key: `file` (type: File)
   - Value: Chọn file Word
4. Send
5. Save Response → Save to a file

## 📱 Tích hợp với Flutter

Xem file chi tiết: `docs/FLUTTER_INTEGRATION_EXAMPLE.dart`

### Quick Start

```dart
import 'word_to_pdf_service.dart';

// Khởi tạo service
final service = WordToPdfService(
  baseUrl: 'https://your-server.com',
);

// Chuyển đổi file
final pdfPath = await service.convertWordToPdf(
  wordFile: File('/path/to/document.docx'),
  usePublicEndpoint: true,
  onProgress: (sent, total) {
    print('Progress: ${(sent/total*100).toFixed(2)}%');
  },
);

print('PDF saved at: $pdfPath');
```

## ⚙️ Cấu hình

### Giới hạn

Trong `converter.controller.ts`:

```typescript
FileInterceptor('file', {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  ...
})
```

Để thay đổi giới hạn kích thước file, điều chỉnh giá trị `fileSize`.

### PDF Options

Trong `converter.service.ts`, method `convertWordToPdf`:

```typescript
const options = {
  format: 'A4',           // A4, Letter, Legal, ...
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm',
  },
  printBackground: true,
  preferCSSPageSize: true,
};
```

### Styles

CSS cho PDF được định nghĩa trong method `wrapHtmlWithStyles`.
Có thể tùy chỉnh:
- Font family, size
- Line height
- Margins
- Colors
- Table styles
- Image rendering

## 🔒 Security

### Production Checklist

- [ ] **Rate Limiting:** Thêm rate limit cho endpoint public
  ```typescript
  import { ThrottlerModule } from '@nestjs/throttler';
  
  ThrottlerModule.forRoot({
    ttl: 60,
    limit: 10, // 10 requests per minute
  })
  ```

- [ ] **File Validation:** Kiểm tra kỹ MIME type và extension
- [ ] **Virus Scanning:** Tích hợp antivirus scanner
- [ ] **File Size:** Đảm bảo limit phù hợp với server resources
- [ ] **Authentication:** Sử dụng endpoint có auth trong production
- [ ] **CORS:** Cấu hình CORS đúng domain
- [ ] **HTTPS:** Chỉ sử dụng HTTPS trong production

## 🐛 Troubleshooting

### Error: "Chỉ chấp nhận file Word"

**Nguyên nhân:** File không đúng định dạng hoặc MIME type không hợp lệ

**Giải pháp:**
- Đảm bảo file có extension `.doc` hoặc `.docx`
- Kiểm tra file không bị corrupt

### Error: "File quá lớn"

**Nguyên nhân:** File vượt quá 50MB

**Giải pháp:**
- Nén file Word (remove unused media, compress images)
- Tăng limit trong config (nếu server đủ mạnh)

### Error: "Lỗi khi chuyển đổi file"

**Nguyên nhân:** 
- File Word bị lỗi
- Thiếu dependencies
- Server không đủ resources

**Giải pháp:**
1. Kiểm tra log server để xem chi tiết lỗi
2. Thử mở file bằng Microsoft Word
3. Chạy lại `npm install`
4. Kiểm tra RAM và CPU server

### Server không khởi động

**Nguyên nhân:** Dependencies chưa được cài đặt đúng

**Giải pháp:**
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
npm run start:dev
```

### Puppeteer/Chromium issues

**Nguyên nhân:** Chromium không được cài đặt tự động

**Giải pháp:**
```bash
# Reinstall puppeteer
npm uninstall puppeteer
npm install puppeteer --save

# Linux: Install dependencies
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libxss1 libxtst6 ca-certificates \
  fonts-liberation libappindicator1 libnss3 lsb-release \
  xdg-utils wget
```

## 📊 Performance

### Benchmarks (approximate)

| File Size | Conversion Time | Memory Usage |
|-----------|----------------|--------------|
| < 1MB     | 2-5 seconds    | ~100MB       |
| 1-5MB     | 5-15 seconds   | ~200MB       |
| 5-20MB    | 15-45 seconds  | ~500MB       |
| 20-50MB   | 45-120 seconds | ~1GB         |

**Lưu ý:** Thời gian thực tế phụ thuộc vào:
- Độ phức tạp của document (số lượng hình ảnh, bảng biểu)
- Cấu hình server (CPU, RAM)
- Network speed (upload time)

### Optimization Tips

1. **Caching:** Cache kết quả chuyển đổi nếu file không thay đổi
2. **Queue:** Sử dụng queue (Bull, BullMQ) cho batch processing
3. **Scaling:** Deploy multiple instances với load balancer
4. **CDN:** Lưu PDF output lên CDN/S3

## 🔄 Roadmap

- [x] Basic Word to PDF conversion
- [x] Public and protected endpoints
- [x] Flutter integration example
- [x] Web test tool
- [ ] Batch conversion (multiple files)
- [ ] Advanced PDF options (watermark, password)
- [ ] Excel to PDF support
- [ ] PowerPoint to PDF support
- [ ] PDF preview before download
- [ ] Conversion history tracking
- [ ] Email notification when done
- [ ] Webhook support
- [ ] Docker containerization

## 📚 Documentation

- [API Documentation](./docs/WORD_TO_PDF_API.md)
- [Flutter Integration](./docs/FLUTTER_INTEGRATION_EXAMPLE.dart)
- [Web Test Tool](./docs/test-converter.html)

## 🤝 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra section Troubleshooting
2. Xem logs server
3. Tạo issue với thông tin chi tiết

## 📝 License

Proprietary - Internal Use Only
