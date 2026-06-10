/**
 * Chuẩn hóa chuỗi để so khớp các tên file ebook đến từ nhiều nguồn khác nhau:
 *  - Bỏ dấu tiếng Việt (NFD + xóa combining marks).
 *  - Thay 'đ' / 'Đ' thành 'd'.
 *  - Lowercase.
 *  - Xóa mọi ký tự không phải chữ-số (gồm cả khoảng trắng, gạch ngang, dấu …).
 */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Khóa định danh "cùng một quyển sách" giữa các định dạng/nguồn khác nhau.
 * `title|author` (đã normalize). Nếu author rỗng vẫn giữ dấu `|` để tránh nhập nhằng.
 */
export function buildMatchKey(title: string, author?: string | null): string {
  return `${normalizeText(title)}|${normalizeText(author || '')}`;
}

/**
 * Trích phần có khả năng là tác giả từ tên file dạng "Title - Author.ext".
 * Trả về `null` nếu không có dấu " - " phân tách.
 */
export function guessAuthorFromFilename(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, '');
  const parts = base.split(/\s+[-–—]\s+/);
  if (parts.length < 2) return null;
  return parts[parts.length - 1].trim();
}

/**
 * Trích phần tựa sách từ tên file (loại bỏ phần " - Author" cuối, loại bỏ extension).
 */
export function guessTitleFromFilename(filename: string): string {
  let base = filename.replace(/\.[^.]+$/, '');

  // Remove Sachvui.com domain
  base = base.replace(/sachvui\.com/ig, '');

  const parts = base.split(/\s+[-–—]\s+/);
  let title = '';
  if (parts.length >= 2) {
    title = parts.slice(0, -1).join(' ');
  } else {
    title = base;
  }

  // Replace hyphens with spaces and remove extra spaces
  return title.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}
