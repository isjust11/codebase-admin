import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string; // Link ảnh bìa từ Google
  modifiedTime: Date;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private driveClient: drive_v3.Drive;

  constructor(private readonly configService: ConfigService) {
    this.initializeDriveClient();
  }

  private initializeDriveClient() {
    try {
      const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');
      const projectId = this.configService.get<string>('GOOGLE_PROJECT_ID');

      if (!clientEmail || !privateKey || !projectId) {
        this.logger.warn(
          '[GoogleDrive] Google Service Account credentials not fully configured. Drive sync will be disabled.',
        );
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
        projectId: projectId,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });

      this.driveClient = google.drive({ version: 'v3', auth });
      this.logger.log('[GoogleDrive] Drive client initialized successfully.');
    } catch (error) {
      this.logger.error(`[GoogleDrive] Failed to initialize Drive client: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.driveClient;
  }

  /**
   * Liệt kê tất cả file ebook trong folder chỉ định
   * @param folderId ID thư mục Google Drive
   * @param modifiedAfter Chỉ lấy file mới hơn thời điểm này (dùng để incremental sync)
   */
  async listEbooks(folderId: string, modifiedAfter?: Date): Promise<DriveFileInfo[]> {
    if (!this.driveClient) {
      this.logger.warn('[GoogleDrive] Drive client not initialized. Skipping listEbooks.');
      return [];
    }

    const ebookMimeTypes = [
      'application/epub+zip',
      'application/pdf',
      'application/x-mobipocket-ebook',
      'application/octet-stream', // mobi, fb2, ...
    ];

    const mimeTypeQuery = ebookMimeTypes.map(t => `mimeType='${t}'`).join(' or ');
    const trimmedFolderId = folderId.trim();
    let query = `'${trimmedFolderId}' in parents and trashed=false and (${mimeTypeQuery})`;

    if (modifiedAfter) {
      query += ` and modifiedTime > '${modifiedAfter.toISOString()}'`;
    }

    this.logger.debug(`[GoogleDrive] Listing ebooks with query: ${query}`);

    const files: DriveFileInfo[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.driveClient.files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime)',
        pageToken,
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const items = response.data.files || [];
      for (const item of items) {
        if (!item.id || !item.name) continue;

        // Lọc thêm theo extension nếu mimeType không rõ ràng
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (!['epub', 'pdf', 'mobi', 'fb2'].includes(ext || '')) continue;

        files.push({
          id: item.id,
          name: item.name,
          mimeType: item.mimeType || 'application/octet-stream',
          size: parseInt(item.size || '0', 10),
          webViewLink: item.webViewLink || '',
          webContentLink: item.webContentLink || '',
          modifiedTime: new Date(item.modifiedTime || Date.now()),
          thumbnailLink: item.thumbnailLink ? item.thumbnailLink.replace('=s220', '=s600') : undefined, // Lấy ảnh to hơn (s600)
        });
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    this.logger.log(`[GoogleDrive] Found ${files.length} ebook(s) in folder ${folderId}`);
    return files;
  }

  /**
   * Tải nội dung file về dưới dạng Buffer (để đọc metadata epub/pdf)
   */
  async downloadFileBuffer(fileId: string): Promise<Buffer> {
    if (!this.driveClient) throw new Error('Drive client not initialized');

    const response = await this.driveClient.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' },
    );

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = response.data as Readable;
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Tải nội dung file về dưới dạng Stream (để tối ưu memory khi tải file lớn)
   */
  async downloadFileStream(fileId: string): Promise<Readable> {
    if (!this.driveClient) throw new Error('Drive client not initialized');

    const response = await this.driveClient.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' },
    );

    return response.data as Readable;
  }

  /**
   * Lấy metadata chi tiết của một file
   */
  async getFileMetadata(fileId: string): Promise<DriveFileInfo | null> {
    if (!this.driveClient) return null;
    try {
      const response = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, modifiedTime, thumbnailLink',
        supportsAllDrives: true,
      });
      const item = response.data;
      if (!item.id || !item.name) return null;
      return {
        id: item.id,
        name: item.name,
        mimeType: item.mimeType || 'application/octet-stream',
        size: parseInt(item.size || '0', 10),
        webViewLink: item.webViewLink || '',
        webContentLink: item.webContentLink || '',
        modifiedTime: new Date(item.modifiedTime || Date.now()),
        thumbnailLink: item.thumbnailLink ? item.thumbnailLink.replace('=s220', '=s600') : undefined,
      };
    } catch (error) {
      this.logger.error(`[GoogleDrive] getFileMetadata error: ${error.message}`);
      return null;
    }
  }

  /**
   * Tạo permission public để ai cũng có thể xem link (nếu service account có quyền)
   */
  async makeFilePublic(fileId: string): Promise<void> {
    if (!this.driveClient) return;
    try {
      await this.driveClient.permissions.create({
        fileId,
        supportsAllDrives: true,
        requestBody: { role: 'reader', type: 'anyone' },
      });
    } catch (error) {
      this.logger.warn(`[GoogleDrive] makeFilePublic failed for ${fileId}: ${error.message}`);
    }
  }

  /**
   * Tải thumbnail từ Google Drive về Buffer
   */
  async downloadThumbnail(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`[GoogleDrive] Error downloading thumbnail: ${error.message}`);
      return null;
    }
  }

  /**
   * Upload một file cục bộ lên Google Drive
   * @param filePath Đường dẫn tới file cần upload
   * @param folderId ID của thư mục trên Google Drive để lưu file
   */
  async uploadFile(filePath: string, folderId: string): Promise<DriveFileInfo | null> {
    if (!this.driveClient) {
      this.logger.warn('[GoogleDrive] Drive client not initialized. Cannot upload file.');
      return null;
    }

    try {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.epub') mimeType = 'application/epub+zip';
      else if (ext === '.mobi') mimeType = 'application/x-mobipocket-ebook';

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };
      
      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      };

      this.logger.log(`[GoogleDrive] Uploading ${fileName} to folder ${folderId}...`);
      
      const response = await this.driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, modifiedTime',
        supportsAllDrives: true,
      });

      const item = response.data;
      if (!item.id || !item.name) return null;

      this.logger.log(`[GoogleDrive] Successfully uploaded ${fileName} (ID: ${item.id})`);
      
      return {
        id: item.id,
        name: item.name,
        mimeType: item.mimeType || mimeType,
        size: parseInt(item.size || '0', 10),
        webViewLink: item.webViewLink || '',
        webContentLink: item.webContentLink || '',
        modifiedTime: new Date(item.modifiedTime || Date.now()),
      };
    } catch (error) {
      this.logger.error(`[GoogleDrive] Failed to upload file ${filePath}: ${error.message}`);
      return null;
    }
  }
}
