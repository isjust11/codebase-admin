/**
 * Centralized message constants for multilingual support (no external package).
 * Supported locales: 'vi' (Vietnamese) | 'en' (English).
 * Default locale: 'vi'.
 *
 * Usage in service:
 *   const m = getMessages(locale);
 *   throw new BadRequestException(m.auth.accountNotFound);
 */

export type SupportedLocale = 'vi' | 'en';

const messages = {
  vi: {
    // ─── Auth ────────────────────────────────────────────────────────────────
    auth: {
      accountNotFound: 'Tài khoản không tồn tại',
      emailNotVerified: 'Email chưa được xác thực',
      accountBlocked: 'Tài khoản đã bị khóa, vui lòng liên hệ admin để được hỗ trợ',
      userNotFound: 'User không tồn tại',
      platformIdMismatch: 'Dữ liệu platformId từ mobile không khớp với token verified',
      emailNotFound: 'Không tìm thấy địa chỉ email, vui lòng thử lại',
      socialLoginFailed: 'Đăng nhập social không thành công',
      invalidCredentials: 'Tài khoản hoặc mật khẩu không chính xác',
      emailNotExist: 'Email không tồn tại',
      invalidVerificationToken: 'Token xác thực không hợp lệ',
      tokenInvalid: 'Token không hợp lệ hoặc đã hết hạn',
      refreshTokenInvalid: 'Refresh token không hợp lệ',
      refreshTokenExpired: 'Refresh token đã hết hạn',
      pinNotFound: 'Mã PIN không tồn tại hoặc đã hết hạn',
      pinExpired: 'Mã PIN đã hết hạn',
      pinInvalid: 'Mã PIN không chính xác',
      pinSent: 'Mã PIN đã được gửi đến email của bạn',
      pinResent: 'Mã PIN mới đã được gửi đến email của bạn',
      pinVerified: 'Xác thực mã PIN thành công',
      registerSuccess: 'Đăng ký thành công',
      emailVerified: 'Email đã được xác thực thành công',
      passwordResetSuccess: 'Mật khẩu đã được khôi phục thành công',
      passwordResetFailed: 'Mật khẩu đã được khôi phục thất bại!',
      accountDeleted: 'Tài khoản đã được xóa thành công',
      accountValidated: 'Tài khoản đã được xác thực, hãy đăng nhập để tiếp tục',
      accountExistNotVerified: 'Tài khoản chưa được xác thực, hãy xác thực tài khoản để tiếp tục',
      accountExist: 'Tài khoản đã tồn tại',
      emailExist: 'Email đã được đăng ký bởi tài khoản khác',
      accountNotExist: 'Tài khoản chưa tồn tại',
    },

    // ─── Book ────────────────────────────────────────────────────────────────
    book: {
      titleRequired: 'Tiêu đề sách không được để trống',
      authorRequired: 'Tác giả không được để trống',
      fileRequired: 'File sách không được để trống',
      categoryNotFound: 'Danh mục không tồn tại',
      bookNotFound: 'Sách không tồn tại',
      statusInvalid: 'Trạng thái không hợp lệ',
    },

    // ─── Subscription / Storage ──────────────────────────────────────────────
    subscription: {
      noActiveSubscription: 'Bạn chưa có gói đăng ký đang hoạt động. Vui lòng đăng ký gói để tải sách lên.',
      storageFull: (usedMB: string, limitMB: string) =>
        `Dung lượng lưu trữ đã đầy (${usedMB}MB / ${limitMB}MB). Vui lòng nâng cấp gói.`,
      planNotFound: 'Gói dịch vụ không tồn tại',
      planNotAvailable: 'Gói dịch vụ không khả dụng',
      alreadySubscribed: 'Người dùng đã có gói đăng ký cho plan này',
      subscriptionNotFound: 'Gói đăng ký không tồn tại',
    },

    // ─── Social Token Verification ───────────────────────────────────────────
    social: {
      invalidGoogleToken: 'Google token không hợp lệ hoặc thiếu dữ liệu người dùng',
      googleVerificationFailed: 'Xác thực Google token thất bại',
      invalidFacebookToken: 'Facebook token không hợp lệ hoặc thiếu dữ liệu người dùng',
      facebookVerificationFailed: 'Xác thực Facebook token thất bại',
      facebookLimitedTokenInvalid: 'Facebook Limited Login token không hợp lệ',
      facebookLimitedNonceMismatch: 'Nonce không khớp, yêu cầu đăng nhập lại',
      invalidAppleToken: 'Token Apple không chứa ID hoặc Email',
      appleVerificationFailed: 'Xác thực token Apple thất bại',
      unsupportedPlatform: 'Nền tảng đăng nhập không được hỗ trợ',
    },

    // ─── Article ─────────────────────────────────────────────────────────────
    article: {
      articleNotFound: 'Bài viết không tồn tại',
      categoryNotFound: 'Danh mục bài viết không tồn tại',
      tipTypeNotFound: 'Loại tip không tồn tại',
    },

    // ─── Category ────────────────────────────────────────────────────────────
    category: {
      typeNotFound: 'Loại danh mục không tồn tại',
    },

    // ─── Feedback ────────────────────────────────────────────────────────────
    feedback: {
      notFound: 'Phản hồi không tồn tại',
    },

    // ─── Feature / Feature Content ───────────────────────────────────────────
    feature: {
      notFound: 'Tính năng không tồn tại',
      contentNotFound: 'Nội dung tính năng không tồn tại',
    },
    featureContent: {
      notFound: 'Nội dung tính năng không tồn tại',
    },

    // ─── Notification ────────────────────────────────────────────────────────
    notification: {
      configNotFound: 'Cấu hình thông báo không tồn tại',
      defaultConfigCannotDelete: 'Không thể xóa cấu hình mặc định',
      notificationNotFound: 'Thông báo không tồn tại',
    },

    // ─── Page ────────────────────────────────────────────────────────────────
    page: {
      notFound: 'Trang không tồn tại',
      slugAlreadyExists: 'Trang với slug này đã tồn tại',
    },

    // ─── Multi Image ─────────────────────────────────────────────────────────
    multiImage: {
      notFound: 'Ảnh không tồn tại',
    },

    // ─── User Interaction ────────────────────────────────────────────────────
    userInteraction: {
      notFound: 'Tương tác không tồn tại',
    },

    // ─── RevenueCat Webhook ──────────────────────────────────────────────────
    revenuecat: {
      noEventFound: 'Không tìm thấy sự kiện trong webhook',
    },

    // ─── Advertising Slider ──────────────────────────────────────────────────
    advertisingSlider: {
      orderInvalid: 'Thứ tự phải lớn hơn 0',
      notFound: 'Slider quảng cáo không tồn tại',
    },

    // ─── Converter ───────────────────────────────────────────────────────────
    converter: {
      unsupportedFormat: 'Chỉ hỗ trợ file .docx hoặc .doc',
      libreOfficeRequired: 'Chuyển đổi file .doc cần cài LibreOffice. Vui lòng cài LibreOffice (https://www.libreoffice.org) hoặc gửi file .docx thay vì .doc.',
      error: 'Lỗi khi chuyển đổi file',
      uploadRequired: 'Vui lòng upload file Word',
    },

    // ─── Role ────────────────────────────────────────────────────────────────
    role: {
      notFound: 'Vai trò không tồn tại',
    },

    // ─── Payment ─────────────────────────────────────────────────────────────
    payment: {
      notFound: 'Thanh toán không tồn tại',
      paymentSuccess: 'Thanh toán thành công',
      paymentBodySuccess: (planName: string) => `Thanh toán gói ${planName} thành công`,
      unsupportedPaymentMethod: 'Phương thức thanh toán không được hỗ trợ',
      invalidStatus: 'Trạng thái không hợp lệ',
    },
  },

  en: {
    // ─── Auth ────────────────────────────────────────────────────────────────
    auth: {
      accountNotFound: 'Account not found',
      emailNotVerified: 'Email has not been verified',
      accountBlocked: 'Account has been blocked, please contact admin for support',
      userNotFound: 'User not found',
      platformIdMismatch: 'Platform ID from mobile does not match verified token',
      emailNotFound: 'Email address not found, please try again',
      socialLoginFailed: 'Social login failed',
      invalidCredentials: 'Invalid username or password',
      emailNotExist: 'Email does not exist',
      invalidVerificationToken: 'Invalid verification token',
      tokenInvalid: 'Token is invalid or has expired',
      refreshTokenInvalid: 'Refresh token is invalid',
      refreshTokenExpired: 'Refresh token has expired',
      pinNotFound: 'PIN does not exist or has expired',
      pinExpired: 'PIN has expired',
      pinInvalid: 'Incorrect PIN',
      pinSent: 'PIN has been sent to your email',
      pinResent: 'A new PIN has been sent to your email',
      pinVerified: 'PIN verified successfully',
      registerSuccess: 'Registration successful',
      emailVerified: 'Email has been verified successfully',
      passwordResetSuccess: 'Password has been reset successfully',
      passwordResetFailed: 'Password reset failed!',
      accountDeleted: 'Account has been deleted successfully',
      accountValidated: 'Account is already verified, please log in to continue',
      accountExistNotVerified: 'Account is not verified, please verify to continue',
      accountExist: 'Account already exists',
      emailExist: 'Email has already been registered by another account',
      accountNotExist: 'Account does not exist',
    },

    // ─── Book ────────────────────────────────────────────────────────────────
    book: {
      titleRequired: 'Book title must not be empty',
      authorRequired: 'Author must not be empty',
      fileRequired: 'Book file must not be empty',
      categoryNotFound: 'Category not found',
      bookNotFound: 'Book not found',
      statusInvalid: 'Invalid status',
    },

    // ─── Subscription / Storage ──────────────────────────────────────────────
    subscription: {
      noActiveSubscription: 'You do not have an active subscription. Please subscribe to upload books.',
      storageFull: (usedMB: string, limitMB: string) =>
        `Storage is full (${usedMB}MB / ${limitMB}MB). Please upgrade your plan.`,
      planNotFound: 'Subscription plan not found',
      planNotAvailable: 'Subscription plan is not available',
      alreadySubscribed: 'User already has a subscription for this plan',
      subscriptionNotFound: 'Subscription not found',
    },

    // ─── Social Token Verification ───────────────────────────────────────────
    social: {
      invalidGoogleToken: 'Invalid Google token or missing user data',
      googleVerificationFailed: 'Google token verification failed',
      invalidFacebookToken: 'Invalid Facebook token or missing user data',
      facebookVerificationFailed: 'Facebook token verification failed',
      facebookLimitedTokenInvalid: 'Invalid Facebook Limited Login token',
      facebookLimitedNonceMismatch: 'Nonce mismatch, please login again',
      invalidAppleToken: 'Apple token does not contain ID or Email',
      appleVerificationFailed: 'Apple token verification failed',
      unsupportedPlatform: 'Login platform is not supported',
    },

    // ─── Article ─────────────────────────────────────────────────────────────
    article: {
      articleNotFound: 'Article not found',
      categoryNotFound: 'Article category not found',
      tipTypeNotFound: 'Tip type not found',
    },

    // ─── Category ────────────────────────────────────────────────────────────
    category: {
      typeNotFound: 'Category type not found',
    },

    // ─── Feedback ────────────────────────────────────────────────────────────
    feedback: {
      notFound: 'Feedback not found',
    },

    // ─── Feature / Feature Content ───────────────────────────────────────────
    feature: {
      notFound: 'Feature not found',
      contentNotFound: 'Feature content not found',
    },
    featureContent: {
      notFound: 'Feature content not found',
    },

    // ─── Notification ────────────────────────────────────────────────────────
    notification: {
      configNotFound: 'Notification config not found',
      defaultConfigCannotDelete: 'Default config cannot be deleted',
      notificationNotFound: 'Notification not found',
    },

    // ─── Page ────────────────────────────────────────────────────────────────
    page: {
      notFound: 'Page not found',
      slugAlreadyExists: 'Page with this slug already exists',
    },

    // ─── Multi Image ─────────────────────────────────────────────────────────
    multiImage: {
      notFound: 'Image not found',
    },

    // ─── User Interaction ────────────────────────────────────────────────────
    userInteraction: {
      notFound: 'Interaction not found',
    },

    // ─── RevenueCat Webhook ──────────────────────────────────────────────────
    revenuecat: {
      noEventFound: 'No event found in webhook body',
    },

    // ─── Advertising Slider ──────────────────────────────────────────────────
    advertisingSlider: {
      orderInvalid: 'Order must be greater than 0',
      notFound: 'Advertising slider not found',
    },

    // ─── Converter ───────────────────────────────────────────────────────────
    converter: {
      unsupportedFormat: 'Only .docx or .doc files are supported',
      libreOfficeRequired: 'Converting .doc files requires LibreOffice. Please install LibreOffice (https://www.libreoffice.org) or send a .docx file instead of .doc.',
      error: 'Error converting file',
      uploadRequired: 'Please upload a Word file',
    },

    // ─── Role ────────────────────────────────────────────────────────────────
    role: {
      notFound: 'Role not found',
    },

    // ─── Payment ─────────────────────────────────────────────────────────────
    payment: {
      notFound: 'Payment not found',
      paymentSuccess: 'Payment successful',
      paymentBodySuccess: (planName: string) => `Payment for ${planName} successful`,
      unsupportedPaymentMethod: 'Unsupported payment method',
      invalidStatus: 'Invalid status',
    },
  },
} as const;

/**
 * Returns the message dictionary for the given locale.
 * Falls back to Vietnamese if the locale is unsupported.
 */
export function getMessages(locale: SupportedLocale = 'vi') {
  return messages[locale] ?? messages['vi'];
}
