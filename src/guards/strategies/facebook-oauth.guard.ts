import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { encodeOAuthRedirectState, resolveOAuthClientOrigin } from 'src/utils/oauth-client.util';

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    // Callback already carries provider `code` + `state` — do not regenerate state.
    if (req.query?.code) return {};

    const redirect = typeof req.query?.redirect === 'string' ? req.query.redirect : '';
    const origin = resolveOAuthClientOrigin(redirect || null);
    return {
      scope: ['email'],
      state: encodeOAuthRedirectState(origin),
    };
  }
}
