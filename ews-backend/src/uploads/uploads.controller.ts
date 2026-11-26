import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { existsSync } from 'fs';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Local-disk file upload used by Home Visit photos and Intervention
 * attachments (BR-15, BR-16).
 *
 * SECURITY:
 * 1. Whitelist ekstensi & MIME type (hanya JPG, PNG, WEBP, PDF).
 * 2. Nama file acak kriptografis (mencegah path traversal & enumerasi).
 * 3. Penyajian berkas dilindungi JwtAuthGuard (UU PDP No. 27/2022).
 */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${randomBytes(16).toString('hex')}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Jenis file tidak diizinkan. Hanya JPG, PNG, WEBP, atau PDF.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan atau jenis file tidak diizinkan.');
    }
    return {
      fileName: file.filename,
      url: `/api/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  // SECURITY: Akses berkas lampiran kasus & foto kunjungan rumah wajib melalui
  // autentikasi (JwtAuthGuard) untuk melindungi privasi anak (UU PDP).
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = basename(filename);
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = join(process.cwd(), uploadDir, safeFilename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Berkas tidak ditemukan');
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.sendFile(filePath);
  }
}
