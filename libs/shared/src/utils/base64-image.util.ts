import { BadRequestException } from '@nestjs/common';

export const BASE64_IMAGE_ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
export const BASE64_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const DATA_URL_IMAGE_REGEX = /^data:image\/([a-z]+);base64,(.+)$/i;

export function isBase64Image(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  if (DATA_URL_IMAGE_REGEX.test(value)) return true;
  if (value.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(value) && !value.startsWith('http'))
    return true;
  return false;
}

export function parseBase64ToFile(value: string): { buffer: Buffer; mimetype: string } {
  const dataUrlMatch = value.match(DATA_URL_IMAGE_REGEX);
  if (dataUrlMatch) {
    const ext = dataUrlMatch[1].toLowerCase();
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const buffer = Buffer.from(dataUrlMatch[2], 'base64');
    return { buffer, mimetype: mime };
  }
  const buffer = Buffer.from(value, 'base64');
  return { buffer, mimetype: 'image/png' };
}

/**
 * Validates a base64 image string.
 * Throws BadRequestException if the format or size is invalid.
 * Returns the parsed buffer and mimetype.
 */
export function validateBase64Image(value: string): { buffer: Buffer; mimetype: string } {
  let buffer: Buffer;
  let mimetype: string;
  try {
    const parsed = parseBase64ToFile(value);
    buffer = parsed.buffer;
    mimetype = parsed.mimetype;
  } catch {
    throw new BadRequestException('Invalid base64 image data');
  }
  if (!BASE64_IMAGE_ALLOWED_MIMES.includes(mimetype)) {
    throw new BadRequestException(
      'Invalid image format. Only png, jpg, jpeg and webp are allowed',
    );
  }
  if (buffer.length > BASE64_IMAGE_MAX_BYTES) {
    throw new BadRequestException('Image size exceeds 5MB limit');
  }
  return { buffer, mimetype };
}
