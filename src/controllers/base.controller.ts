import { UseInterceptors } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { EncryptionInterceptor } from '../interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

// Decorator để áp dụng interceptor cho tất cả controller kế thừa
@UseInterceptors(ClassSerializerInterceptor, EncryptionInterceptor)
export abstract class BaseController {
  // Hàm trả về response thành công
  protected success<T>(data: T, message = 'Thành công') {
    return {
      status: true,
      message,
      data,
    };
  }

  // Hàm trả về response lỗi
  protected error(message = 'Có lỗi xảy ra', code = 400) {
    return {
      status: false,
      message,
      code,
    };
  }

  // Hàm trả về response phân trang
  protected paginate<T>(data: T[], total: number, page: number, size: number, message = 'Thành công') {
    return {
      status: true,
      message,
      data,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  protected decode(id: string) {
    return parseInt(Base64EncryptionUtil.decrypt(id));
  }
} 