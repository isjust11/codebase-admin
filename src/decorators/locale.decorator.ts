import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupportedLocale } from 'src/constants/messages';

/**
 * Parameter decorator that extracts the preferred locale from the
 * `Accept-Language` request header (e.g. "vi", "en", "en-US").
 *
 * Falls back to 'vi' if the header is absent or the value is unsupported.
 *
 * Usage in controller:
 *   async createBook(@Locale() locale: SupportedLocale, ...) { ... }
 */
export const Locale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupportedLocale => {
    const request = ctx.switchToHttp().getRequest();
    const header: string = request.headers['accept-language'] ?? '';
    // Take the primary tag only (e.g. "en-US" → "en")
    const primary = header.split(',')[0].trim().split('-')[0].toLowerCase();
    const supported: SupportedLocale[] = ['vi', 'en'];
    return supported.includes(primary as SupportedLocale)
      ? (primary as SupportedLocale)
      : 'vi';
  },
);
