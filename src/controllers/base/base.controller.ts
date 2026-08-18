import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { Response } from 'express';

export abstract class BaseController {
  protected success<T>(res: Response, data: T, code = 200) {
    data = this.encryptData(data) as T;
    return res.status(code).json(data);
  }

  // Hàm trả về response lỗi
  protected error(res: Response, error: any) {
    try {
      const { status, message, data, code, statusCode } = error;
      return res.status(status).json({
        status,
        message,
        code,
        statusCode,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: 'Internal server error',
        code: 500,
        data: error,
      });
    }
  }

  // Hàm trả về response phân trang
  protected paginate<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    size: number,
    message = 'Thành công',
    code = 200,
  ) {
    const encryptedData = Array.isArray(data)
      ? data.map((item) => this.encryptEntity(item))
      : data;
    return res.status(code).json({
      status: true,
      message,
      data: encryptedData,
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
    try {
      const numericValue = Number(id);
      if (Number.isFinite(numericValue)) {
        return numericValue;
      }

      const decryptedValue = Base64EncryptionUtil.decrypt(id);
      return Number.isFinite(decryptedValue) ? decryptedValue : 0;
    } catch (error) {
      return 0;
    }
  }

  protected decodeStr(id: string) {
    return Base64EncryptionUtil.decrypt(id);
  }

  protected encryptData(dataInput: any) {
    // Bỏ qua khi data là đối tượng Response/stream hoặc buffer
    if (!dataInput) return dataInput;
    const isBuffer =
      typeof Buffer !== 'undefined' && Buffer.isBuffer(dataInput);
    const isStream = typeof dataInput?.pipe === 'function';
    const isHttpResponseLike =
      typeof dataInput?.setHeader === 'function' &&
      typeof dataInput?.end === 'function';
    if (isBuffer || isStream || isHttpResponseLike) {
      return dataInput;
    }

    if (Array.isArray(dataInput)) {
      return dataInput.map((item) => this.encryptEntity(item));
    }
    if (
      dataInput &&
      typeof dataInput === 'object' &&
      'data' in dataInput &&
      Array.isArray(dataInput.data)
    ) {
      const encryptedArray = dataInput.data.map((item: any) =>
        this.encryptEntity(item),
      );
      dataInput.data = encryptedArray;
      return dataInput;
    }
    return this.encryptEntity(dataInput);
  }

  protected encryptEntity(
    entity: any,
    depth: number = 0,
    visited: WeakSet<any> = new WeakSet(),
  ): any {
    // Giới hạn độ sâu để tránh stack overflow
    if (depth > 5) {
      console.warn(
        'Encryption depth limit reached, stopping encryption for this branch',
      );
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
      const idFields = Object.keys(encryptedEntity).filter((key) =>
        key.endsWith('Id'),
      );
      idFields.forEach((field) => {
        const value = encryptedEntity[field];
        if (
          value &&
          typeof value === 'number' &&
          value.toString().length < 10
        ) {
          encryptedEntity[field] = Base64EncryptionUtil.encrypt(
            value.toString(),
          );
        }
      });

      // Mã hóa các trường quan hệ với kiểm tra vòng lặp
      Object.keys(encryptedEntity).forEach((key) => {
        const value = encryptedEntity[key];

        // Bỏ qua các trường đặc biệt có thể gây vòng lặp
        if (
          key === '__proto__' ||
          key === 'constructor' ||
          key === 'prototype'
        ) {
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
            encryptedEntity[key] = value.map((item) =>
              this.encryptEntity(item, depth + 1, visited),
            );
          } else {
            // Kiểm tra xem object này đã được xử lý chưa
            if (!visited.has(value)) {
              encryptedEntity[key] = this.encryptEntity(
                value,
                depth + 1,
                visited,
              );
            }
          }
        }
      });

      return encryptedEntity;
    }

    return entity;
  }
}
