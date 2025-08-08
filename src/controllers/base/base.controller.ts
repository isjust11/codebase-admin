import { UseInterceptors } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { EncryptionInterceptor } from '../../interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { Response } from 'express';

// Decorator để áp dụng interceptor cho tất cả controller kế thừa
@UseInterceptors(ClassSerializerInterceptor, EncryptionInterceptor)
export abstract class BaseController {
  // Hàm trả về response thành công
  protected success<T>(res: Response, data: T, code = 200) {
    return res.status(code).json(data);
  }

  // Hàm trả về response lỗi
  protected error(res: Response, code = 400) {
    return res.status(code).json();
  }

  // Hàm trả về response phân trang
  protected paginate<T>(res: Response, data: T[], total: number, page: number, size: number, message = 'Thành công', code = 200) {
    return res.status(code).json({
      status: true,
      message,
      data,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
      code,
    });
  }

  protected decode(id: string) {
    return parseInt(Base64EncryptionUtil.decrypt(id));
  }

  protected decodeStr(id: string) {
    return Base64EncryptionUtil.decrypt(id);
  }
} 