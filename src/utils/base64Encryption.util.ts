export class Base64EncryptionUtil {
    static encrypt(text: string | number): string {
        return Buffer.from(text.toString()).toString('base64');
    }

    static decrypt(encryptedText: string): string {
        return Buffer.from(encryptedText, 'base64').toString('ascii');
    }
}