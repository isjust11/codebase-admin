import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as htmlPdf from 'html-pdf-node';
import { Buffer } from 'buffer';
import * as libre from 'libreoffice-convert';
import * as path from 'path';
@Injectable()
export class ConverterService {
  /**
   * Chuyển đổi file Word (.docx) sang PDF
   * @param buffer Buffer của file Word
   * @param filename Tên file gốc
   * @returns Buffer của file PDF
   */
  async convertWordToPdf(buffer: Buffer, filename: string): Promise<Buffer> {
    try {
      const ext = path.extname(filename).toLowerCase();
  
      if (ext === '.docx') {
        // GIỮ NGUYÊN luồng cũ dùng mammoth cho .docx
        const result = await mammoth.convertToHtml({ buffer });
        const html = result.value;
        const styledHtml = this.wrapHtmlWithStyles(html);
  
        const options = {
          format: 'A4',
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
          printBackground: true,
          preferCSSPageSize: true,
        };
  
        const file = { content: styledHtml };
        const pdfBuffer = await htmlPdf.generatePdf(file, options);
        return pdfBuffer;
      }
  
      if (ext === '.doc') {
        // Dùng LibreOffice để convert trực tiếp .doc -> .pdf
        try {
          const pdfBuf = await this.convertWithLibreOffice(buffer, '.pdf');
          return pdfBuf;
        } catch (libreError: any) {
          const msg = libreError?.message ?? '';
          // LibreOffice chưa cài đúng hoặc Python cấu hình sai (thường gặp trên Windows)
          if (
            msg.includes('soffice') ||
            msg.includes('platform independent libraries') ||
            msg.includes('Document is empty')
          ) {
            throw new BadRequestException(
              'Chuyển đổi file .doc cần cài LibreOffice. Vui lòng cài LibreOffice (https://www.libreoffice.org) hoặc gửi file .docx thay vì .doc.',
            );
          }
          throw libreError;
        }
      }

      throw new BadRequestException('Chỉ hỗ trợ file .docx hoặc .doc');
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error converting Word to PDF:', error);
      throw new BadRequestException(
        `Lỗi khi chuyển đổi file: ${error.message || 'Unknown error'}`,
      );
    }
  }

  private convertWithLibreOffice(input: Buffer, outputExt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      libre.convert(input, outputExt, undefined, (err, done) => {
        if (err) {
          console.error('LibreOffice convert error:', err);
          return reject(err);
        }
        resolve(done as Buffer);
      });
    });
  }

  /**
   * Wrap HTML content với styles để đảm bảo hiển thị đẹp
   */
  private wrapHtmlWithStyles(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: white;
            padding: 0;
            margin: 0;
        }
        
        p {
            margin-bottom: 12pt;
            text-align: justify;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 18pt;
            margin-bottom: 12pt;
            font-weight: bold;
            line-height: 1.3;
        }
        
        h1 { font-size: 24pt; }
        h2 { font-size: 20pt; }
        h3 { font-size: 16pt; }
        h4 { font-size: 14pt; }
        h5 { font-size: 12pt; }
        h6 { font-size: 11pt; }
        
        ul, ol {
            margin-left: 24pt;
            margin-bottom: 12pt;
        }
        
        li {
            margin-bottom: 6pt;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 12pt;
        }
        
        table, th, td {
            border: 1px solid #000;
        }
        
        th, td {
            padding: 8pt;
            text-align: left;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 12pt auto;
        }
        
        a {
            color: #0066cc;
            text-decoration: underline;
        }
        
        strong, b {
            font-weight: bold;
        }
        
        em, i {
            font-style: italic;
        }
        
        u {
            text-decoration: underline;
        }
        
        blockquote {
            margin: 12pt 24pt;
            padding-left: 12pt;
            border-left: 4pt solid #ccc;
            font-style: italic;
        }
        
        code {
            font-family: 'Courier New', Courier, monospace;
            background-color: #f5f5f5;
            padding: 2pt 4pt;
            border-radius: 3pt;
        }
        
        pre {
            font-family: 'Courier New', Courier, monospace;
            background-color: #f5f5f5;
            padding: 12pt;
            border-radius: 4pt;
            overflow-x: auto;
            margin-bottom: 12pt;
        }
        
        hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 18pt 0;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `.trim();
  }

  /**
   * Validate file type
   */
  validateFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return allowedTypes.includes(`.${ext}`);
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.toLowerCase().split('.').pop() || '';
  }

  /**
   * Generate output filename
   */
  generatePdfFilename(originalFilename: string): string {
    const nameWithoutExt = originalFilename.replace(/\.(docx?|DOCX?)$/, '');
    return `${nameWithoutExt}.pdf`;
  }
}
