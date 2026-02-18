import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { UploadedFile } from './types/file.interface';

const MAX_LONGEST_SIDE_PX = 1600;
const WEBP_QUALITY = 85;
const ALLOWED_INPUT_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const OUTPUT_MIME = 'image/webp';

@Injectable()
export class ImageOptimizerService {
  async optimize(file: UploadedFile): Promise<UploadedFile> {
    const inputMime = file.mimetype.toLowerCase();
    if (!ALLOWED_INPUT_MIMES.includes(inputMime)) {
      return file;
    }

    try {
      let pipeline = sharp(file.buffer, { failOnError: true });
      pipeline = pipeline.rotate();
      const meta = await pipeline.metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      const longest = Math.max(width, height);
      const needResize = longest > MAX_LONGEST_SIDE_PX;

      if (needResize) {
        pipeline = pipeline.resize(MAX_LONGEST_SIDE_PX, MAX_LONGEST_SIDE_PX, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const outBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

      const baseName = file.originalname.replace(/\.[^.]+$/i, '');
      return {
        ...file,
        buffer: outBuffer,
        mimetype: OUTPUT_MIME,
        originalname: `${baseName}.webp`,
        size: outBuffer.length,
      };
    } catch {
      return file;
    }
  }
}
