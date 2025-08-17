import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Bỏ qua khi data là đối tượng Response/stream hoặc buffer
        if (!data) return data;
        const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(data as any);
        const isStream = typeof (data as any)?.pipe === 'function';
        const isHttpResponseLike = typeof (data as any)?.setHeader === 'function' && typeof (data as any)?.end === 'function';
        if (isBuffer || isStream || isHttpResponseLike) {
          return data;
        }

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

  private encryptEntity(entity: any, depth: number = 0, visited: WeakSet<any> = new WeakSet()): any {
    // Giới hạn độ sâu để tránh stack overflow
    if (depth > 10) {
      console.warn('Encryption depth limit reached, stopping encryption for this branch');
      return entity;
    }

    if (!entity) return entity;

    // Kiểm tra vòng lặp để tránh infinite recursion
    if (typeof entity === 'object' && visited.has(entity)) {
      return entity;
    }

    if (typeof entity === 'object') {
      // Đánh dấu entity đã được xử lý
      visited.add(entity);

      // Tạo bản sao để tránh thay đổi entity gốc
      const encryptedEntity = { ...entity };

      // Mã hóa ID chính
      if (encryptedEntity.id && typeof encryptedEntity.id === 'number') {
        encryptedEntity.id = Base64EncryptionUtil.encrypt(encryptedEntity.id);
      }

      // Mã hóa các trường ID
      const idFields = Object.keys(encryptedEntity).filter(key => key.endsWith('Id'));
      idFields.forEach(field => {
        const value = encryptedEntity[field];
        if (value && typeof value === 'number' && value.toString().length < 10) {
          encryptedEntity[field] = Base64EncryptionUtil.encrypt(value.toString());
        }
      });

      // Mã hóa các trường quan hệ với kiểm tra vòng lặp
      Object.keys(encryptedEntity).forEach(key => {
        const value = encryptedEntity[key];
        
        // Bỏ qua các trường đặc biệt có thể gây vòng lặp
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return;
        }

        // Bỏ qua các trường không cần mã hóa
        if (key === 'createdAt' || key === 'updatedAt' || key === 'deletedAt') {
          return;
        }

        if (typeof value === 'object' && value !== null) {
          // Kiểm tra xem có phải là Date object không
          if (value instanceof Date) {
            return;
          }

          if (Array.isArray(value)) {
            encryptedEntity[key] = value.map(item => this.encryptEntity(item, depth + 1, visited));
          } else {
            // Kiểm tra xem object này đã được xử lý chưa
            if (!visited.has(value)) {
              encryptedEntity[key] = this.encryptEntity(value, depth + 1, visited);
            }
          }
        }
      });

      return encryptedEntity;
    }

    return entity;
  }
} 