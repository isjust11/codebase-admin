import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { EncryptionUtil } from '../utils/encryption.util';

export const DecryptId = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const id = request.params[data];
    
    if (id) {
      try {
        return EncryptionUtil.decrypt(id);
      } catch (error) {
        throw new Error('Invalid encrypted ID');
      }
    }
    return id;
  },
); 