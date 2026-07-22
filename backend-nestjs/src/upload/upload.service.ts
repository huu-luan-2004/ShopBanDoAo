import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { randomBytes } from 'crypto';

/** File từ multer memoryStorage */
export interface MemoryUploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client | null = null;

  constructor(private readonly config: ConfigService) {
    this.initS3Client();
  }

  /** Khởi tạo AWS S3 Client */
  private initS3Client() {
    const region = this.config.get<string>('AWS_REGION')?.trim();
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY')?.trim();

    if (region && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('AWS S3 Client đã được khởi tạo thành công!');
    } else {
      this.logger.warn('Khai báo AWS S3 chưa đủ trong biến môi trường!');
    }
  }

  /** Tải file lên AWS S3 */
  private async uploadToS3(file: MemoryUploadedFile): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 Client chưa được cấu hình đúng.');
    }

    const bucketName = this.config.get<string>('AWS_S3_BUCKET_NAME')?.trim();
    const cloudFrontDomain = this.config.get<string>('CLOUDFRONT_DOMAIN')?.trim(); // Ví dụ: d12345.cloudfront.net hoặc https://cdn.yourdomain.com
    const region = this.config.get<string>('AWS_REGION')?.trim();

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME chưa được khai báo.');
    }

    const ext = extname(file.originalname) || '.jpg';
    const key = `shop-uploads/${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    // Trả về CloudFront URL (nếu có cấu hình) hoặc trả về direct S3 URL
    if (cloudFrontDomain) {
      const domain = cloudFrontDomain.replace(/\/+$/, '');
      const prefix = domain.startsWith('http') ? domain : `https://${domain}`;
      return `${prefix}/${key}`;
    }

    // Direct S3 URL fallback
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  async uploadFile(file: MemoryUploadedFile | undefined) {
    if (!file?.buffer) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    try {
      const url = await this.uploadToS3(file);
      return {
        message: 'Tải ảnh thành công',
        success: true,
        url,
      };
    } catch (e) {
      this.logger.error(
        `uploadFile Error: ${e instanceof Error ? e.message : String(e)}`,
      );
      return {
        message: 'Tải ảnh thất bại',
        success: false,
      };
    }
  }

  async uploadMultipleFiles(files: MemoryUploadedFile[] | undefined) {
    if (!files?.length) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    try {
      const urls: string[] = [];
      for (const f of files) {
        if (f?.buffer) {
          const url = await this.uploadToS3(f);
          urls.push(url);
        }
      }
      if (urls.length === 0) {
        return { message: 'Không có file hợp lệ', success: false };
      }
      return {
        message: 'Tải các ảnh thành công',
        success: true,
        urls,
      };
    } catch (e) {
      this.logger.error(
        `uploadMultipleFiles Error: ${e instanceof Error ? e.message : String(e)}`,
      );
      return {
        message: 'Tải ảnh thất bại',
        success: false,
      };
    }
  }
}