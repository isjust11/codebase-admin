import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        if (Array.isArray(data)) {
          return data.map(item => this.encryptEntity(item));
        }
        if (data && Array.isArray(data.data)) {
          const encryptData = data.data.map(item => this.encryptEntity(item));
          data.data = encryptData;
          return data
        }
        return this.encryptEntity(data);
      }),
    );
  }

  private encryptEntity(entity: any): any {
    if (!entity) return entity;

    if (typeof entity === 'object') {
      // Không tạo object mới nếu entity đã là class instance
      const encryptedEntity = entity;

      // Mã hóa ID chính
      if (encryptedEntity.id) {
        encryptedEntity.id = Base64EncryptionUtil.encrypt(encryptedEntity.id);
      }

      // Mã hóa các trường ID
      const idFields = Object.keys(encryptedEntity).filter(key => key.endsWith('Id'));
      idFields.forEach(field => {
        if (encryptedEntity[field]) {
          encryptedEntity[field] = Base64EncryptionUtil.encrypt(encryptedEntity[field].toString());
        }
      });

      // Mã hóa các trường quan hệ
      Object.keys(encryptedEntity).forEach(key => {
        if (typeof encryptedEntity[key] === 'object' && encryptedEntity[key] !== null) {
          if (Array.isArray(encryptedEntity[key])) {
            encryptedEntity[key] = encryptedEntity[key].map(item => this.encryptEntity(item));
          } else {
            encryptedEntity[key] = this.encryptEntity(encryptedEntity[key]);
          }
        }
      });

      return encryptedEntity;
    }

    return entity;
  }
} 