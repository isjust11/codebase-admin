# Word to PDF Conversion API

API này cho phép chuyển đổi file Word (.doc, .docx) sang định dạng PDF trên server.

## Endpoints

### 1. Chuyển đổi Word sang PDF (Có Authentication)

**Endpoint:** `POST /converter/word-to-pdf`

**Authentication:** Required (JWT Token)

**Permission:** `CREATE` on `media`

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers:
  ```
  Authorization: Bearer <jwt_token>
  ```
- Body:
  - `file`: File Word (.doc hoặc .docx) - Required

**Response:**
- Success: File PDF được trả về dưới dạng binary stream
- Headers:
  ```
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="<tên_file>.pdf"
  Content-Length: <kích_thước_file>
  ```

**Error Response:**
```json
{
  "status": false,
  "message": "Lỗi khi chuyển đổi file",
  "code": 500
}
```

---

### 2. Chuyển đổi Word sang PDF (Public - Không cần Authentication)

**Endpoint:** `POST /converter/word-to-pdf-public`

**Authentication:** Not Required

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File Word (.doc hoặc .docx) - Required

**Response:**
Tương tự endpoint có authentication

---

## Giới hạn

- **Kích thước file tối đa:** 50MB
- **Định dạng file được hỗ trợ:**
  - `.doc` (Microsoft Word 97-2003)
  - `.docx` (Microsoft Word 2007+)

---

## Cách sử dụng

### 1. Sử dụng cURL

```bash
# Với authentication
curl -X POST http://localhost:3000/converter/word-to-pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/document.docx" \
  --output output.pdf

# Không cần authentication (public endpoint)
curl -X POST http://localhost:3000/converter/word-to-pdf-public \
  -F "file=@/path/to/your/document.docx" \
  --output output.pdf
```

### 2. Sử dụng JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function convertWordToPdf(filePath: string, token?: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const headers: any = {
    ...formData.getHeaders(),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = token 
    ? 'http://localhost:3000/converter/word-to-pdf'
    : 'http://localhost:3000/converter/word-to-pdf-public';

  const response = await axios.post(endpoint, formData, {
    headers,
    responseType: 'arraybuffer', // Để nhận binary data
  });

  // Lưu file PDF
  fs.writeFileSync('output.pdf', response.data);
  console.log('PDF đã được tạo thành công!');
}

// Sử dụng
convertWordToPdf('./document.docx', 'YOUR_JWT_TOKEN');
```

### 3. Sử dụng Postman

1. Chọn method: `POST`
2. URL: `http://localhost:3000/converter/word-to-pdf-public`
3. Tab "Headers":
   - Nếu cần authentication, thêm: `Authorization: Bearer YOUR_TOKEN`
4. Tab "Body":
   - Chọn `form-data`
   - Key: `file` (chọn type là `File`)
   - Value: Chọn file Word từ máy tính
5. Click "Send"
6. Click "Save Response" -> "Save to a file" để lưu PDF

### 4. Sử dụng từ Flutter App

```dart
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

Future<File?> convertWordToPdf(File wordFile) async {
  try {
    final dio = Dio();
    
    // Tạo FormData
    FormData formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        wordFile.path,
        filename: wordFile.path.split('/').last,
      ),
    });

    // Gọi API
    final response = await dio.post(
      'https://your-server.com/converter/word-to-pdf-public',
      data: formData,
      options: Options(
        responseType: ResponseType.bytes,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      ),
    );

    // Lưu file PDF
    final directory = await getApplicationDocumentsDirectory();
    final pdfPath = '${directory.path}/converted_${DateTime.now().millisecondsSinceEpoch}.pdf';
    final pdfFile = File(pdfPath);
    await pdfFile.writeAsBytes(response.data);

    print('PDF saved at: $pdfPath');
    return pdfFile;
  } catch (e) {
    print('Error converting Word to PDF: $e');
    return null;
  }
}
```

---

## Quy trình chuyển đổi

1. **Client gửi file Word** lên server qua endpoint
2. **Server nhận file** và validate:
   - Kiểm tra định dạng file
   - Kiểm tra kích thước file
3. **Chuyển đổi Word sang HTML** sử dụng thư viện `mammoth`
4. **Chuyển đổi HTML sang PDF** sử dụng `html-pdf-node` (puppeteer)
5. **Trả về file PDF** cho client

---

## Lưu ý

1. **Performance:**
   - Quá trình chuyển đổi có thể mất vài giây tùy thuộc vào kích thước và độ phức tạp của file
   - Server cần có đủ RAM để xử lý file lớn

2. **Dependencies:**
   - Server cần cài đặt Chromium (được tự động cài qua puppeteer)
   - Đảm bảo server có quyền ghi vào thư mục tạm

3. **Định dạng:**
   - File `.docx` được hỗ trợ tốt hơn `.doc`
   - Một số định dạng phức tạp trong Word có thể không được giữ nguyên 100%
   - Hình ảnh, bảng biểu, và định dạng cơ bản được hỗ trợ tốt

4. **Security:**
   - Endpoint public (`/word-to-pdf-public`) nên được giới hạn rate limit trong production
   - Cân nhắc thêm các biện pháp bảo mật như virus scanning

---

## Troubleshooting

### Lỗi "Chỉ chấp nhận file Word"
- Đảm bảo file có extension `.doc` hoặc `.docx`
- Kiểm tra MIME type của file

### Lỗi kích thước file
- File phải nhỏ hơn 50MB
- Nén file hoặc chia nhỏ nội dung nếu cần

### Lỗi chuyển đổi
- Kiểm tra file Word có bị lỗi không
- Thử mở file bằng Microsoft Word hoặc LibreOffice
- Kiểm tra logs server để xem chi tiết lỗi

### Server không khởi động được
- Chạy `npm install` để cài đặt dependencies
- Kiểm tra log lỗi khi start server
- Đảm bảo port không bị chiếm dụng

---

## Cải tiến trong tương lai

- [ ] Hỗ trợ batch conversion (chuyển đổi nhiều file cùng lúc)
- [ ] Thêm options cho PDF (page size, margins, orientation)
- [ ] Hỗ trợ thêm định dạng: Excel, PowerPoint
- [ ] Thêm preview trước khi download
- [ ] Lưu lịch sử chuyển đổi
- [ ] Compress PDF output
- [ ] Watermark options
