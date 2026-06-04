import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    // Vérifie si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is public, skipping authentication');
      return true;
    }

    // Log request info for debugging
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Authenticating request to: ${request.url}`);
    this.logger.debug(`Authorization header: ${request.headers.authorization ? 'Present' : 'Missing'}`);
    if (request.headers.authorization && request.url.includes('revenuecat/webhook')) {
      return true;
    }
    try {
      const result = await super.canActivate(context) as boolean;
      this.logger.debug(`Authentication successful for user: ${request.user?.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw error;
    }
  }
}

// Decorator để đánh dấu route/controller là public (không cần auth)
// Hỗ trợ cả class-level (@Public() trên controller) và method-level (@Public() trên method)
export const Public = () => (target: any, key?: string, descriptor?: any) => {
  if (descriptor !== undefined) {
    // Method decorator: target=prototype, key=methodName, descriptor=PropertyDescriptor
    Reflect.defineMetadata('isPublic', true, descriptor.value);
    return descriptor;
  } else {
    // Class decorator: target=class constructor, key & descriptor are undefined
    Reflect.defineMetadata('isPublic', true, target);
    return target;
  }
};