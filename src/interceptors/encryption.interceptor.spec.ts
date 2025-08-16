import { EncryptionInterceptor } from './encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

describe('EncryptionInterceptor', () => {
  let interceptor: EncryptionInterceptor;

  beforeEach(() => {
    interceptor = new EncryptionInterceptor();
  });

  describe('encryptEntity', () => {
    it('should handle null and undefined values', () => {
      const result = (interceptor as any).encryptEntity(null);
      expect(result).toBeNull();

      const result2 = (interceptor as any).encryptEntity(undefined);
      expect(result2).toBeUndefined();
    });

    it('should encrypt simple ID fields', () => {
      const entity = { id: 123, name: 'Test' };
      const result = (interceptor as any).encryptEntity(entity);
      
      expect(result.id).toBe(Base64EncryptionUtil.encrypt('123'));
      expect(result.name).toBe('Test');
    });

    it('should encrypt ID fields ending with Id', () => {
      const entity = { 
        id: 123, 
        authorId: 456, 
        categoryId: 789,
        name: 'Test' 
      };
      const result = (interceptor as any).encryptEntity(entity);
      
      expect(result.id).toBe(Base64EncryptionUtil.encrypt('123'));
      expect(result.authorId).toBe(Base64EncryptionUtil.encrypt('456'));
      expect(result.categoryId).toBe(Base64EncryptionUtil.encrypt('789'));
      expect(result.name).toBe('Test');
    });

    it('should handle arrays', () => {
      const entities = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      const result = (interceptor as any).encryptEntity(entities);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(Base64EncryptionUtil.encrypt('1'));
      expect(result[1].id).toBe(Base64EncryptionUtil.encrypt('2'));
    });

    it('should handle nested objects without infinite recursion', () => {
      const author = { id: 1, name: 'Author' };
      const herbal = { 
        id: 2, 
        name: 'Herbal',
        authorId: 1,
        author: author // Circular reference
      };
      
      // This should not cause infinite recursion
      const result = (interceptor as any).encryptEntity(herbal);
      
      expect(result.id).toBe(Base64EncryptionUtil.encrypt('2'));
      expect(result.authorId).toBe(Base64EncryptionUtil.encrypt('1'));
      expect(result.author.id).toBe(Base64EncryptionUtil.encrypt('1'));
      expect(result.author.name).toBe('Author');
    });

    it('should handle circular references', () => {
      const obj1: any = { id: 1, name: 'Object 1' };
      const obj2: any = { id: 2, name: 'Object 2' };
      
      // Create circular reference
      obj1.ref = obj2;
      obj2.ref = obj1;
      
      // This should not cause infinite recursion
      const result = (interceptor as any).encryptEntity(obj1);
      
      expect(result.id).toBe(Base64EncryptionUtil.encrypt('1'));
      expect(result.name).toBe('Object 1');
      expect(result.ref.id).toBe(Base64EncryptionUtil.encrypt('2'));
      expect(result.ref.name).toBe('Object 2');
      expect(result.ref.ref).toBeDefined(); // Should not cause infinite loop
    });

    it('should respect depth limit', () => {
      // Create deeply nested object
      let deepObj: any = { id: 1, name: 'Deep' };
      let current = deepObj;
      
      for (let i = 0; i < 15; i++) {
        current.nested = { id: i + 2, name: `Level ${i + 2}` };
        current = current.nested;
      }
      
      // This should not cause stack overflow
      const result = (interceptor as any).encryptEntity(deepObj);
      
      expect(result.id).toBe(Base64EncryptionUtil.encrypt('1'));
      expect(result.nested).toBeDefined();
      // Should stop encrypting at depth 10
    });

    it('should handle Date objects correctly', () => {
      const date = new Date('2024-01-01');
      const entity = { 
        id: 123, 
        createdAt: date,
        updatedAt: date
      };
      
      const result = (interceptor as any).encryptEntity(entity);
      
      expect(result.id).toBe(Base64EncryptionUtil.encrypt('123'));
      expect(result.createdAt).toBe(date); // Should not be encrypted
      expect(result.updatedAt).toBe(date); // Should not be encrypted
    });

    it('should handle pagination data structure', () => {
      const paginationData = {
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ],
        total: 2,
        page: 1,
        size: 10
      };
      
      const result = (interceptor as any).encryptEntity(paginationData);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(Base64EncryptionUtil.encrypt('1'));
      expect(result.data[1].id).toBe(Base64EncryptionUtil.encrypt('2'));
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });
  });
});
