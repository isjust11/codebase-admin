import * as CryptoJS from 'crypto-js';

export class EncryptionUtil {
  private static readonly SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key';

  static encrypt(text: string | number): string {
    const textToEncrypt = text.toString();
    return CryptoJS.AES.encrypt(textToEncrypt, this.SECRET_KEY).toString();
  }

  static decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
} 