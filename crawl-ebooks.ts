import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const SAVE_LOCAL_ONLY = true; // Bật cờ này để chỉ lưu ở local và bỏ qua Google Drive
const LOCAL_DOWNLOAD_DIR = path.join(__dirname, 'downloads');

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const projectId = process.env.GOOGLE_PROJECT_ID;
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

if (!SAVE_LOCAL_ONLY && (!clientEmail || !privateKey || !projectId || !folderId)) {
  console.error('Missing Google Drive configuration in .env');
  process.exit(1);
}

let driveClient: any;
if (!SAVE_LOCAL_ONLY) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    projectId: projectId,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
}

async function uploadFile(filePath: string, folderId: string) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  let mimeType = 'application/octet-stream';
  if (ext === '.pdf') mimeType = 'application/pdf';
  else if (ext === '.epub') mimeType = 'application/epub+zip';

  console.log(`[GoogleDrive] Uploading ${fileName}...`);
  try {
    const response = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      },
      fields: 'id, name',
      supportsAllDrives: true,
    });
    console.log(`[GoogleDrive] Uploaded ${fileName} successfully (ID: ${response.data.id})`);
    return response.data;
  } catch (err: any) {
    console.error(`[GoogleDrive] Failed to upload ${fileName}: ${err.message}`);
    return null;
  }
}

async function processSingleBook(title: string, fileUrl: string) {
  let targetFilePath = '';
  try {
    let pathname = '';
    try {
      pathname = new URL(fileUrl).pathname;
    } catch {
      pathname = fileUrl;
    }
    const ext = path.extname(pathname) || '.pdf';
    const safeTitle = title.replace(/[^\w\s-]/gi, '_');
    const fileName = `${safeTitle}${ext}`;

    if (SAVE_LOCAL_ONLY) {
      if (!fs.existsSync(LOCAL_DOWNLOAD_DIR)) {
        fs.mkdirSync(LOCAL_DOWNLOAD_DIR, { recursive: true });
      }
      targetFilePath = path.join(LOCAL_DOWNLOAD_DIR, fileName);
    } else {
      targetFilePath = path.join(os.tmpdir(), fileName);
    }

    console.log(`[Crawler] Downloading: ${title} from ${fileUrl}`);

    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const writer = fs.createWriteStream(targetFilePath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    if (SAVE_LOCAL_ONLY) {
      console.log(`[Crawler] Saved locally: ${targetFilePath}`);
    } else {
      await uploadFile(targetFilePath, folderId as string);
    }
  } catch (error: any) {
    console.error(`[Crawler] Skipped ${title} - Error: ${error.message}`);
  } finally {
    if (!SAVE_LOCAL_ONLY && targetFilePath && fs.existsSync(targetFilePath)) {
      fs.unlinkSync(targetFilePath);
    }
  }
}

async function startCrawl(url: string) {
  try {
    console.log(`[Crawler] Fetching markdown from: ${url}`);
    const { data: markdownContent } = await axios.get<string>(url);

    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+\.(?:pdf|epub))\)/gi;
    let match;
    const downloadList: { title: string; url: string }[] = [];

    while ((match = linkRegex.exec(markdownContent)) !== null) {
      downloadList.push({
        title: match[1].trim(),
        url: match[2],
      });
    }

    console.log(`[Crawler] Found ${downloadList.length} direct links to ebooks.`);

    // Bỏ giới hạn, tải toàn bộ danh sách
    for (const item of downloadList) {
      await processSingleBook(item.title, item.url);
    }

    console.log('[Crawler] Done!');
  } catch (error: any) {
    console.error(`[Crawler] Global Error: ${error.message}`);
  }
}

// Example URL: Programming languages free programming books
const targetUrl = 'https://raw.githubusercontent.com/EbookFoundation/free-programming-books/main/books/free-programming-books-langs.md';
startCrawl(targetUrl);
