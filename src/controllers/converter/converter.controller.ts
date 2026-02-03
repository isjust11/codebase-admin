import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ConverterService } from '../../services/converter.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';

@Controller('converter')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ConverterController {
  constructor(private readonly converterService: ConverterService) {}

  /**
   * Endpoint để chuyển đổi Word sang PDF
   * POST /converter/word-to-pdf
   */
  @Post('word-to-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // Giới hạn 50MB
      },
      fileFilter: (req, file, callback) => {
        // Kiểm tra định dạng file
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/msword', // .doc
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Chỉ chấp nhận file Word (.doc, .docx)',
            ),
            false,
          );
        }
      },
    }),
  )
  async convertWordToPdf(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      // Kiểm tra file có tồn tại không
      if (!file) {
        throw new BadRequestException('Vui lòng upload file Word');
      }

      console.log('Processing file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      // Chuyển đổi Word sang PDF
      const pdfBuffer = await this.converterService.convertWordToPdf(
        file.buffer,
        file.originalname,
      );

      // Tạo tên file PDF
      const pdfFilename = this.converterService.generatePdfFilename(
        file.originalname,
      );

      // Trả về file PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error in convertWordToPdf:', error);
      
      // Xử lý lỗi và trả về response
      const statusCode = error.status || 500;
      const message = error.message || 'Lỗi khi chuyển đổi file';

      return res.status(statusCode).json({
        status: false,
        message,
        code: statusCode,
      });
    }
  }

  /**
   * Endpoint công khai (không cần authentication) để test
   * POST /converter/word-to-pdf-public
   */
  @Post('word-to-pdf-public')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // Giới hạn 50MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Chỉ chấp nhận file Word (.doc, .docx)',
            ),
            false,
          );
        }
      },
    }),
  )
  async convertWordToPdfPublic(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Vui lòng upload file Word');
      }

      console.log('Processing file (public):', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      const pdfBuffer = await this.converterService.convertWordToPdf(
        file.buffer,
        file.originalname,
      );

      const pdfFilename = this.converterService.generatePdfFilename(
        file.originalname,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Error in convertWordToPdfPublic:', error);
      
      const statusCode = error.status || 500;
      const message = error.message || 'Lỗi khi chuyển đổi file';

      return res.status(statusCode).json({
        status: false,
        message,
        code: statusCode,
      });
    }
  }
}
