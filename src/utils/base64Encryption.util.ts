export class Base64EncryptionUtil {
    static encrypt(text: string | number): string {
        try {
            return Buffer.from(text.toString()).toString('base64');
        } catch (error) {
            console.log(error);
            return '';
        }
    }

    static decrypt(encryptedText: string): string {
        return Buffer.from(encryptedText, 'base64').toString('ascii');
    }
}